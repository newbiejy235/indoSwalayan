"use client"

import Footer from "@/components/welcome/footer"
import Hero from "@/components/welcome/hero"
import Navbar from "@/components/welcome/navbar"
import ProductGrid from "@/components/welcome/search"
import { useProducts } from "@/utils/productHandler"
import ProductRequest from "@/components/welcome/form"
import HeroCarousel from "@/components/welcome/banner"

export default function HomePage() {
  const { products, loading, error, reload } = useProducts()

  return (
    <div className="bg-[#E9D58E]">
      <Navbar />
      <main>
        <Hero />
        <HeroCarousel />

        <ProductGrid
          products={products}
          loading={loading}
          error={error}
          onRetry={reload}
        />
      </main>
      <ProductRequest />
      <Footer />
    </div>
  )
}
