"use client"

import Footer from "@/components/welcome/footer"
import Hero from "@/components/welcome/hero"
import Navbar from "@/components/welcome/navbar"
import ProductGrid from "@/components/welcome/search"
import ShowcaseBanner from "@/components/welcome/banner"
import { useProducts } from "@/utils/productHandler"
import ProductRequest from "@/components/welcome/form"

export default function HomePage() {
  const { products, loading, error, reload } = useProducts()

  return (
    <>
      <Navbar />
      <main>
        <Hero />
      
        <ProductGrid
          products={products}
          loading={loading}
          error={error}
          onRetry={reload}
        />
      </main>
      <ProductRequest/>
      <Footer />
    </>
  )
}
