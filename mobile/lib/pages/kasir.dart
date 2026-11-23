import 'package:flutter/material.dart';
import 'package:mobile/pages/auth/login.dart';
import 'package:mobile/pages/invoice.dart';
import 'package:mobile/service/api.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:intl/intl.dart';
import 'package:flutter/services.dart';
import 'package:mobile/enums/payment_method.dart';
import 'package:mobile/pages/midtrans_checkout.dart';

class KasirPage extends StatefulWidget {
  const KasirPage({super.key});

  @override
  State<KasirPage> createState() => _KasirPageState();
}

class _KasirPageState extends State<KasirPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor:
            Colors.white, // Mengatur warna teks dan ikon bawaan menjadi putih
        title: Row(
          children: [
            // 1. Gambar Logo
            Container(
              height: 50,
              width: 50,
              child: Image.asset(
                'images/logoPutih2.png',
                width: 45,
                height: 45,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(width: 12), // Jarak antara logo dan teks
            // 2. Teks Judul
            Column(
              children: [
                FutureBuilder(
                  future: ApiService.getUserData(),
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return CircularProgressIndicator();
                    }
                    if (snapshot.hasError) {
                      return Text("Error: ${snapshot.error}");
                    }

                    if (snapshot.hasData) {
                      final name = snapshot.data!["nama_depan"];
                      final role = snapshot.data!["role"];
                      return Column(
                        children: [
                          Text(name),
                          Row(
                            spacing: 10,
                            children: [
                              Container(
                                height: 5,
                                width: 5,
                                decoration: BoxDecoration(
                                  color: Colors.green,
                                  borderRadius: BorderRadius.all(
                                    Radius.circular(100),
                                  ),
                                ),
                              ),
                              Text(role, style: TextStyle(fontSize: 15)),
                            ],
                          ),
                        ],
                      );
                    }

                    return Text("Tidak ada data");
                  },
                ),
              ],
            ),
          ],
        ),
        actions: [
          // Opsional: Tombol logout atau keranjang di pojok kanan AppBar
          IconButton(
            onPressed: () {
              ApiService.logout();
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => const LoginPage()),
              );
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: Scaner(),
    );
  }
}

class Scaner extends StatefulWidget {
  const Scaner({super.key});

  @override
  State<Scaner> createState() => _ScanerState();
}

class _ScanerState extends State<Scaner> {
  Map<String, dynamic>? transactionResult;
  final TextEditingController _paidAmountController = TextEditingController();
  Barcode? _barcode;

  // Invoice non-tunai yang sudah dibuat tetapi pembayarannya belum selesai.
  String? _pendingInvoiceNumber;
  String? _pendingRedirectUrl;

  // Data sementara keranjang
  final List<Map<String, dynamic>> cart = [];

  // Mencegah barcode yang sama diproses berkali-kali
  final Set<String> _processingBarcode = {};
  final Map<String, DateTime> _lastScanAt = {};

  bool _isCheckoutLoading = false;

