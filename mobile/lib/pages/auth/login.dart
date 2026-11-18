import 'package:flutter/material.dart';
import 'package:mobile/pages/kasir.dart';
import 'package:mobile/service/api.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  @override
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  bool obscurePassword = true;
  bool loading = false;
  bool cekSesi = true;

  @override
  void initState() {
    super.initState();
    _cekToken(); // Jalankan pengecekan otomatis saat LoginPage dibuka
  }

  Future<void> _cekToken() async {
    final token = await ApiService.getToken();

    if (!mounted) return;

    // Jika token sudah ada dan tidak kosong, langsung pindah ke KasirPage
    if (token != null && token.isNotEmpty) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const KasirPage()),
      );
    } else {
      // Jika tidak ada token, tampilkan form login seperti biasa
      setState(() {
        cekSesi = false;
      });
    }
  }

  Future<void> login() async {
    setState(() => loading = true);

    try {
      if (emailController.text.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Email harus di isi'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 2), // Lama tampil di layar
          ),
        );
        return;
      }

      if (passwordController.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Email harus di isi'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 2), // Lama tampil di layar
          ),
        );
        return;
      }
      final res = await ApiService.post('/auth/login/karyawan', {
        'email': emailController.text.trim(),
        'password': passwordController.text,
      });
      await ApiService.saveToken(res['token']);

      if (!mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res['message'] ?? 'Login berhasil!'),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 2),
          ),
        );
        return;
      }
      await ApiService.saveUserData(res["userData"]);
    

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Login berhasil!'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
        ),
      );
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => KasirPage()),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (mounted) {
        setState(() => loading = false);
      }
    }
  }

  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,

          children: [
            Container(
              height: 250,
              width: 250,
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.only(
                  topRight: Radius.circular(80),
                  bottomLeft: Radius.circular(80),
                ),
                border: Border.all(width: 2, color: const Color(0xFF0134FF)),
              ),
              child: Image.asset("images/indoSwalayan2.png", width: 50),
            ),

            Container(
              margin: EdgeInsets.only(top: 70),
              child: Column(
                spacing: 40,
                children: [
                  SizedBox(
                    width: 280, // Samakan lebarnya dengan kolom password
                    height:
                        48, // Tinggi ideal agar label dan teks email tidak terpotong
                    child: TextField(
                      controller: emailController,
                      keyboardType: TextInputType
                          .emailAddress, // Menampilkan tombol '@' di keyboard HP
                      decoration: InputDecoration(
                        labelText: 'Email',
                        hintText: 'example@gmail.com',

                        // Mengganti ikon gembok menjadi ikon email
                        prefixIcon: const Icon(
                          Icons.email_outlined,
                          color: Color(0xFF0134FF),
                        ),

                        // Mengatur jarak teks di dalam agar pas di tengah vertikal
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 12,
                        ),

                        // Garis tepi saat normal (tidak diklik)
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(50),
                          borderSide: const BorderSide(
                            color: Colors.grey,
                            width: 1.5,
                          ),
                        ),

                        // Garis tepi saat diklik (tetap melengkung 50 dan berwarna biru tema)
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(50),
                          borderSide: const BorderSide(
                            color: Color(0xFF0134FF),
                            width: 2,
                          ),
                        ),
                      ),
                    ),
                  ),

                  SizedBox(
                    width:
                        280, // Dilebarkan sedikit karena ikon mata sekarang masuk ke dalam kotak
                    height:
                        48, // Tinggi ideal agar teks dan label tidak terpotong
                    child: TextField(
                      obscureText: obscurePassword,
                      controller: passwordController,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        hintText: 'Masukkan password',

                        // Ikon gembok di kiri (opsional, mempercantik tampilan)
                        prefixIcon: const Icon(
                          Icons.lock_outline,
                          color: Color(0xFF0134FF),
                        ),

                        // Ikon mata dimasukkan langsung ke dalam TextField
                        suffixIcon: IconButton(
                          onPressed: () {
                            setState(() {
                              // Membalik nilai true <-> false agar bisa buka & tutup password
                              obscurePassword = !obscurePassword;
                            });
                          },
                          icon: Icon(
                            obscurePassword
                                ? Icons.visibility_off
                                : Icons.visibility,
                            color: const Color(0xFF0134FF),
                          ),
                        ),

                        // Mengatur jarak teks di dalam agar pas di tengah secara vertikal
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 12,
                        ),

                        // Garis tepi saat normal (tidak diklik)
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(50),
                          borderSide: const BorderSide(
                            color: Colors.grey,
                            width: 1.5,
                          ),
                        ),

                        // Garis tepi saat diklik (tetap melengkung 50 dan berwarna biru tema)
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(50),
                          borderSide: const BorderSide(
                            color: Color(0xFF0134FF),
                            width: 2,
                          ),
                        ),
                      ),
                    ),
                  ),

                  SizedBox(
                    width: 170,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () {
                        setState(() {
                          login();
                        });
                      },
                      icon: const Icon(Icons.key),
                      label: const Text('Login'),
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
