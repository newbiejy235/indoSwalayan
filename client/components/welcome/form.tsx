import React from "react"
import { useForm, ValidationError } from "@formspree/react"

const ProductRequest = () => {
  const [state, handleSubmit] = useForm("meagryea")
  if (state.succeeded) {
    alert("berhasil kirim request")
  }

  return (
    <section
      id="contact"
      className="w-full rounded-2xl bg-[#EDE1B5] px-4 py-8 sm:px-8 sm:py-10 md:px-14"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-10">
        {/* Informasi */}
        <div className="space-y-4">
          <span className="text-xs sm:text-sm font-semibold tracking-widest text-[#8B7136] uppercase">
            Product Request
          </span>

          <h2 className="text-2xl sm:text-3xl leading-tight font-bold text-[#3C3320] md:text-4xl">
            Barang yang kamu cari belum tersedia?
          </h2>

          <p className="max-w-md text-sm sm:text-base leading-relaxed text-[#665B40]">
            Jangan khawatir! Kamu bisa mengajukan permintaan pengadaan barang
            yang sedang kamu butuhkan. Kami akan berusaha menyediakan produk
            pilihanmu agar pengalaman belanjamu semakin lengkap.
          </p>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#8B7136]">
            <span>✦</span>
            <p>Permintaanmu akan ditinjau langsung oleh pihak toko.</p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl bg-white p-4 sm:p-6 shadow-sm md:p-8"
        >
          <div>
            <h3 className="text-xl font-bold text-[#3C3320]">
              Ajukan Permintaan Barang
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Isi informasi berikut untuk mengajukan pengadaan.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nama lengkap
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Masukkan nama kamu"
              className="h-11 w-full rounded-lg border border-gray-200 px-4 transition outline-none focus:border-[#B69A50]"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="example@gmail.com"
              className="h-11 w-full rounded-lg border border-gray-200 px-4 transition outline-none focus:border-[#B69A50]"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="product"
              className="text-sm font-medium text-gray-700"
            >
              Nama barang yang dibutuhkan
            </label>
            <input
              id="product"
              name="product"
              type="text"
              required
              placeholder="Contoh: Minyak goreng 2 liter"
              className="h-11 w-full rounded-lg border border-gray-200 px-4 transition outline-none focus:border-[#B69A50]"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="quantity"
              className="text-sm font-medium text-gray-700"
            >
              Jumlah yang dibutuhkan
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              required
              placeholder="Contoh: 2"
              className="h-11 w-full rounded-lg border border-gray-200 px-4 transition outline-none focus:border-[#B69A50]"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium text-gray-700"
            >
              Keterangan tambahan (opsional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Tambahkan detail produk jika diperlukan..."
              className="w-full resize-none rounded-lg border border-gray-200 p-4 transition outline-none focus:border-[#B69A50]"
            />
          </div>

          <button
            type="submit"
            className="h-12 w-full rounded-lg bg-[#3C3320] font-semibold text-white transition hover:bg-[#5A4A2B]"
          >
            Kirim Permintaan →
          </button>

          <p className="text-center text-xs text-gray-400">
            Terima kasih telah membantu kami melengkapi kebutuhanmu!
          </p>
        </form>
      </div>
    </section>
  )
}

export default ProductRequest
