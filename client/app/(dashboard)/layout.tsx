import {
  Geist,
  Geist_Mono,
  Merriweather,
  Plus_Jakarta_Sans,
} from "next/font/google"
import Sidebar from "@/components/sidebar/sidebar"
import { Toaster } from "react-hot-toast"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn("antialiased", jakarta.variable)}
    >
      <body className="font-[family-name:var(--font-jakarta)]">
        <ThemeProvider>
          <div className="flex min-h-screen w-full flex-col md:flex-row">
            <Sidebar />
            <div className="min-w-0 flex-1 w-full">{children}</div>
            <Toaster position="top-center" />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
