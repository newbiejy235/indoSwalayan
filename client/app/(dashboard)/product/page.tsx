"use client"

import React, { useEffect, useState } from "react"
import {
  Search,
  Plus,
  Package,
  Boxes,
  AlertTriangle,
  Pencil,
  Trash2,
  Filter,
  PackageX,
  X,
} from "lucide-react"

import api from "@/lib/api"
import EditProduct from "../editProduct/page"
import userData from "@/utils/userData"
import toast from "react-hot-toast"
import Link from "next/link"

type Product = {
  id: number
  name: string
  description?: string
  sku: string
  barcode: string
  price: string
  stock: number
  imageUrl: string
}

const Products = () => {
  const users = userData.get()
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [data, setData] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  // GET PRODUCTS
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setMessage("")

      const result = await api.get("/product")

      if (!result.data.success) {
        setMessage(result.data.message || "Gagal mengambil data produk")
        return
      }

      setData(result.data.data || [])
    } catch (error) {
      console.error(error)
      setMessage("Terjadi kesalahan saat mengambil data produk")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const deleteHandler = async (id: number) => {
    const idProducts = data.filter((items) => items.id === id)
    const result = idProducts[0]
    console.log(result)

    toast.custom((t) => (
      <div className="w-[350px] rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
        <h3 className="font-semibold text-gray-900">Hapus produk?</h3>

        <p className="mt-2 text-sm text-gray-500">
          Apakah kamu yakin ingin menghapus produk{" "}
          <span className="font-semibold text-gray-800">{result.name}</span>?
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
          >
            Batal
          </button>

          <button
            onClick={async () => {
              toast.dismiss(t.id)

              try {
                const response = await api.patch(
                  `/product/${result.id}`,
                  { isActive: false },
                  {
                    headers: {
                      Authorization: `Bearer ${users?.token}`,
                    },
                  }
                )

                if (!response.data.success) {
                  toast.error(response.data.message)
                  return
                }

                toast.success("Produk berhasil dihapus")

                // Update tampilan produk
                setData((prev) => prev.filter((item) => item.id !== id))
              } catch (error) {
                toast.error("Gagal menghapus produk")
                console.error(error)
              }
            }}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
          >
            Ya, hapus
          </button>
        </div>
      </div>
    ))
  }
  const pluStock = (id: number) => {
    const result = data.find((item) => item.id === id)

    if (!result) {
      toast.error("Produk tidak ditemukan")
      return
    }

    let stockInput = 1

    toast.custom((t) => (
      <div className="w-[350px] rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">
          Tambah Stok Produk
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Produk:{" "}
          <span className="font-semibold text-gray-800">{result.name}</span>
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Stok saat ini: {result.stock}
        </p>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Jumlah stok yang ingin ditambahkan
          </label>

          <input
            type="number"
            min="1"
            defaultValue={1}
            onChange={(e) => {
              stockInput = Number(e.target.value)
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="Masukkan jumlah stok"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
          >
            Batal
          </button>

          <button
            onClick={async () => {
              if (!Number.isInteger(stockInput) || stockInput <= 0) {
                toast.error("Masukkan jumlah stok yang valid")
                return
              }

              try {
                const response = await api.patch(
                  `/product/${result.id}`,
                  {
                    stock: result.stock + stockInput,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${users?.token}`,
                    },
                  }
                )

                if (!response.data.success) {
                  toast.error(response.data.message)
                  return
                }

                toast.dismiss(t.id)
                toast.success(`Berhasil menambahkan ${stockInput} stok`)

                setData((prev) =>
                  prev.map((item) =>
                    item.id === id
                      ? { ...item, stock: result.stock + stockInput }
                      : item
                  )
                )
              } catch (error) {
                toast.error("Gagal menambahkan stok")
                console.error(error)
              }
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Tambahkan
          </button>
        </div>
      </div>
    ))
  }
  // FORMAT RUPIAH
  const formatRupiah = (value: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value))
  }

  // SEARCH & FILTER
  const filteredProducts = data.filter((product) => {
    const keyword = search.toLowerCase()

    const matchesSearch =
      product.name.toLowerCase().includes(keyword) ||
      product.sku.toLowerCase().includes(keyword) ||
      product.barcode.toLowerCase().includes(keyword)

    const matchesFilter =
      filter === "all" ||
      (filter === "available" && product.stock > 10) ||
      (filter === "low" && product.stock > 0 && product.stock <= 10) ||
      (filter === "empty" && product.stock === 0)

    return matchesSearch && matchesFilter
  })

  // STATISTICS
  const totalStock = data.reduce((total, product) => total + product.stock, 0)

  const lowStock = data.filter(
    (product) => product.stock > 0 && product.stock <= 10
  ).length

  const emptyStock = data.filter((product) => product.stock === 0).length

  // STOCK STATUS
  const stockStatus = (stock: number) => {
    if (stock === 0) {
      return {
        label: "Habis",
        className: "bg-red-50 text-red-600",
      }
    }

    if (stock <= 10) {
      return {
        label: "Stok Menipis",
        className: "bg-orange-50 text-orange-600",
      }
    }

    return {
      label: "Tersedia",
      className: "bg-green-50 text-green-600",
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-5 md:p-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-400">Dashboard / Produk</p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Manajemen Produk
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Kelola produk, harga, dan persediaan barang toko.
          </p>
        </div>

        <Link href={"/addProduct"} className="flex items-center justify-center gap-2 rounded-xl bg-[#15803d] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800">
          <Plus size={18} />
          Tambah Produk
        </Link>
      </div>

      {/* STATISTICS */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Produk"
          value={data.length.toString()}
          description="Produk terdaftar"
          icon={<Package size={22} />}
          color="blue"
        />

        <StatCard
          title="Total Stok"
          value={totalStock.toLocaleString("id-ID")}
          description="Unit barang tersedia"
          icon={<Boxes size={22} />}
          color="green"
        />

        <StatCard
          title="Stok Menipis"
          value={lowStock.toString()}
          description={`${emptyStock} produk kehabisan stok`}
          icon={<AlertTriangle size={22} />}
          color="orange"
        />
      </div>

      {/* PRODUCT TABLE */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {/* TABLE HEADER */}
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Daftar Produk</h2>

            <p className="mt-1 text-xs text-gray-400">
              Kelola seluruh produk yang tersedia di toko.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* SEARCH */}
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 sm:w-64">
              <Search size={17} className="text-gray-400" />

              <input
                type="text"
                placeholder="Cari nama, SKU, barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />

              {search && (
                <button onClick={() => setSearch("")}>
                  <X size={15} className="text-gray-400" />
                </button>
              )}
            </div>

            {/* FILTER */}
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3">
              <Filter size={16} className="text-gray-400" />

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent py-2.5 text-sm outline-none"
              >
                <option value="all">Semua Stok</option>
                <option value="available">Tersedia</option>
                <option value="low">Stok Menipis</option>
                <option value="empty">Habis</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-gray-50 text-xs font-semibold tracking-wider text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-4">Produk</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Barcode</th>
                <th className="px-6 py-4">Harga</th>
                <th className="px-6 py-4">Stok</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {/* LOADING */}
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-sm text-gray-400"
                  >
                    Memuat data produk...
                  </td>
                </tr>
              ) : message ? (
                /* ERROR */
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-sm text-red-500"
                  >
                    {message}
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                /* EMPTY */
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <PackageX size={35} className="mx-auto text-gray-300" />

                    <p className="mt-3 font-semibold text-gray-700">
                      Produk tidak ditemukan
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      Coba gunakan kata kunci atau filter lainnya.
                    </p>
                  </td>
                </tr>
              ) : (
                /* PRODUCT LIST */
                filteredProducts.map((product) => {
                  const status = stockStatus(product.stock)

                  return (
                    <tr
                      key={product.id}
                      className="transition hover:bg-gray-50/70"
                    >
                      {/* PRODUCT */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="text-gray-400" size={22} />
                            )}
                          </div>

                          <div>
                            <p className="font-semibold text-gray-800">
                              {product.name}
                            </p>

                            <p className="mt-1 max-w-[200px] truncate text-xs text-gray-400">
                              {product.description || "Tidak ada deskripsi"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {product.sku}
                      </td>

                      {/* BARCODE */}
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {product.barcode}
                      </td>

                      {/* PRICE */}
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                        {formatRupiah(product.price)}
                      </td>

                      {/* STOCK */}
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                        {product.stock}
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      {/* ACTION */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => pluStock(product.id)}    
                            title="Tambah stock"
                            className="flex items-center gap-1 rounded-lg bg-blue-100 p-2 text-gray-400 transition hover:bg-blue-200 hover:text-blue-600"
                          >
                            <Plus size={17} />
                            <p>Stock</p>
                          </button>

                          <button
                            title="Edit"
                            onClick={() => setSelectedProduct(product.id)}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-orange-50 hover:text-orange-600"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            title="Hapus"
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                            onClick={() => deleteHandler(product.id)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="flex flex-col gap-2 border-t border-gray-100 px-6 py-4 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Menampilkan {filteredProducts.length} dari {data.length} produk
          </p>

          <p>Data persediaan produk IndoSwalayan</p>
        </div>
      </div>

      {/* POPUP EDIT PRODUK */}
      {selectedProduct !== null && (
        <EditProduct
          id={selectedProduct}
          data={data}
          onClose={() => setSelectedProduct(null)}
          onSuccess={fetchProducts}
        />
      )}
    </div>
  )
}

// STAT CARD COMPONENT
const StatCard = ({
  title,
  value,
  description,
  icon,
  color,
}: {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  color: string
}) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>

        <div className={`rounded-xl p-3 ${colors[color]}`}>{icon}</div>
      </div>

      <h3 className="mt-4 text-2xl font-bold text-gray-900">{value}</h3>

      <p className="mt-1 text-xs text-gray-400">{description}</p>
    </div>
  )
}

export default Products
