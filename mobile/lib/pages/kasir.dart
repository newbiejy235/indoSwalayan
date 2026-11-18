import 'package:flutter/material.dart';
import 'package:mobile/pages/auth/login.dart';
import 'package:mobile/service/api.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

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
  Barcode? _bacrcode;
  Set<String> scannedProducts = {};

  Future<void> transaksi () async {
    ApiService.post("/product/sale", data)
  }

  Widget _barcodePreview(Barcode? value) {
    if (value == null) {
      return const Text(
        'Scan something!',
        overflow: TextOverflow.fade,
        style: TextStyle(color: Colors.white),
      );
    }

    return Text(
      value.displayValue ?? 'No display value.',
      overflow: TextOverflow.fade,
      style: const TextStyle(color: Colors.white),
    );
  }

  void _handleBarcode(BarcodeCapture capture) {
    if (!mounted || capture.barcodes.isEmpty) return;

    final barcode = capture.barcodes.first;
    final code = barcode.rawValue;

    if (code == null) return;

    setState(() {
      _bacrcode = barcode;

      if (!scannedProducts.contains(code)) {
        scannedProducts.add(code);
      }
    });
    print(scannedProducts);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: EdgeInsets.only(left: 50, right: 50, bottom: 20),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const Icon(Icons.barcode_reader, size: 30),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        "Scanner",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Text(
                        "Scan produk disini!!",
                        style: TextStyle(fontSize: 15),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Kamera berbentuk kotak
            Container(
              height: 300,
              width: 400,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(25),
                border: Border.all(color: Colors.white, width: 3),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(22),
                child: MobileScanner(onDetect: _handleBarcode),
              ),
            ),

            const SizedBox(height: 30),

            // Hasil scan
            Container(
              padding: const EdgeInsets.all(16),
              child: _barcodePreview(_bacrcode),
            ),
          ],
        ),
      ),
    );
  }
}
