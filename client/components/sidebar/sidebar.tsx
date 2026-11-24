"use client"

import { Box, Home, ScanLine, CircleArrowUpLeftExit } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import userData from "@/utils/userData"

const Sidebar = () => {
  const pathname = usePathname()
  const logoutHandler = async () => {
    userData.logout()
  }

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
    <aside className="flex min-h-screen w-56 flex-col items-center border-r border-slate-200 bg-white">
      <Image
        className="h-40 w-40 object-contain"
        src="/images/indoSwalayan2.png"
        alt="logo"
        width={160}
        height={160}
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

        <form onSubmit={logoutHandler}>
          <button
            type="submit"
            className="flex min-w-40 items-center justify-center gap-3 rounded-2xl bg-red-600 p-2 text-white transition-all duration-200"
          >
            <CircleArrowUpLeftExit size={20} />
            Logout
          </button>
        </form>
      </nav>
    </aside>
  )
}

export default Sidebar
