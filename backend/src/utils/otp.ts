import crypto from "node:crypto";

const OTP_SECRET = process.env.OTP_SECRET;

if (!OTP_SECRET) {
  throw new Error("OTP_SECRET belum dikonfigurasi");
}

// Generate 6 digit OTP
export const generateOtp = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Hash OTP menggunakan HMAC SHA256
export const hashOtp = (otp: string): string => {
  return crypto
    .createHmac("sha256", OTP_SECRET!)
    .update(otp)
    .digest("hex");
};

// Membandingkan hash secara aman
export const verifyOtpHash = (
  otp: string,
  storedHash: string,
): boolean => {
  const inputHash = Buffer.from(hashOtp(otp), "hex");
  const databaseHash = Buffer.from(storedHash, "hex");

  return (
    inputHash.length === databaseHash.length &&
    crypto.timingSafeEqual(inputHash, databaseHash)
  );
};