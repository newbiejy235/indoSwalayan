"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// EditProduct bukan halaman standalone - komponen ini hanya digunakan sebagai modal
// Jika diakses langsung, redirect ke halaman produk
export default function EditProductPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/product")
  }, [router])
  return null
}

