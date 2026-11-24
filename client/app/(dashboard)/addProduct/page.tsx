"use client"

import React, { useCallback, useState } from "react"
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

const AddProduct = () => {
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [isScannerOpen, setIsScannerOpen] = useState(true)
  const [copied, setCopied] = useState(false)

  // Callback stabil untuk menangani hasil decoding QR Code
  const onNewScanResult = useCallback(
    (decodedText: string, decodedResult: any) => {
      // 7. Hasil decoding ditampilkan melalui console.log()
      console.log("QR Code:", decodedText)
      console.log("Result:", decodedResult)

      setScannedCode(decodedText)
      toast.success("QR Code berhasil terbaca!")
    },
    []
  )

  const handleCopyCode = () => {
    if (!scannedCode) return
    navigator.clipboard.writeText(scannedCode)
    setCopied(true)
    toast.success("Kode QR disalin ke clipboard")
    setTimeout(() => setCopied(false), 2000)
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
            <span>{isScannerOpen ? "Sembunyikan Scanner" : "Buka Scanner QR"}</span>
            {isScannerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom Kiri / Scanner Section */}
        <div className="space-y-6 lg:col-span-7">
          {isScannerOpen && (
            <div className="transition-all duration-300">
              <Html5QrcodePlugin
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
                  <p className="mt-0.5 select-all break-all font-mono text-base font-bold text-gray-900">
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
              <h3 className="font-bold text-base">Petunjuk Scan QR</h3>
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
                Setelah berhasil terbaca, kode akan dicetak pada konsol developer
                (<code>console.log</code>) dan scanner dihentikan sementara.
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
              <h3 className="font-bold text-base">Formulir Tambah Produk</h3>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Kode Barcode / QR Produk
                </label>
                <input
                  type="text"
                  readOnly
                  value={scannedCode || ""}
                  placeholder="Akan terisi otomatis setelah scan QR..."
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 font-mono text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Nama Produk
                </label>
                <input
                  type="text"
                  disabled
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
                    type="text"
                    disabled
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
                    disabled
                    placeholder="Contoh: 50"
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500 placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                <strong>Catatan Tahap Pengerjaan:</strong> Integrasi API dan
                penyimpanan data produk akan dihubungkan pada tahap berikutnya.
                Fokus tahap ini adalah memastikan kamera scanner stabil, tidak
                duplikat, dan pembacaan QR Code berjalan dengan baik.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddProduct
