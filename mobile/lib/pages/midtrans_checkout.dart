
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class MidtransCheckoutPage extends StatefulWidget {
  final String redirectUrl;
  final String invoiceNumber;

  const MidtransCheckoutPage({
    super.key,
    required this.redirectUrl,
    required this.invoiceNumber,
  });

  @override
  State<MidtransCheckoutPage> createState() =>
      _MidtransCheckoutPageState();
}

class _MidtransCheckoutPageState extends State<MidtransCheckoutPage> {
  late final WebViewController controller;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();

    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) {
              setState(() => isLoading = true);
            }
          },
          onPageFinished: (_) {
            if (mounted) {
              setState(() => isLoading = false);
            }
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.redirectUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Pembayaran Midtrans"),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: controller),
          if (isLoading)
            const Center(
              child: CircularProgressIndicator(),
            ),
        ],
      ),
    );
  }
}
