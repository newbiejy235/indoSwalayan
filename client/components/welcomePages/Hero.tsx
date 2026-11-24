"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#f9faf8]">
      {/* Background decoration */}
      <div className="pointer-events-none absolute top-0 -right-32 -z-10 h-[550px] w-[550px] rounded-full bg-[#6baf5d]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-32 -z-10 h-80 w-80 rounded-full bg-[#a7d8ff]/20 blur-3xl" />

      <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-8 px-6 py-14 lg:grid-cols-2 lg:gap-4 lg:py-16">
        {/* Left content */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl  font-extrabold tracking-tight text-[#19382a]">
            Semua Kebutuhan
            <br />
            <span className="text-[#6baf5d]">Ada di Sini.</span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-7 text-gray-500 sm:text-lg">
            Temukan berbagai kebutuhan harian dengan mudah. Lihat produk dan
            ketersediaan stok sebelum kamu berbelanja di Indo Swalayan.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/products"
              className="group inline-flex items-center gap-3 rounded-full bg-[#164b35] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#164b35]/15 transition-all duration-300 hover:-translate-y-1 hover:bg-[#236b4b]"
            >
              Jelajahi Produk
              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>

           
          </div>

          {/* Small information */}
          <div className="mt-12 flex flex-wrap gap-8 border-t border-gray-200 pt-7">
            <div>
              <p className="text-2xl font-bold text-[#164b35]">Mudah</p>
              <p className="mt-1 text-xs text-gray-500">Cari produk</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#164b35]">Cepat</p>
              <p className="mt-1 text-xs text-gray-500">Cek ketersediaan</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#164b35]">Praktis</p>
              <p className="mt-1 text-xs text-gray-500">Belanja kebutuhan</p>
            </div>
          </div>
        </div>

       
      </div>
    </section>
  )
}
