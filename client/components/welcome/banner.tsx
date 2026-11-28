"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

const slides = [
  {
    id: 1,
    image: "/images/minum.jpg",
    title: "Yuk, temukan produk favoritmu di indoSwalayan!",
    description: "Temukan berbagai kebutuhan harian dengan mudah.",
  },
  {
    id: 2,
    image: "/images/sayur.jpg",
    title: "Belanja kebutuhan harian jadi lebih mudah!",
    description: "Semua kebutuhanmu tersedia dalam satu tempat.",
  },
  {
    id: 3,
    image: "/images/buah.jpg",
    title: "Produk berkualitas, harga bersahabat!",
    description: "Nikmati pengalaman belanja yang nyaman bersama kami.",
  },
]

export default function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isPaused])

  return (
    <section className="w-full px-4 py-6 md:px-8">
      <div
        className="relative mx-auto max-w-[1800px] overflow-hidden rounded-[32px] bg-[#EFE3B5]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Carousel Track */}
        <div
          className="flex transition-transform duration-1000 ease-in-out"
          style={{
            transform: `translateX(-${activeIndex * 100}%)`,
          }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="grid min-w-full grid-cols-1 items-center gap-8 p-6 md:grid-cols-[1.7fr_0.8fr] md:gap-12 md:px-12 md:py-14 lg:px-[8.5%]"
            >
              {/* Image */}
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[28px]">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={slide.id === 1}
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover"
                />
              </div>

              {/* Text */}
              <div className="flex flex-col justify-center py-4 md:py-0">
                <h1 className="max-w-[500px] text-3xl leading-[1.35] font-bold tracking-tight text-black md:text-4xl lg:text-[42px]">
                  {slide.title}
                </h1>

                <p className="mt-4 max-w-[420px] text-sm leading-relaxed text-black/60 md:text-base">
                  {slide.description}
                </p>

                {/* Yellow Accent */}
                <div className="mt-5 flex items-center gap-6">
                  <div className="h-[10px] w-full max-w-[300px] rounded-full bg-[#F4C21B]" />
                  <div className="h-[10px] w-[10px] shrink-0 rounded-full bg-[#F4C21B]" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Indicators */}
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 md:bottom-6">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={activeIndex === index ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
              className={`h-2.5 rounded-full transition-all duration-500 ${
                activeIndex === index
                  ? "w-9 bg-[#DDAE00]"
                  : "w-2.5 bg-black/20 hover:bg-black/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
