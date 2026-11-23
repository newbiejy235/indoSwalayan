"use client"
import React from "react"

import userData from "@/utils/userData"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar/sidebar"

const Dashboard = () => {
  const router = useRouter()
  useEffect(() => {
    const data = userData.get()
    console.log(data)
    if (!data?.token) {
      router.push("/")
    }
  }, [])
  return <div></div>
}

export default Dashboard
