import api from "@/lib/api";
import type { Product, StockStatus } from "@/utils/productType";

/** Stok <= angka ini dianggap "Hampir habis". Ubah sesuai kebutuhan. */
export const LOW_STOCK_THRESHOLD = 10;

type Raw = Record<string, unknown>;

const pick = (raw: Raw, keys: string[]): unknown => {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return raw[key];
  }
  return undefined;
};

const toStatus = (stock: number): StockStatus => {
  if (stock <= 0) return "out";
  if (stock <= LOW_STOCK_THRESHOLD) return "low";
  return "available";
};

const toImageUrl = (value: unknown): string => {
  const src = typeof value === "string" ? value : "";
  if (!src) return "";
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:")) return src;
  const base = (api.defaults.baseURL ?? "").replace(/\/$/, "");
  return `${base}/${src.replace(/^\//, "")}`;
};

/**
 * Satu-satunya tempat yang perlu diubah kalau nama field dari API beda.
 * Tambahin nama field-nya di array masing-masing.
 */
const normalize = (raw: Raw, index: number): Product => {
  const stock = Number(pick(raw, ["stock", "stok", "quantity", "qty"]) ?? 0) || 0;

  return {
    id: (pick(raw, ["id", "_id", "productId"]) as string | number) ?? index,
    name: String(pick(raw, ["name", "nama", "title", "productName"]) ?? "Produk"),
    price: Number(pick(raw, ["price", "harga"]) ?? 0) || 0,
    stock,
    image: toImageUrl(pick(raw, ["image", "imageUrl", "image_url", "photo", "foto", "thumbnail"])),
    description: String(pick(raw, ["description", "deskripsi", "desc"]) ?? ""),
    status: toStatus(stock),
  };
};

export async function getProducts(signal?: AbortSignal): Promise<Product[]> {
  const { data } = await api.get("/product", { signal });
  const list: Raw[] = Array.isArray(data)
    ? data
    : data?.data ?? data?.products ?? data?.result ?? [];
  return list.map(normalize);
}

export const formatRupiah = (value: number) =>
  `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;