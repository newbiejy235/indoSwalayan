import 'dart:async';

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:mobile/service/api.dart';

class MidtransCheckoutPage extends StatefulWidget {
  final String redirectUrl;
  final String invoiceNumber;

  const MidtransCheckoutPage({
    super.key,
    required this.redirectUrl,
    required this.invoiceNumber,
  });

  @override
  State<MidtransCheckoutPage> createState() => _MidtransCheckoutPageState();
}

class _MidtransCheckoutPageState extends State<MidtransCheckoutPage> {
  static const Duration _pollInterval = Duration(seconds: 3);
  static const Duration _maxPollDuration = Duration(minutes: 10);

  late final WebViewController _controller;
  late final DateTime _startedAt;

  Timer? _pollTimer;

  bool _isLoading = true;
  bool _isCheckingStatus = false;
  bool _isManualChecking = false;
  bool _isFinishing = false;
  bool _webViewFailed = false;
  String? _fatalError;

  @override
  void initState() {
    super.initState();
    _startedAt = DateTime.now();

    if (!_isTrustedPaymentUrl(widget.redirectUrl)) {
      _fatalError = "URL pembayaran tidak valid atau tidak aman.";
      return;
    }

    _initWebView();
    _startPolling();
  }

  // Hanya izinkan URL HTTPS dari domain Midtrans.
  // redirect_url berasal dari backend, validasi ini mencegah WebView
  // memuat URL arbitrer jika response backend termanipulasi.
  bool _isTrustedPaymentUrl(String url) {
    final uri = Uri.tryParse(url.trim());
    if (uri == null || uri.scheme != 'https') return false;

    final host = uri.host.toLowerCase();
    return host == 'midtrans.com' ||
        host.endsWith('.midtrans.com') ||
        host == 'midtrans.co.id' ||
        host.endsWith('.midtrans.co.id');
  }

  // Redirect keluar dari domain Midtrans yang terlihat seperti callback
  // akhir pembayaran. URL seperti ini tidak perlu dimuat di WebView.
  bool _looksLikeFinishRedirect(Uri uri) {
    if (_isTrustedPaymentUrl(uri.toString())) return false;

    final target = '${uri.path}?${uri.query}'.toLowerCase();

    return target.contains('finish') ||
        target.contains('complete') ||
        target.contains('success') ||
        target.contains('callback') ||
        target.contains('return');
  }

