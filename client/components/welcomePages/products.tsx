"use client"

import React from "react"
import Image from "next/image"

interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
  image: string
}

const products: Product[] = [
  {
    id: 1,
    name: "Indomie Goreng",
    category: "Makanan Instan",
    price: 3500,
    stock: 24,
    image: "/images/indomie.png",
  },
  {
    id: 2,
    name: "Aqua 600ml",
    category: "Minuman",
    price: 4000,
    stock: 18,
    image: "/images/aqua.png",
  },
  {
    id: 3,
    name: "Chitato Original",
    category: "Snack",
    price: 12000,
    stock: 0,
    image: "/images/chitato.png",
  },
  {
    id: 4,
    name: "Susu Ultra Milk",
    category: "Minuman",
    price: 6500,
    stock: 12,
    image: "/images/susu.png",
  },
]

const formatRupiah = (price: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price)
}

const Products = () => {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold text-green-600">
            PRODUK KAMI
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
            Temukan kebutuhanmu.
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            Berbagai produk pilihan tersedia untuk kebutuhan sehari-hari.
          </p>
        </div>

        <p className="text-sm text-neutral-500">
          Menampilkan {products.length} produk
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-xl hover:shadow-green-900/5"
          >
            {/* Image */}
            <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-neutral-50 p-5">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain p-6 transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {product.stock === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <span className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white">
                    Stok Habis
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="mb-1 text-xs font-medium text-neutral-400">
                {product.category}
              </p>

              <h3 className="line-clamp-1 text-sm font-bold text-neutral-900 sm:text-base">
                {product.name}
              </h3>

              <p className="mt-3 text-base font-bold text-green-600 sm:text-lg">
                {formatRupiah(product.price)}
              </p>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-neutral-100 pt-3">
                <span
                  className={`text-xs font-medium ${
                    product.stock > 0 ? "text-neutral-500" : "text-red-500"
                  }`}
                >
                  {product.stock > 0
                    ? `Stok: ${product.stock}`
                    : "Tidak tersedia"}
                </span>

                <button
                  disabled={product.stock === 0}
                  className="rounded-lg bg-green-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
                >
                  + Keranjang
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Products
