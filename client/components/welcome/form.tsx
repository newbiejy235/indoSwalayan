"use client"

import React from "react"
import { useForm } from "@formspree/react"

const ProductRequest = () => {
  const [state, handleSubmit] = useForm("meagryea")

  return (
    <section id="contact" className="w-full px-4 py-10 sm:px-6 md:py-14">
      <div className="mx-auto max-w-[1100px]">
        {/* TICKET */}
        <div className="grid overflow-hidden rounded-[22px] bg-[#4B607F] text-[#F8F4E8] shadow-lg lg:grid-cols-[0.85fr_1.15fr_76px]">
          {/* LEFT CONTENT */}
          <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-9">
            <div>
              {/* BRAND */}
              <div className="mb-9 flex items-center gap-3">
               <img className="h-20 w-20" src="/images/logoPutih2.png" alt="" />

                <div className="flex flex-col text-lg font-semibold">
                  <span>Store</span>
                  <span className="font-normal">Services</span>
                </div>
              </div>

              {/* HEADING */}
              <div className="max-w-[340px]">
                <span className="mb-3 inline-block rounded-full border border-white/25 px-3 py-1 text-[9px] font-medium tracking-[2px] text-white/80 uppercase">
                  Product Request
                </span>

                <h2 className="[font-family:var(--font-jakarta)] text-[25px] leading-[1.25] font-bold tracking-tight sm:text-[29px]">
                  Barang yang kamu cari belum tersedia?
                </h2>

                <p className="mt-3 [font-family:var(--font-poppins)] text-[12px] leading-[1.8] text-white/65 sm:text-[13px]">
                  Produk yang kamu butuhkan belum ada? Beri tahu kami agar bisa
                  melengkapi kebutuhan belanjamu.
                </p>
              </div>
            </div>

            {/* BOTTOM MESSAGE */}
            <div className="mt-8 border-t border-white/20 pt-4">
              <p className="[font-family:var(--font-jakarta)] text-sm font-semibold">
                Your suggestion matters!
              </p>

              <p className="mt-1 max-w-[280px] [font-family:var(--font-poppins)] text-[11px] leading-relaxed text-white/55">
                Setiap masukan membantu kami menghadirkan produk yang lebih
                lengkap.
              </p>
            </div>
          </div>

          {/* FORM */}
          <div className="flex flex-col justify-center bg-[#536987] p-6 sm:p-8 lg:px-9">
            {state.succeeded ? (
              /* SUCCESS */
              <div className="flex min-h-[350px] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#8BC83F] text-3xl font-bold text-[#26351F]">
                  ✓
                </div>

                <span className="mt-5 text-[10px] tracking-[2px] text-white/50 uppercase">
                  Request submitted
                </span>

                <h3 className="mt-2 [font-family:var(--font-jakarta)] text-2xl font-bold">
                  Thank you!
                </h3>

                <p className="mt-2 max-w-[280px] [font-family:var(--font-poppins)] text-xs leading-relaxed text-white/65">
                  Permintaan produkmu berhasil dikirim. Terima kasih sudah
                  membantu kami!
                </p>
              </div>
            ) : (
              /* REQUEST FORM */
              <>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="[font-family:var(--font-poppins)] text-[9px] tracking-[2px] text-white/50 uppercase">
                      Your suggestion
                    </p>

                    <h3 className="mt-1 [font-family:var(--font-jakarta)] text-xl font-bold">
                      Send a request
                    </h3>
                  </div>

                  <span className="rounded-full bg-white/10 px-3 py-1.5 [font-family:var(--font-poppins)] text-[9px] tracking-wider text-white/70">
                    FORM 001
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* EMAIL */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block [font-family:var(--font-poppins)] text-[11px] font-medium"
                    >
                      Email address
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="your@email.com"
                      className="h-[42px] w-full rounded-lg bg-[#EFE3C2] px-4 [font-family:var(--font-poppins)] text-xs text-[#29394E] transition outline-none placeholder:text-[#29394E]/40 focus:ring-2 focus:ring-[#F4BE32]"
                    />
                  </div>

                  {/* PRODUCT */}
                  <div>
                    <label
                      htmlFor="product"
                      className="mb-1.5 block [font-family:var(--font-poppins)] text-[11px] font-medium"
                    >
                      Product name
                    </label>

                    <input
                      id="product"
                      name="product"
                      type="text"
                      required
                      maxLength={100}
                      placeholder="Contoh: Sabun mandi Lifebuoy"
                      className="h-[42px] w-full rounded-lg bg-[#EFE3C2] px-4 [font-family:var(--font-poppins)] text-xs text-[#29394E] transition outline-none placeholder:text-[#29394E]/40 focus:ring-2 focus:ring-[#F4BE32]"
                    />
                  </div>

                  {/* DESCRIPTION */}
                  <div>
                    <label
                      htmlFor="description"
                      className="mb-1.5 block [font-family:var(--font-poppins)] text-[11px] font-medium"
                    >
                      Additional details
                      <span className="ml-1 text-[10px] text-white/40">
                        (Optional)
                      </span>
                    </label>

                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      maxLength={500}
                      placeholder="Brand, ukuran, varian, atau detail lainnya..."
                      className="w-full resize-none rounded-lg bg-[#EFE3C2] p-3.5 [font-family:var(--font-poppins)] text-xs text-[#29394E] transition outline-none placeholder:text-[#29394E]/40 focus:ring-2 focus:ring-[#F4BE32]"
                    />
                  </div>

                  {/* ERROR */}
                  {state.errors && (
                    <p role="alert" className="text-xs text-[#FFD1C5]">
                      Gagal mengirim permintaan. Silakan coba lagi.
                    </p>
                  )}

                  {/* SUBMIT */}
                  <button
                    type="submit"
                    disabled={state.submitting}
                    className="group flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-[#8BC83F] [font-family:var(--font-poppins)] text-xs font-semibold text-[#172516] transition-all duration-300 hover:bg-[#9BDA4C] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {state.submitting ? (
                      "Sending request..."
                    ) : (
                      <>
                        Submit request
                        <span className="transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </>
                    )}
                  </button>

                  <p className="text-center [font-family:var(--font-poppins)] text-[9px] text-white/40">
                    Your suggestion helps us serve you better.
                  </p>
                </form>
              </>
            )}
          </div>

          {/* TICKET STUB */}
          <div className="relative flex items-center justify-center bg-[#F47721] py-5 lg:py-0">
            {/* PERFORATION */}
            <div className="absolute top-0 left-0 hidden h-full border-l-2 border-dashed border-[#F8F6EF]/80 lg:block" />

            <div className="flex items-center gap-5 lg:flex-col lg:gap-5">
              {/* LIBRE BARCODE */}
              <span className=" [font-family:var(--font-barcode)] text-[65px] leading-none text-[#24251E] lg:[writing-mode:vertical-rl]">
                INDOSWALAYAN
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <span className="[font-family:var(--font-poppins)] text-[9px] tracking-[1.5px] text-[#4B607F]/50 uppercase">
            INDOSWALAYAN — CUSTOMER EXPERIENCE
          </span>

          <span className="[font-family:var(--font-poppins)] text-[9px] text-[#4B607F]/50">
            Your voice matters.
          </span>
        </div>
      </div>
    </section>
  )
}

export default ProductRequest
