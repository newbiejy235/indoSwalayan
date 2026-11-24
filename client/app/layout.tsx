"use client"
import {
  Geist,
  Geist_Mono,
  Merriweather,
  Plus_Jakarta_Sans,
} from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const geistMonoHeading = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-heading",
})

const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-serif",
})

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

import { useEffect } from "react"
import userData from "@/utils/userData"
import { isTokenExpired } from "@/lib/authValidation"
import { useRouter } from "next/navigation"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const router = useRouter()
  useEffect(() => {
    const checkToken = async () => {
      const user = await userData.get()

      if (!user?.token || isTokenExpired(user.token)) {
        localStorage.removeItem("user")
        router.replace("/login")
      }
    }

    checkToken()
  }, [router])
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn("antialiased", jakarta.variable)}
    >
      <body className="font-[family-name:var(--font-jakarta)]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
