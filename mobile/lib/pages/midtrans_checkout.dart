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
  bool _isFinishing = false;
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

  void _initWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _isLoading = true);
          },
          onPageFinished: (url) {
            if (mounted) setState(() => _isLoading = false);
            _handlePaymentRedirect(url);
          },
          onWebResourceError: (error) {
            if (!mounted) return;
            if (error.isForMainFrame ?? false) {
              setState(() => _isLoading = false);
            }
          },
          onNavigationRequest: (request) {
            final uri = Uri.tryParse(request.url);

            // Tolong izinkan halaman web biasa dan halaman kosong internal.
            if (uri != null &&
                (uri.scheme == 'https' ||
                    uri.scheme == 'http' ||
                    uri.scheme == 'about')) {
              _handlePaymentRedirect(request.url);
              return NavigationDecision.navigate;
            }

            // Deep link (mis. intent://, tel:, mailto:) tidak didukung WebView.
            debugPrint("Midtrans: skema navigasi diblokir: ${request.url}");
            return NavigationDecision.prevent;
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

  Future<bool> _isInvoicePaid({int attempts = 1}) async {
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
        await Future.delayed(const Duration(seconds: 2));
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

    setState(() => _isCheckingStatus = true);

    // Beri kesempatan notifikasi Midtrans masuk sebelum menyimpulkan.
    final paid = await _isInvoicePaid(attempts: 3);

    if (!mounted) return;

    setState(() => _isCheckingStatus = false);

    if (paid) {
      _finishPayment(paid: true);
      return;
    }

    final shouldClose = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text("Pembayaran Belum Terkonfirmasi"),
          content: const Text(
            "Status pembayaran belum diterima dari Midtrans. Jika Anda yakin "
            "pembayaran sudah berhasil, tunggu beberapa saat lalu cek kembali "
            "statusnya. Tutup halaman pembayaran sekarang?",
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text("Cek Lagi"),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(dialogContext, true),
              child: const Text("Tutup"),
            ),
          ],
        );
      },
    );

    if (shouldClose == true && mounted) {
      _finishPayment(paid: false);
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
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
                WebViewWidget(controller: _controller),
                if (_isLoading)
                  const Center(child: CircularProgressIndicator()),
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
