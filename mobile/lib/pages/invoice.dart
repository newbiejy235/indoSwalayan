import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile/service/api.dart';
import 'package:intl/date_symbol_data_local.dart';

class InvoicePage extends StatefulWidget {
  final String invoiceNumber;

  const InvoicePage({super.key, required this.invoiceNumber});

  @override
  State<InvoicePage> createState() => _InvoicePageState();
}

class _InvoicePageState extends State<InvoicePage> {
  Map<String, dynamic>? invoiceData;

  bool isLoading = true;
  String? errorMessage;

  final currencyFormat = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp ',
    decimalDigits: 0,
  );

  @override
  void initState() {
    super.initState();
    initializeDateFormatting('id_ID', null).then((_) {
      if (mounted) {
        setState(() {});
      }
    });

    getInvoice();
  }

  Future<void> getInvoice() async {
    try {
      final response = await ApiService.get(
        "/product/invoice/${Uri.encodeComponent(widget.invoiceNumber)}",
      );

      if (!mounted) return;

      if (response["success"] == true) {
        setState(() {
          invoiceData = Map<String, dynamic>.from(response["data"]);
          isLoading = false;
        });
      } else {
        setState(() {
          errorMessage = response["message"] ?? "Invoice tidak ditemukan";
          isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;

      setState(() {
        errorMessage = "Gagal mengambil data invoice: $e";
        isLoading = false;
      });
    }
  }

  // Mengubah nominal dari String menjadi format Rupiah.
  String formatRupiah(dynamic value) {
    final amount = double.tryParse(value.toString()) ?? 0;
    return currencyFormat.format(amount);
  }

  // Menghitung total belanja dari seluruh item.
  double getTotal() {
    if (invoiceData == null) return 0;

    final items = invoiceData!["items"] as List;

    return items.fold<double>(0, (total, item) {
      final subtotal = double.tryParse(item["subTotal"].toString()) ?? 0;

      return total + subtotal;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (errorMessage != null) {
      return Scaffold(
        appBar: AppBar(title: const Text("Invoice")),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.receipt_long, size: 60, color: Colors.grey),
                const SizedBox(height: 12),
                Text(errorMessage!, textAlign: TextAlign.center),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    setState(() {
                      isLoading = true;
                      errorMessage = null;
                    });
                    getInvoice();
                  },
                  child: const Text("Coba Lagi"),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final items = invoiceData!["items"] as List;
    final total = getTotal();

    final paidAmount =
        double.tryParse(invoiceData!["paidAmount"].toString()) ?? 0;

    final change = paidAmount - total;

    return Scaffold(
      backgroundColor: const Color(0xFFF2F3F5),
      appBar: AppBar(
        title: const Text("Detail Transaksi"),
        centerTitle: true,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 450),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 15,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // HEADER TOKO
                  const Icon(Icons.storefront, size: 45, color: Colors.black87),
                  const SizedBox(height: 8),

                  const Text(
                    "INDO SWALAYAN",
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),

                  const SizedBox(height: 4),

                  const Text(
                    "Terima kasih telah berbelanja",
                    style: TextStyle(color: Colors.grey, fontSize: 12),
                  ),

                  const SizedBox(height: 24),
                  const Divider(thickness: 1),

                  // INFORMASI INVOICE
                  _infoRow("No. Invoice", invoiceData!["invoiceNumber"]),
                  _infoRow(
                    "Metode Pembayaran",
                    invoiceData!["paymentMethod"].toString().toUpperCase(),
                  ),
                  _infoRow(
                    "Tanggal",
                    DateFormat(
                      "dd MMMM yyyy, HH:mm",
                      "id_ID",
                    ).format(DateTime.now()),
                  ),

                  const Divider(thickness: 1, height: 30),

                  // DAFTAR PRODUK
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      "DETAIL PEMBELIAN",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        letterSpacing: 1,
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  ...items.map((item) {
                    final name = item["productName"].toString();
                    final qty = int.tryParse(item["qty"].toString()) ?? 0;
                    final price = item["price"];

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 5),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                "$qty x ${formatRupiah(price)}",
                                style: const TextStyle(
                                  color: Colors.grey,
                                  fontSize: 12,
                                ),
                              ),
                              Text(
                                formatRupiah(item["subTotal"]),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  }),

                  const Divider(thickness: 1, height: 20),

                  // TOTAL PEMBELIAN
                  _infoRow("Total Belanja", formatRupiah(total)),

                  _infoRow("Uang Dibayar", formatRupiah(paidAmount)),

                  _infoRow("Kembalian", formatRupiah(change)),

                  const Divider(thickness: 1, height: 30),

                  const Icon(Icons.check_circle, color: Colors.green, size: 45),

                  const SizedBox(height: 8),

                  const Text(
                    "TRANSAKSI BERHASIL",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Colors.green,
                    ),
                  ),

                  const SizedBox(height: 6),

                  const Text(
                    "Simpan struk ini sebagai bukti pembayaran.",
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey, fontSize: 11),
                  ),

                  const SizedBox(height: 24),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                      },
                      icon: const Icon(Icons.arrow_back),
                      label: const Text("Kembali ke Kasir"),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black87,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _infoRow(String title, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(color: Colors.grey, fontSize: 12),
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
