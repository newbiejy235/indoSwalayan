import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Poppins } from "next/font/google";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "./globals.css";

// Cegah Font Awesome inject CSS sendiri (biar icon nggak "meledak" ukurannya saat load)
config.autoAddCss = false;

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "IndoSwalayan",
  description: "Belanja mudah, bisnis lebih terarah. Cek stok produk IndoSwalayan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${jakarta.variable} ${poppins.variable}`}>
      <body className="font-body bg-white text-black antialiased">{children}</body>
    </html>
  );
}