"use client"

import Image from "next/image"
import { LogIn, Search } from "lucide-react"
import Link from "next/link"

const navItems = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "Products",
    href: "/products",
  },
  {
    name: "Contact",
    href: "/contact",
  },
  {
    name: "Request",
    href: "/req",
  },
]

export default function Navbar() {
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-8 px-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-6">
            <Link href="/" className="shrink-0">
              <Image
                src="/images/indoSwalayan2.png"
                alt="Indo Swalayan"
                width={145}
                height={55}
                priority
                className="h-auto w-20 object-fill"
              />
            </Link>

            {/* Navigation */}
            <div className="hidden items-center gap-7 md:flex">
              {navItems.map((item) => {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      "max-w10 rounded-full p-1 text-sm font-semibold transition-colors hover:bg-yellow-300"
                    }
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Search & Login */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-gray-100 px-4 py-2.5 lg:flex">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search for a product..."
                className="w-40 bg-transparent text-xs outline-none placeholder:text-gray-400"
              />
            </div>

            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full bg-[#164b35] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#236b4b]"
            >
              <LogIn size={16} />
              <span>Login</span>
            </Link>
          </div>
        </nav>
      </header>
    </>
  )
}