  void _initWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) {
              setState(() {
                _isLoading = true;
                _webViewFailed = false;
              });
            }
          },
          onPageFinished: (url) {
            if (mounted) {
              setState(() {
                _isLoading = false;
                _webViewFailed = false;
              });
            }
            _handlePaymentRedirect(url);
          },
          onWebResourceError: (error) {
            if (!mounted) return;

            // Hanya tangani error halaman utama. Error sub-resource
            // (gambar/analytics) tidak boleh menghentikan pembayaran.
            if (error.isForMainFrame ?? false) {
              setState(() {
                _isLoading = false;
                _webViewFailed = true;
              });

              // Bisa jadi pembayaran sudah berhasil tetapi Snap gagal
              // redirect ke finish URL. Cek status invoice.
              _pollStatus();
            }
          },
          onNavigationRequest: (request) {
            final uri = Uri.tryParse(request.url);

            if (uri == null) return NavigationDecision.prevent;

            if (uri.scheme != 'https' &&
                uri.scheme != 'http' &&
                uri.scheme != 'about') {
              // Deep link (mis. intent://, tel:, mailto:) tidak didukung WebView.
              debugPrint("Midtrans: skema navigasi diblokir: ${request.url}");
              return NavigationDecision.prevent;
            }

            // Cegah WebView memuat finish/callback URL milik merchant yang
            // bisa saja tidak tersedia. Status tetap dicek lewat backend.
            if (_looksLikeFinishRedirect(uri)) {
              debugPrint("Midtrans: finish redirect dicegat: ${request.url}");
              _handlePaymentRedirect(request.url);
              return NavigationDecision.prevent;
            }

            _handlePaymentRedirect(request.url);
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.redirectUrl));
  }

  void _startPolling() {
    _pollTimer = Timer.periodic(_pollInterval, (_) async {
      if (!mounted || _isFinishing) return;

      if (DateTime.now().difference(_startedAt) > _maxPollDuration) {
        _pollTimer?.cancel();
        return;
      }

      await _pollStatus();
    });
  }

  void _handlePaymentRedirect(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) return;

    final path = uri.path.toLowerCase();

    // Setelah pengguna menyelesaikan pembayaran, Midtrans biasanya
    // mengarahkan ke halaman finish/success. Notifikasi backend mungkin
    // butuh beberapa detik, jadi polling tetap berjalan.
    if (path.contains('finish') ||
        path.contains('complete') ||
        path.contains('success')) {
      _pollStatus();
    }
  }

  Future<bool> _isInvoicePaid({
    int attempts = 1,
    Duration delay = const Duration(seconds: 2),
  }) async {
    for (var attempt = 0; attempt < attempts; attempt++) {
      try {
        final response = await ApiService.get(
          "/product/invoice/${Uri.encodeComponent(widget.invoiceNumber)}",
        );

        if (response is Map && response["success"] == true) {
          return true;
        }
      } catch (_) {
        // Backend mengembalikan 400 selama status invoice bukan "selesai".
      }

      if (attempt < attempts - 1) {
        await Future.delayed(delay);
      }
    }

    return false;
  }

  Future<void> _pollStatus() async {
    if (_isFinishing || _isCheckingStatus || !mounted) return;

    setState(() => _isCheckingStatus = true);

    try {
      final paid = await _isInvoicePaid();

      if (!mounted) return;

      if (paid) {
        _finishPayment(paid: true);
      }
    } finally {
      if (mounted && !_isFinishing) {
        setState(() => _isCheckingStatus = false);
      }
    }
  }

  void _finishPayment({required bool paid}) {
    if (_isFinishing || !mounted) return;

    _isFinishing = true;
    _pollTimer?.cancel();

    Navigator.pop(context, paid);
  }

  Future<void> _handleManualFinish() async {
    if (_isFinishing || _isCheckingStatus || !mounted) return;

    while (mounted && !_isFinishing) {
      setState(() {
        _isCheckingStatus = true;
        _isManualChecking = true;
      });

      bool paid = false;

      try {
        // Notifikasi Midtrans bersifat asynchronous. Jangan langsung
        // menyimpulkan gagal hanya karena belum masuk dalam beberapa detik.
        paid = await _isInvoicePaid(attempts: 10);
      } finally {
        if (mounted && !_isFinishing) {
          setState(() {
            _isCheckingStatus = false;
            _isManualChecking = false;
          });
        }
      }

      if (!mounted || _isFinishing) return;

      if (paid) {
        _finishPayment(paid: true);
        return;
      }

      final action = await showDialog<String>(
        context: context,
        barrierDismissible: false,
        builder: (dialogContext) {
          return AlertDialog(
            title: const Text("Pembayaran Belum Terkonfirmasi"),
            content: const Text(
              "Server belum menerima konfirmasi pembayaran dari Midtrans. "
              "Jika pembayaran di halaman Midtrans sudah berhasil, jangan "
              "bayar ulang. Tunggu beberapa saat lalu cek status kembali.",
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext, "close"),
                child: const Text("Tutup"),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(dialogContext, "retry"),
                child: const Text("Cek Lagi"),
              ),
            ],
          );
        },
      );

      if (!mounted || _isFinishing) return;

      if (action == "retry") continue;

      if (action == "close") {
        _finishPayment(paid: false);
      }

      return;
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Widget _buildWebViewError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off, size: 64, color: Colors.grey),
            const SizedBox(height: 12),
            const Text(
              "Halaman pembayaran tidak dapat dimuat.",
              textAlign: TextAlign.center,
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            const Text(
              "Pembayaran mungkin sudah berhasil. Cek status pembayaran "
              "terlebih dahulu sebelum menutup halaman ini.",
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.black54, fontSize: 13),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isCheckingStatus ? null : _handleManualFinish,
                icon: const Icon(Icons.refresh),
                label: const Text("Cek Status Pembayaran"),
              ),
            ),
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: () {
                setState(() {
                  _webViewFailed = false;
                  _isLoading = true;
                });
                _controller.loadRequest(Uri.parse(widget.redirectUrl));
              },
              icon: const Icon(Icons.open_in_browser),
              label: const Text("Muat Ulang Halaman"),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text(
          "Pembayaran Midtrans",
          style: TextStyle(fontSize: 18),
        ),
        actions: [
          IconButton(
            tooltip: "Cek Status Pembayaran",
            icon: _isCheckingStatus
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.refresh),
            onPressed: _isCheckingStatus ? null : _handleManualFinish,
          ),
        ],
      ),
      body: _fatalError != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.shield_outlined,
                      size: 64,
                      color: Colors.red,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _fatalError!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 15),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: () => _finishPayment(paid: false),
                      child: const Text("Tutup"),
                    ),
                  ],
                ),
              ),
            )
          : Stack(
              children: [
                if (_webViewFailed)
                  _buildWebViewError()
                else
                  WebViewWidget(controller: _controller),
                if (_isLoading)
                  const Center(child: CircularProgressIndicator()),
                if (_isManualChecking)
                  Positioned.fill(
                    child: ColoredBox(
                      color: Colors.black54,
                      child: Center(
                        child: Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              CircularProgressIndicator(),
                              SizedBox(height: 14),
                              Text(
                                "Mengecek status pembayaran...",
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                              SizedBox(height: 4),
                              Text(
                                "Mohon tunggu sebentar",
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.black54,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
      bottomNavigationBar: _fatalError != null
          ? null
          : Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              color: Colors.white,
              child: SafeArea(
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        "Invoice: ${widget.invoiceNumber}",
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: _isCheckingStatus ? null : _handleManualFinish,
                      child: const Text("Selesai Bayar"),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
