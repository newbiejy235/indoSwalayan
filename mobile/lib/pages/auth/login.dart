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
  bool loading = false;

  Future<void> login() async {
    setState(() => loading = true);

    try {
      final res = await ApiService.post('/auth/login/karyawan', {
        'email': emailController.text.trim(),
        'password': passwordController.text,
      });
      await ApiService.saveToken(res['token']);
      if (!mounted) return;
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
                    width: 220,
                    height: 40,
                    child: TextField(
                      controller: emailController,
                      decoration: InputDecoration(
                        labelText: 'Email',
                        hintText: "Example@gmail.com",
                        border: OutlineInputBorder(),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(50),
                        ),
                      ),
                    ),
                  ),

                  SizedBox(
                    width: 220,
                    height: 40,
                    child: TextField(
                      controller: passwordController,
                      decoration: InputDecoration(
                        labelText: 'password',
                        hintText: ".......",
                        border: OutlineInputBorder(),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(50),
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
                          print("hello");
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
