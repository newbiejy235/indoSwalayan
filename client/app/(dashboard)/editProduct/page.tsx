"use client"

import api from "@/lib/api"
import React, { useState } from "react"
import { X, Package, Save, Loader2 } from "lucide-react"
import userData from "@/utils/userData"

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

type EditProductProps = {
  id: number
  data: Product[]
  onClose: () => void
  onSuccess?: () => void
}

type EditForm = {
  name: string
  description: string
  stock: string
  price: string
}

const EditProduct = ({ id, data, onClose, onSuccess }: EditProductProps) => {
  const product = data.find((item) => item.id === id)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState(product?.imageUrl ?? "")

  const [form, setForm] = useState<EditForm>({
    name: product?.name ?? "",
    description: product?.description ?? "",
    stock: String(product?.stock ?? 0),
    price: product?.price ?? "",
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  if (!product) return null

  const editHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      setLoading(true)
      setMessage("")

      const users = await userData.get()
      const formData = new FormData()

      formData.append("name", form.name)
      formData.append("description", form.description)
      formData.append("price", form.price)
      // Hanya kirim field yang benar-benar ingin diperbarui.
      if (imageFile) {
        formData.append("image", imageFile)
      }

      // Jika tidak ada perubahan, hentikan request.
      if (!imageFile) {
        setMessage("Pilih foto baru terlebih dahulu.")
        return
      }

      // formData.forEach((value, key) => {
      //   console.log(key, value)
      // })

      const result = await api.patch(`/product/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${users?.token}`,
        },
      })

      if (!result.data.success) {
        setMessage(result.data.message || "Gagal memperbarui produk")
        return
      }

      onSuccess?.()
      onClose()
    } catch (error: any) {
      const errorData = error.response?.data

      console.error("EDIT PRODUCT ERROR:", errorData || error)

      setMessage(
        errorData?.message || "Terjadi kesalahan saat memperbarui produk"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">
      {/* MODAL */}
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-100 p-2.5 text-orange-600">
              <Package size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">Edit Produk</h2>

              <p className="text-xs text-gray-400">Perbarui informasi produk</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={editHandler}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          {/* SCROLL AREA */}
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            {/* NAMA PRODUK */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nama Produk
              </label>

              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* DESKRIPSI */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Deskripsi
              </label>

              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm transition outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* HARGA */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Harga
              </label>

              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: e.target.value,
                  })
                }
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* STATUS PRODUK */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status Produk
              </label>
            </div>

            {/* GAMBAR PRODUK */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Gambar Produk
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]

                  if (!file) return

                  setImageFile(file)
                  setPreviewImage(URL.createObjectURL(file))
                }}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-green-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-green-700 hover:file:bg-green-100"
              />

              {previewImage && (
                <div className="mt-3">
                  <p className="mb-2 text-xs text-gray-400">Preview gambar</p>

                  <img
                    src={previewImage}
                    alt="Preview produk"
                    className="h-36 w-36 rounded-xl border border-gray-200 object-cover"
                  />
                </div>
              )}
            </div>

            {/* ERROR MESSAGE */}
            {message && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {message}
              </p>
            )}
          </div>

          {/* FOOTER - FIXED */}
          <div className="flex shrink-0 flex-wrap justify-end gap-2.5 border-t border-gray-100 bg-white p-4 sm:gap-3 sm:p-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}

              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProduct
