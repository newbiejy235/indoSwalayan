import type { Metadata } from "next"
import { Libre_Barcode_128_Text, Plus_Jakarta_Sans, Poppins } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
})

const barcode = Libre_Barcode_128_Text({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-barcode",
});

export const metadata: Metadata = {
  title: "IndoSwalayan",
  description: "IndoSwalayan POS System",
}

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn("antialiased", jakarta.variable, barcode.variable, poppins.variable)}
    >
      <body className="font-[family-name:var(--font-jakarta)]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
