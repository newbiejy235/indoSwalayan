"use client"

import React, { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  QrCode,
  Scan,
  Package,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react"
import toast from "react-hot-toast"
import Html5QrcodePlugin from "@/components/QRcode/page"
import api from "@/lib/api"
import userData from "@/utils/userData"

interface product {
  name: string
  description?: string
  barcode: string
  price: string
  stock: number
}

const AddProduct = () => {
  const [image, setImage] = useState<File | null>(null)
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [isScannerOpen, setIsScannerOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  const [product, setProduct] = useState<product>({
    name: "",
    description: "",
    barcode: "",
    price: "",
    stock: 0,
  })

  const [user, setUser] = useState<{
    email: string | null
    role: string | null
    token: string | null
  } | null>(null)

  useEffect(() => {
    const getUsers = async () => {
      const data = userData.get()
      setUser(data)
    }

    getUsers()
  }, [])

  console.log(scannedCode)

  // Callback stabil untuk menangani hasil decoding QR Code
  const onNewScanResult = useCallback(
    (decodedText: string, decodedResult: any) => {
      // 7. Hasil decoding ditampilkan melalui console.log()
      console.log("QR Code:", decodedText)
      console.log("Result:", decodedResult)

      setScannedCode(decodedText)
      setProduct((prev) => ({
        ...prev,
        barcode: decodedText,
      }))

      toast.success("QR Code berhasil terbaca!")
    },
    []
  )

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar!")
      return
    }

    setImage(file)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!product.barcode) {
      toast.error("Silakan scan QR Code terlebih dahulu!")
      return
    }

    if (!product.name || !product.price || product.stock <= 0) {
      toast.error("Lengkapi data produk terlebih dahulu!")
      return
    }

    if (!image) {
      toast.error("Silakan masukkan gambar produk!")
      return
    }

    try {
      const formData = new FormData()

      formData.append("name", product.name)
      formData.append("description", product.description || "")
      formData.append("barcode", product.barcode)
      formData.append("price", product.price)
      formData.append("stock", String(product.stock))
      formData.append("image", image)

      console.log("data produk", product)
      console.log("data form", formData)
      console.log(user);
      

      const response = await api.post("/product/tambah", formData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      })

      if (response.data.success) {
        toast.success("Produk berhasil ditambahkan!")

        setProduct({
          name: "",
          description: "",
          barcode: "",
          price: "",
          stock: 0,
        })

        setImage(null)
        setScannedCode(null)
        console.log(response)
      }
    } catch (error) {
      console.error("ADD PRODUCT ERROR:", error)
      toast.error("Gagal menambahkan produk!")
    }
  }

  const handleCopyCode = () => {
    if (!scannedCode) return
    navigator.clipboard.writeText(scannedCode)
    setCopied(true)
    toast.success("Kode QR disalin ke clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  const addHandler = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setProduct((prev) => ({
      ...prev,
      [name]: name === "stock" ? Number(value) : value,
    }))
  }

  return (
    <div className="min-h-screen flex-1 bg-[#f8fafc] p-5 md:p-8">
      {/* Navigation & Header */}
      <div className="mb-6">
        <Link
          href="/product"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Daftar Produk</span>
        </Link>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Dashboard / Produk / Tambah
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
              Tambah Produk
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Pindai QR code produk untuk membaca kode barang secara otomatis.
            </p>
          </div>

          {/* Toggle Button Scanner */}
          <button
            type="button"
            onClick={() => setIsScannerOpen((prev) => !prev)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
          >
            <QrCode size={18} className="text-emerald-700" />
            <span>
              {isScannerOpen ? "Sembunyikan Scanner" : "Buka Scanner QR"}
            </span>
            {isScannerOpen ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom Kiri / Scanner Section */}
        <div className="space-y-6 lg:col-span-7">
          {isScannerOpen && (
            <div className="transition-all duration-300">
              <Html5QrcodePlugin
                id="html5qr-code-addProduct"
                fps={10}
                qrbox={250}
                aspectRatio={1.0}
                autoStart={false}
                qrCodeSuccessCallback={onNewScanResult}
              />
            </div>
          )}

          {/* Scanned Result Feedback Card */}
          {scannedCode && (
            <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Scan size={18} />
                  <h3 className="font-bold text-gray-900">
                    Data QR Code Terakhir
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  Tersimpan di State
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400">Nilai Terbaca:</p>
                  <p className="mt-0.5 font-mono text-base font-bold break-all text-gray-900 select-all">
                    {scannedCode}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 active:scale-95"
                  >
                    {copied ? (
                      <Check size={14} className="text-green-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                    <span>{copied ? "Disalin!" : "Salin Kode"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan / Form Placeholder & Petunjuk */}
        <div className="space-y-6 lg:col-span-5">
          {/* Card Petunjuk Penggunaan */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-gray-900">
              <Info size={18} className="text-emerald-700" />
              <h3 className="text-base font-bold">Petunjuk Scan QR</h3>
            </div>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs leading-relaxed text-gray-600">
              <li>
                Pastikan perangkat Anda memiliki kamera yang berfungsi dan izin
                akses kamera diizinkan oleh browser.
              </li>
              <li>
                Klik tombol <strong>Mulai Kamera</strong> pada modul scanner.
              </li>
              <li>
                Arahkan kamera ke QR Code produk hingga berada tepat di dalam
                area bidik (viewfinder).
              </li>
              <li>
                Setelah berhasil terbaca, kode akan dicetak pada konsol
                developer (<code>console.log</code>) dan scanner dihentikan
                sementara.
              </li>
              <li>
                Gunakan tombol <strong>Scan Ulang</strong> untuk membaca kode
                produk berikutnya.
              </li>
            </ol>
          </div>

          {/* Card Form Produk (Draft / Preview) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 text-gray-900">
              <Package size={18} className="text-emerald-700" />
              <h3 className="text-base font-bold">Formulir Tambah Produk</h3>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Kode Barcode / QR Produk
                </label>
                <input
                  name="barcode"

                  type="text"
                  readOnly
                  value={product.barcode}
                  placeholder="Akan terisi otomatis setelah scan QR..."
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 font-mono text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Nama Produk
                </label>
                <input
                  name="name"
                  value={product.name}
                  onChange={addHandler}
                  type="text"
                  placeholder="Contoh: Minyak Goreng Bimoli 2L"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Description (optional)
                </label>
                <input
                  name="description"
                  value={product.description}
                  onChange={addHandler}
                  type="text"
                  placeholder="Contoh: Minyak Goreng Bimoli 2L"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  masukan gambar produk
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  placeholder="Contoh: Minyak Goreng Bimoli 2L"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500 placeholder-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">
                    Harga (Rp)
                  </label>
                  <input
                    name="price"
                    value={product.price}
                    onChange={addHandler}
                    type="number"
                    min={1}
                    placeholder="Contoh: 35000"
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">
                    Jumlah Stok
                  </label>
                  <input
                    type="number"
                    min={1}
                    name="stock"
                    value={product.stock}
                    onChange={addHandler}
                    placeholder="Contoh: 50"
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500 placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                <form onSubmit={handleSubmit}>
                  {/* Seluruh input produk lu */}

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
                  >
                    Simpan Produk
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddProduct
