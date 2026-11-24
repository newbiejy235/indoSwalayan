"use client"

import { useState } from "react"
import { Box, Home, ScanLine, Menu, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

const Sidebar = () => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const menus = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Cashier",
      href: "/karyawan",
      icon: ScanLine,
    },
    {
      name: "Product",
      href: "/product",
      icon: Box,
    },
  ]

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="sticky top-0 z-30 flex w-full items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            className="h-9 w-auto object-contain"
            src="/images/indoSwalayan2.png"
            alt="logo"
            width={110}
            height={36}
            priority
          />
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-xl p-2 text-slate-700 transition hover:bg-slate-100 active:scale-95"
          aria-label="Buka Menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col items-center border-r border-slate-200 bg-white p-5 shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex w-full items-center justify-between border-b border-slate-100 pb-4">
          <Image
            className="h-10 w-auto object-contain"
            src="/images/indoSwalayan2.png"
            alt="logo"
            width={120}
            height={40}
          />
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Tutup Menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-8 flex w-full flex-col space-y-4">
          {menus.map((menu) => {
            const isActive =
              pathname === menu.href || pathname.startsWith(`${menu.href}/`)

            const Icon = menu.icon

            return (
              <Link
                key={menu.href}
                href={menu.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-2xl p-2.5 transition-all duration-200 ${
                  isActive
                    ? "bg-[#141414] text-white"
                    : "text-black hover:bg-[#141414]/85 hover:text-white"
                }`}
              >
                <div
                  className={`rounded-full p-1.5 transition-colors ${
                    isActive
                      ? "bg-white text-black"
                      : "text-black group-hover:bg-white"
                  }`}
                >
                  <Icon size={18} />
                </div>

                <h1 className="text-sm font-medium">{menu.name}</h1>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden min-h-screen w-56 shrink-0 flex-col items-center border-r border-slate-200 bg-white md:flex">
        <Image
          className="h-40 w-40 object-contain"
          src="/images/indoSwalayan2.png"
          alt="logo"
          width={160}
          height={160}
          priority
        />

        <nav className="mt-10 flex w-full flex-col space-y-5 px-4">
          {menus.map((menu) => {
            const isActive =
              pathname === menu.href || pathname.startsWith(`${menu.href}/`)

            const Icon = menu.icon

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`flex min-w-40 items-center gap-3 rounded-2xl p-2 transition-all duration-200 ${
                  isActive
                    ? "bg-[#141414] text-white"
                    : "text-black hover:bg-[#141414]/85 hover:text-white"
                }`}
              >
                <div
                  className={`rounded-full p-1 transition-colors ${
                    isActive
                      ? "bg-white text-black"
                      : "text-black group-hover:bg-white"
                  }`}
                >
                  <Icon size={20} />
                </div>

                <h1 className="text-md">{menu.name}</h1>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
