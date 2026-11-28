"use client"

import { useMemo, useState } from "react"
import ProductCard from "@/components/welcome/productCard"
import type { Product } from "@/utils/productType"

interface Props {
  products: Product[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

export default function ProductGrid({
  products,
  loading,
  error,
  onRetry,
}: Props) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q
      ? products.filter((p) => p.name.toLowerCase().includes(q))
      : products
  }, [products, query])

  return (
    <section
      id="product"
      className="mx-auto max-w-[1300px] px-4 pt-12 pb-20 sm:px-12 sm:pt-16 sm:pb-28"
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search product by name.."
        aria-label="Cari produk berdasarkan nama"
        className="font-body w-full max-w-[520px] rounded-xl bg-white px-4 py-3 text-black transition-shadow outline-none placeholder:font-light placeholder:text-black focus:ring-4 focus:ring-[#ddbe57] sm:px-6 sm:py-3.5"
      />

      <div className="mt-8 grid grid-cols-1 gap-6 sm:mt-12 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4 lg:gap-10">
        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-[32px] bg-[#EDE1B5]"
            />
          ))}

        {!loading &&
          !error &&
          filtered.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      {error && (
        <div className="font-body mt-6 flex flex-col items-start gap-4">
          <p>{error}</p>
          <button
            onClick={onRetry}
            className="rounded-full bg-black px-6 py-2.5 text-white transition-all duration-300 hover:bg-[#EEBE20] hover:text-black active:scale-95"
          >
            Muat ulang
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="font-body mt-6">
          {query
            ? `Tidak ada produk dengan nama “${query}”.`
            : "Belum ada produk."}
        </p>
      )}
    </section>
  )
}
