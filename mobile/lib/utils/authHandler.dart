import 'package:flutter/material.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:mobile/pages/auth/login.dart';
import 'package:mobile/pages/kasir.dart';
import 'package:mobile/service/api.dart';

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool loading = true;
  bool isAuthenticated = false;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final token = await ApiService.getToken();

    bool valid = false;

    if (token != null && token.isNotEmpty) {
      try {
        valid = !JwtDecoder.isExpired(token);
      } catch (_) {
        valid = false;
      }
    }

    if (!valid && token != null) {
      await ApiService.logout();
    }

    if (!mounted) return;

    setState(() {
      isAuthenticated = valid;
      loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (isAuthenticated) {
      return const KasirPage();
    }

    return const LoginPage();
  }
}
