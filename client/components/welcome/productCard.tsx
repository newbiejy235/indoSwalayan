"use client"

import { formatRupiah } from "@/utils/product"
import type { Product, StockStatus } from "@/utils/productType"

const STATUS: Record<
  StockStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  available: {
    label: "Tersedia",
    bg: "#E8F4E8",
    text: "#26743B",
    dot: "#2E9D50",
  },
  low: {
    label: "Stok menipis",
    bg: "#FFF2D9",
    text: "#A7650B",
    dot: "#E49A20",
  },
  out: {
    label: "Stok habis",
    bg: "#FCE9E7",
    text: "#B83C32",
    dot: "#D94A40",
  },
}

export default function ProductCard({ product }: { product: Product }) {
  const status = STATUS[product.status]

  return (
    <article
      title={product.name}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E9E3D3] bg-white shadow-[0_2px_10px_rgba(60,51,32,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#D9CBA8] hover:shadow-[0_10px_25px_rgba(60,51,32,0.10)]"
    >
      {/* PRODUCT IMAGE */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5F1E7]">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#A69A7C]">
            <span className="text-4xl">🛒</span>
            <span className="text-xs font-medium">Gambar tidak tersedia</span>
          </div>
        )}

        {/* STOCK BADGE */}
        <div
          className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 shadow-sm"
          style={{
            backgroundColor: status.bg,
            color: status.text,
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: status.dot }}
          />

          <span className="font-body text-[11px] font-semibold">
            {status.label}
          </span>
        </div>
      </div>

      {/* PRODUCT INFORMATION */}
      <div className="flex flex-1 flex-col justify-between gap-3 p-3.5 sm:p-4">
        <div>
          <h3 className="font-display line-clamp-2 min-h-[42px] text-sm leading-relaxed font-semibold text-[#3C3320] sm:text-[15px]">
            {product.name}
          </h3>
        </div>

        {/* PRICE */}
        <div className="flex items-end justify-between gap-2 border-t border-[#EEE9DC] pt-3">
          <div className="min-w-0">
            <p className="font-body mb-1 text-[10px] text-[#968A71] sm:text-xs">
              Harga produk
            </p>

            <p className="font-display text-base font-bold tracking-tight text-[#3C3320] sm:text-lg">
              {formatRupiah(product.price)}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}
