import { formatRupiah } from "@/utils/product";
import type { Product, StockStatus } from "@/utils/productType";

const STATUS: Record<StockStatus, { label: string; bg: string; dot: string }> = {
  available: { label: "Tersedia", bg: "#1E8E3E", dot: "#4CE06A" },
  low: { label: "Hampir habis", bg: "#D97706", dot: "#FFD400" },
  out: { label: "Tidak tersedia", bg: "#8B0F0F", dot: "#FF2A2A" },
};

export default function ProductCard({ product }: { product: Product }) {
  const status = STATUS[product.status];

  return (
    <article
      title={product.name}
      className="group relative aspect-square overflow-hidden rounded-[32px] bg-[#EDE1B5] shadow-[0_6px_16px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_14px_24px_rgba(0,0,0,0.22)]"
    >
      {product.image && (
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-5 pb-8 pt-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <p className="font-display line-clamp-2 text-sm font-semibold text-white">{product.name}</p>
      </div>

      <div className="font-body absolute bottom-3 left-3 flex flex-col items-start gap-1.5 text-xs text-white">
        <span className="rounded-full bg-black px-3 py-1">{formatRupiah(product.price)}</span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-3"
          style={{ backgroundColor: status.bg }}
        >
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: status.dot }} />
          {status.label}
        </span>
      </div>
    </article>
  );
}