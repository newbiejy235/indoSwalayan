"use client";

import { useRef, useState } from "react";
import { formatRupiah } from "@/utils/product";
import type { Product } from "@/utils/productType";

/**
 * Isi gambar sendiri di sini (urut dari kiri ke kanan), contoh:
 * ["/showcase-1.jpg", "/showcase-2.jpg", "/showcase-3.jpg", "/showcase-4.jpg"]
 * Kalau kosong, otomatis pakai foto produk dari API.
 * Deskripsi + nama di caption selalu diambil dari API (produk ke-1 s/d ke-4).
 */
const SHOWCASE_IMAGES: string[] = [];

interface Props {
  products: Product[];
  loading: boolean;
}

export default function ShowcaseBanner({ products, loading }: Props) {
  const [open, setOpen] = useState(false);
  const lastPointer = useRef<string>("mouse");
  const items = products.slice(0, 4);

  return (
    <section className="mx-auto max-w-[1300px] px-4 pt-10 sm:px-12">
      <div
        tabIndex={0}
        role="group"
        aria-label="Produk pilihan"
        onPointerDown={(e) => (lastPointer.current = e.pointerType)}
        onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
        onClick={() => lastPointer.current !== "mouse" && setOpen((o) => !o)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="flex flex-col overflow-hidden rounded-[40px] bg-[#EDE1B5] outline-none focus-visible:ring-4 focus-visible:ring-[#EEBE20] md:h-[460px] md:flex-row"
      >
        {/* Panel gambar: melebar ke arah teks saat hover */}
        <div
          className={`flex h-[280px] w-full shrink-0 transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:h-full ${
            open ? "md:w-[calc(100%-250px)]" : "md:w-[62%]"
          }`}
        >
          {loading || items.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-1 animate-pulse bg-black/10" />
              ))
            : items.map((p, i) => {
                const src = SHOWCASE_IMAGES[i] || p.image;
                return (
                  <div
                    key={p.id}
                    className="group/strip relative min-w-0 flex-[1_1_0%] overflow-hidden bg-black/10 transition-[flex-grow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:hover:flex-[2.6_1_0%]"
                  >
                    {src && <img src={src} alt={p.name} className="h-full w-full object-cover" />}

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden translate-y-3 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-4 pb-4 pt-12 text-white opacity-0 transition-all duration-500 md:block md:group-hover/strip:translate-y-0 md:group-hover/strip:opacity-100 md:group-hover/strip:delay-200">
                      <div className="min-w-[200px]">
                        <p className="font-display text-base font-semibold leading-tight">{p.name}</p>
                        <p className="font-body mt-0.5 text-sm text-[#EEBE20]">{formatRupiah(p.price)}</p>
                        {p.description && (
                          <p className="font-body mt-1.5 line-clamp-3 text-xs font-light leading-relaxed text-white/90">
                            {p.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>

        <div className="flex min-w-[250px] flex-1 flex-col justify-center p-8 md:p-10">
          <h2 className="font-display text-2xl font-semibold leading-snug sm:text-3xl">
            Yuk, temukan
            <br />
            produk favoritmu
            <br />
            di IndoSwalayan!
          </h2>
          <div className="mt-2 flex items-center gap-3">
            <span className="h-[6px] w-[85%] rounded-full bg-[#EEBE20]" />
            <span className="h-2 w-2 rounded-full bg-[#EEBE20]" />
          </div>
        </div>
      </div>
    </section>
  );
}