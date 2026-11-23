import { Box, Home, ScanLine } from "lucide-react"
import Link from "next/link"
import React from "react"

const Sidebar = () => {
  return (
    <aside className="flex min-h-screen max-w-56 flex-col items-center border border-slate-200 bg-white">
      <img className="h-40 w-40" src="/images/indoSwalayan2.png" alt="logo" />

      <nav className="mt-10 flex flex-col space-y-5">
        <Link href={"/dashboard"} className="flex min-w-40 items-center hover:cursor-pointer gap-3 rounded-2xl bg-[#141414] p-2 text-white">
          <div className="rounded-full bg-white text-black p-1">
            <Home size={20} />
          </div>
          <h1 className="text-md">Dashboard</h1>
        </Link>

        <Link href={"/karyawan"} className="flex min-w-40 items-center hover:cursor-pointer gap-3 rounded-2xl group hover:bg-[#141414]/85 p-2 text-black hover:text-white">
          <div className="rounded-full group-hover:bg-white text-black p-1">
            <ScanLine size={20} />
          </div>
          <h1 className="text-md">Cashier</h1>
        </Link>

        <div className="flex min-w-40 items-center hover:cursor-pointer gap-3 rounded-2xl group hover:bg-[#141414]/85 p-2 text-black hover:text-white">
          <div className="rounded-full group-hover:bg-white text-black p-1">
            <Box size={20} />
          </div>
          <h1 className="text-md">Products</h1>
        </div>

        
      </nav>
    </aside>
  )
}

export default Sidebar
