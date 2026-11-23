enum PaymentMethod { tunai, midtrans }

extension PaymentMethodExtension on PaymentMethod {
  String get value {
    switch (this) {
      case PaymentMethod.tunai:
        return "tunai";
      case PaymentMethod.midtrans:
        return "non tunai";
    }
  }

  String get displayName {
    switch (this) {
      case PaymentMethod.tunai:
        return "Tunai";
      case PaymentMethod.midtrans:
        return "Non-Tunai (Midtrans)";
    }
  }
}

