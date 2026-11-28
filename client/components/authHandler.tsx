"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import userData from "@/utils/userData"
import toast from "react-hot-toast"
import { isTokenExpired } from "@/utils/token.vaalidation"

const AuthHandler = () => {
  const router = useRouter()

  useEffect(() => {
    const user = userData.get()

    if (user?.token && user.role == "pemilik" && !isTokenExpired(user.token)) {
      router.replace("/dashboard")
      toast.success("Welcome back to dashboard!")
      return
    }

    router.replace("/")
  }, [router])

  return null
}

export default AuthHandler
