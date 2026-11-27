"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import userData from "@/utils/userData"
import toast from "react-hot-toast"

const AuthHandler = () => {
  const router = useRouter()

  useEffect(() => {
    const user = userData.get()

    if (user?.token && user.role == "pemilik") {
      router.replace("/dashboard")
      toast.success("Welcome back to dashboard!")
      return
    }

    router.replace("/")
  }, [router])

  return null
}

export default AuthHandler
