import midtransClient, { Snap } from "midtrans-client";

export interface MidtransSnap extends Snap {
  transaction: {
    notification(notificationJson: Record<string, any>): Promise<any>;
  };
}

export const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.SECRET!,
  clientKey: process.env.NEXT_PUBLIC_CLIENT!,
});