  final NumberFormat _currencyFormat = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp ',
    decimalDigits: 0,
  );

  String formatRupiah(num value) {
    return _currencyFormat.format(value);
  }

  // Mengambil produk dari backend berdasarkan barcode
  Future<void> addProduct(String barcode) async {
    if (_processingBarcode.contains(barcode)) return;

    // Debounce: kamera bisa mendeteksi barcode yang sama berkali-kali.
    final now = DateTime.now();
    final lastScan = _lastScanAt[barcode];

    if (lastScan != null && now.difference(lastScan).inMilliseconds < 1200) {
      return;
    }

    _lastScanAt[barcode] = now;
    _processingBarcode.add(barcode);

    try {
      // Diasumsikan ApiService.get mengembalikan JSON Map.
      final response = await ApiService.get(
        "/product/barcode/${Uri.encodeComponent(barcode)}",
      );

      debugPrint("RESPONSE TYPE: ${response.runtimeType}");
      debugPrint("RESPONSE: $response");

      if (!mounted) return;

      // Sesuaikan jika ApiService.get lu membungkus response dengan format lain.
      if (response["success"] != true) {
        throw Exception(response["message"] ?? "Produk tidak ditemukan");
      }

      final Map<String, dynamic> product = Map<String, dynamic>.from(
        response["data"] as Map,
      );

      final productPrice =
          double.tryParse(product["price"]?.toString() ?? "") ?? 0;
      final productStock =
          int.tryParse(product["stock"]?.toString() ?? "") ?? 0;
      final productBarcode = product["barcode"]?.toString() ?? barcode;

      if (productStock <= 0) {
        throw Exception("Stok produk habis");
      }

      setState(() {
        final index = cart.indexWhere(
          (item) => item["barcode"] == productBarcode,
        );

        if (index != -1) {
          // Produk sudah ada, quantity ditambah.
          final currentQty = cart[index]["quantity"] as int;
          final stock = cart[index]["stock"] as int;

          if (currentQty < stock) {
            cart[index]["quantity"] = currentQty + 1;
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text("Jumlah barang sudah mencapai batas stok"),
              ),
            );
          }
        } else {
          // Produk baru masuk keranjang.
          cart.add({
            "id": product["id"],
            "name": product["name"]?.toString() ?? "Tanpa nama",
            "description": product["description"]?.toString() ?? "",
            "barcode": productBarcode,
            "price": productPrice,
            "stock": productStock,
            "imageUrl": product["imageUrl"],
            "quantity": 1,
          });
        }
      });
    } catch (error, stackTrace) {
      debugPrint("STACK TRACE: $stackTrace");
      debugPrint("ERROR SCAN: $error");
      if (!mounted) return;

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      _processingBarcode.remove(barcode);
    }
  }

  // Quantity bertambah
  void increaseQuantity(int index) {
    setState(() {
      final quantity = cart[index]["quantity"] as int;
      final stock = cart[index]["stock"] as int;

      if (quantity < stock) {
        cart[index]["quantity"] = quantity + 1;
      }
    });
  }

  // Quantity berkurang, minimal 1
  void decreaseQuantity(int index) {
    setState(() {
      final quantity = cart[index]["quantity"] as int;

      if (quantity > 1) {
        cart[index]["quantity"] = quantity - 1;
      }
    });
  }

  // Hapus produk dari keranjang
  void removeProduct(int index) {
    setState(() {
      cart.removeAt(index);
    });
  }

  // Hitung subtotal satu produk
  double getSubtotal(Map<String, dynamic> item) {
    final price = item["price"] as double;
    final quantity = item["quantity"] as int;

    return price * quantity;
  }

  // Hitung seluruh barang yang dibeli
  int get totalQuantity {
    return cart.fold(0, (total, item) => total + (item["quantity"] as int));
  }

  // Hitung total pembayaran
  double get totalPrice {
    return cart.fold(0, (total, item) => total + getSubtotal(item));
  }

  void showTransactionResult({required bool success, required String message}) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                success ? Icons.check_circle : Icons.cancel,
                size: 75,
                color: success ? Colors.green : Colors.red,
              ),

              const SizedBox(height: 15),

              Text(
                success ? "Transaksi Berhasil!" : "Transaksi Gagal!",
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),

              const SizedBox(height: 10),

              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.black54),
              ),

              const SizedBox(height: 20),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: success ? Colors.green : Colors.red,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: () {
                    Navigator.pop(dialogContext);
                  },
                  child: const Text("Mengerti"),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  String _plainAmount(num value) => value.toStringAsFixed(2);

  Future<void> _openInvoice(String invoiceNumber) async {
    if (!mounted) return;

    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => InvoicePage(invoiceNumber: invoiceNumber),
      ),
    );
  }

  // Kirim transaksi ke backend
  Future<void> transaksi({
    required String paidAmount,
    required PaymentMethod paymentMethod,
  }) async {
    if (cart.isEmpty) {
      _showSnackBar("Keranjang masih kosong");
      return;
    }

    if (_isCheckoutLoading) return;

    final parsedPaidAmount = double.tryParse(paidAmount) ?? 0;

    if (paymentMethod == PaymentMethod.tunai && parsedPaidAmount < totalPrice) {
      _showSnackBar("Nominal pembayaran kurang!");
      return;
    }

    setState(() => _isCheckoutLoading = true);

    try {
      // 1. Buat penjualan terlebih dahulu.
      // Total sebenarnya tetap dihitung ulang oleh backend dari harga produk,
      // jadi nilai dari klien tidak bisa dipakai untuk memanipulasi total.
      final data = {
        "items": cart.map((item) {
          return {
            "barcode": item["barcode"].toString(),
            "quantity": item["quantity"] as int,
          };
        }).toList(),

        "paidAmount": _plainAmount(parsedPaidAmount),
        "paymentMethod": paymentMethod.value,

        // Tunai langsung selesai.
        // Non-tunai menunggu pembayaran Midtrans.
        "status": paymentMethod == PaymentMethod.tunai ? "selesai" : "menunggu",
      };

      final saleResponse = await ApiService.post("/product/sale", data);

      if (!mounted) return;

      if (saleResponse["success"] != true) {
        throw Exception(saleResponse["message"] ?? "Gagal membuat penjualan");
      }

      final saleData = Map<String, dynamic>.from(saleResponse["data"] as Map);
      final invoiceNumber = saleData["invoiceNumber"].toString();

      // Keranjang dikosongkan setelah penjualan berhasil dibuat.
      setState(() {
        transactionResult = saleData;
        cart.clear();
        _barcode = null;

        // Simpan invoice non-tunai agar pembayaran bisa dilanjutkan
        // jika pembuatan transaksi Midtrans gagal.
        if (paymentMethod == PaymentMethod.midtrans) {
          _pendingInvoiceNumber = invoiceNumber;
        }
      });

      // 2. Jika tunai, selesaikan langsung.
      if (paymentMethod == PaymentMethod.tunai) {
        showTransactionResult(
          success: true,
          message:
              saleResponse["message"] ?? "Pembayaran tunai berhasil diproses.",
        );

        await _openInvoice(invoiceNumber);
        return;
      }

      // 3. Jika non-tunai, buat transaksi Snap lalu buka halaman pembayaran.
      final redirectUrl = await _createMidtransPayment(invoiceNumber);

      if (!mounted) return;

      setState(() => _pendingRedirectUrl = redirectUrl);

      final paid = await _openMidtransCheckout(invoiceNumber, redirectUrl);

      if (!mounted) return;

      if (!paid) {
        _showSnackBar(
          "Pembayaran belum selesai. Gunakan tombol \"Lanjutkan Pembayaran\" "
          "untuk mencoba lagi.",
        );
        return;
      }

      await _completePendingPayment(invoiceNumber);
    } catch (error, stackTrace) {
      debugPrint("CHECKOUT ERROR: $error");
      debugPrint("STACK TRACE: $stackTrace");

      if (!mounted) return;

      showTransactionResult(success: false, message: error.toString());
    } finally {
      if (mounted) {
        setState(() => _isCheckoutLoading = false);
      }
    }
  }

  Future<bool> _isInvoicePaid(String invoiceNumber) async {
    try {
      final response = await ApiService.get(
        "/product/invoice/${Uri.encodeComponent(invoiceNumber)}",
      );

      return response is Map && response["success"] == true;
    } catch (_) {
      return false;
    }
  }

  Future<String> _createMidtransPayment(String invoiceNumber) async {
    final paymentResponse = await ApiService.post("/payment/create", {
      "invoiceNumber": invoiceNumber,
    });

    if (!mounted) return "";

    if (paymentResponse["success"] != true) {
      throw Exception(
        paymentResponse["message"] ?? "Gagal membuat pembayaran Midtrans",
      );
    }

    final redirectUrl = paymentResponse["redirect_url"]?.toString();

    if (redirectUrl == null || redirectUrl.trim().isEmpty) {
      throw Exception("URL pembayaran Midtrans tidak ditemukan");
    }

    return redirectUrl;
  }

  Future<bool> _openMidtransCheckout(
    String invoiceNumber,
    String redirectUrl,
  ) async {
    if (!mounted) return false;

    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => MidtransCheckoutPage(
          redirectUrl: redirectUrl,
          invoiceNumber: invoiceNumber,
        ),
      ),
    );

    return result == true;
  }

  Future<void> _completePendingPayment(String invoiceNumber) async {
    if (!mounted) return;

    setState(() {
      _pendingInvoiceNumber = null;
      _pendingRedirectUrl = null;
    });

    showTransactionResult(
      success: true,
      message: "Pembayaran non-tunai berhasil diproses.",
    );

    await _openInvoice(invoiceNumber);
  }

  // Melanjutkan pembayaran non-tunai yang sebelumnya belum selesai.
  Future<void> _resumeMidtransPayment() async {
    final invoiceNumber = _pendingInvoiceNumber;

    if (invoiceNumber == null || _isCheckoutLoading) return;

    setState(() => _isCheckoutLoading = true);

    try {
      // Notifikasi bisa saja sudah masuk sejak halaman ditutup.
      if (await _isInvoicePaid(invoiceNumber)) {
        await _completePendingPayment(invoiceNumber);
        return;
      }

      if (!mounted) return;

      // Gunakan kembali URL Snap yang sama agar tidak membuat order baru.
      var redirectUrl = _pendingRedirectUrl;

      if (redirectUrl == null) {
        redirectUrl = await _createMidtransPayment(invoiceNumber);

        if (!mounted) return;

        setState(() => _pendingRedirectUrl = redirectUrl);
      }

      final paid = await _openMidtransCheckout(invoiceNumber, redirectUrl);

      if (!mounted) return;

      if (!paid) {
        _showSnackBar("Pembayaran masih belum selesai.");
        return;
      }

      await _completePendingPayment(invoiceNumber);
    } catch (error, stackTrace) {
      debugPrint("RESUME PAYMENT ERROR: $error");
      debugPrint("STACK TRACE: $stackTrace");

      if (!mounted) return;

      // Jika error terjadi karena invoice sudah dibayar, anggap sukses.
      if (await _isInvoicePaid(invoiceNumber)) {
        await _completePendingPayment(invoiceNumber);
        return;
      }

      showTransactionResult(success: false, message: error.toString());
    } finally {
      if (mounted) {
        setState(() => _isCheckoutLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _paidAmountController.dispose();
    super.dispose();
  }

  void showPaymentDialog() {
    _paidAmountController.clear();

    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text("Pembayaran Tunai"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text("Total: ${formatRupiah(totalPrice)}"),

              const SizedBox(height: 15),

              TextField(
                controller: _paidAmountController,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(
                  labelText: "Nominal pembayaran",
                  prefixText: "Rp ",
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text("Batal"),
            ),
            ElevatedButton(
              onPressed: () {
                final paidAmount = _paidAmountController.text
                    .replaceAll(".", "")
                    .replaceAll(",", "");

                final parsedPaidAmount = double.tryParse(paidAmount);

                if (parsedPaidAmount == null || parsedPaidAmount < totalPrice) {
                  _showSnackBar("Nominal pembayaran kurang!");
                  return;
                }

                Navigator.pop(dialogContext);

                transaksi(
                  paidAmount: paidAmount,
                  paymentMethod: PaymentMethod.tunai,
                );
              },
              child: const Text("Bayar"),
            ),
          ],
        );
      },
    );
  }

  void showPaymentMethodDialog() {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text("Metode Pembayaran"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.money),
                title: const Text("Tunai"),
                subtitle: const Text("Pembayaran menggunakan uang tunai"),
                onTap: () {
                  Navigator.pop(dialogContext);
                  showPaymentDialog();
                },
              ),
              ListTile(
                leading: const Icon(Icons.credit_card),
                title: const Text("Non-Tunai"),
                subtitle: const Text("Pembayaran melalui Midtrans"),
                onTap: () {
                  Navigator.pop(dialogContext);

                  transaksi(
                    paidAmount: _plainAmount(totalPrice),
                    paymentMethod: PaymentMethod.midtrans,
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _handleBarcode(BarcodeCapture capture) {
    if (!mounted || _isCheckoutLoading || capture.barcodes.isEmpty) return;

    final barcode = capture.barcodes.first;
    final code = barcode.rawValue;

    if (code == null || code.isEmpty) return;

    setState(() {
      _barcode = barcode;
    });

    addProduct(code);
  }

  Widget _barcodePreview(Barcode? value) {
    if (value == null) {
      return const Text(
        "Scan produk untuk menambahkannya ke keranjang",
        style: TextStyle(color: Colors.black54),
      );
    }

    return Text(
      value.displayValue ?? "Barcode tidak terbaca",
      style: const TextStyle(
        color: Colors.black87,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  // Tampilan satu produk dalam keranjang
  Widget _cartItem(int index) {
    final item = cart[index];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Gambar produk
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.network(
              item["imageUrl"] ?? "",
              width: 65,
              height: 65,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  width: 65,
                  height: 65,
                  color: Colors.grey.shade200,
                  child: const Icon(Icons.image_not_supported),
                );
              },
            ),
          ),

          const SizedBox(width: 10),

          // Nama, deskripsi, dan harga
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item["name"],
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  item["description"],
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11, color: Colors.black54),
                ),
                const SizedBox(height: 5),
                Text(
                  formatRupiah(item["price"]),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 8),

          // Tombol quantity
          Column(
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _quantityButton(
                    icon: Icons.remove,
                    onTap: () => decreaseQuantity(index),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Text(
                      "${item["quantity"]}",
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                  _quantityButton(
                    icon: Icons.add,
                    onTap: () => increaseQuantity(index),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                formatRupiah(getSubtotal(item)),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 11,
                ),
              ),
              IconButton(
                onPressed: () => removeProduct(index),
                icon: const Icon(
                  Icons.delete_outline,
                  color: Colors.red,
                  size: 19,
                ),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _quantityButton({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.all(5),
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Icon(icon, size: 15),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 14),
              child: Row(
                children: [
                  const Icon(Icons.barcode_reader, size: 30),
                  const SizedBox(width: 12),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Scanner",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        "Scan produk disini!!",
                        style: TextStyle(fontSize: 13),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Kamera scanner
            Container(
              width: 350,
              height: 220,
              margin: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.grey.shade300, width: 2),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: MobileScanner(onDetect: _handleBarcode),
              ),
            ),

            const SizedBox(height: 10),

            _barcodePreview(_barcode),

            const SizedBox(height: 16),

            // Judul keranjang
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  const Text(
                    "Keranjang Belanja",
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                  ),
                  const Spacer(),
                  Text(
                    "$totalQuantity barang",
                    style: const TextStyle(
                      color: Colors.black54,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // Daftar produk
            Expanded(
              child: cart.isEmpty
                  ? const Center(
                      child: Text(
                        "Belum ada produk di keranjang",
                        style: TextStyle(color: Colors.black45),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: cart.length,
                      itemBuilder: (context, index) {
                        return _cartItem(index);
                      },
                    ),
            ),

            // Ringkasan pembayaran
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -3),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Text(
                        "Total barang",
                        style: TextStyle(color: Colors.black54),
                      ),
                      const Spacer(),
                      Text("$totalQuantity barang"),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Text(
                        "Total pembayaran",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        formatRupiah(totalPrice),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  if (_pendingInvoiceNumber != null) ...[
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.orange.shade200),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "Pembayaran non-tunai tertunda",
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "Invoice: $_pendingInvoiceNumber",
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.black54,
                            ),
                          ),
                          const SizedBox(height: 8),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed: _isCheckoutLoading
                                  ? null
                                  : _resumeMidtransPayment,
                              icon: const Icon(Icons.refresh, size: 18),
                              label: const Text("Lanjutkan Pembayaran"),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: cart.isEmpty || _isCheckoutLoading
                          ? null
                          : showPaymentMethodDialog,
                      child: _isCheckoutLoading
                          ? const CircularProgressIndicator()
                          : const Text("Lanjutkan Transaksi"),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
