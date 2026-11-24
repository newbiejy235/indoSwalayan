"use client"

import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import React, { useEffect, useState } from "react"
import userData from "@/utils/userData"
import { useRouter } from "next/navigation"

const Login = () => {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(false)

  useEffect(() => {
    const data = userData.get()
    if (data?.token) {
      router.push("/dashboard")
    }
  })

  const loginHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setMessage("")
    setStatus(false)

    if (!email.trim() || !password.trim()) {
      return setMessage("Email dan password wajib diisi!")
    }

    if (password.trim().length < 6) {
      return setMessage("Password minimal 6 karakter")
    }

    try {
      setLoading(true)

      const response = await api.post("/auth/login", {
        email,
        password,
      })

      if (!response.data.success) {
        setMessage(response.data.message)
        return
      }

      setMessage(response.data.message)
      setStatus(true)

      const emailUser = response.data.userData.email
      const role = response.data.userData.role
      const token = response.data.userData.token

      userData.save(emailUser, role, token)

      router.push("/dashboard")
    } catch (error: any) {
      console.error("Login error:", error)

      setMessage(
        error.response?.data?.message ||
          "Terjadi kesalahan saat login. Coba lagi."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 sm:px-6">
      <div className="flex w-full max-w-5xl flex-col items-center gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-10 md:p-12 lg:flex-row lg:justify-center lg:gap-20 lg:p-16">
        {/* Logo */}
        <div className="flex h-56 w-56 max-w-full justify-center rounded-tr-[60px] rounded-bl-[60px] border border-blue-700 sm:h-72 sm:w-72 sm:rounded-tr-[90px] sm:rounded-bl-[90px]">
          <img
            src="/images/indoSwalayan2.png"
            alt="IndoSwalayan Logo"
            className="h-auto w-40 object-contain sm:w-52 lg:max-w-sm"
          />
        </div>

        {/* Form */}
        <form
          onSubmit={loginHandler}
          className="flex w-full flex-col space-y-4 lg:w-1/2"
        >
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
              Welcome Back!
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Masuk ke akun IndoSwalayan kamu.
            </p>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-700"
            >
              Email
            </label>

            <input
              id="email"
              className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 text-sm transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email"
              required
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <input
              id="password"
              className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 text-sm transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="secondary"
            disabled={loading}
            className="h-11 w-full"
          >
            {loading ? "Memproses..." : "Login"}
          </Button>

          {/* Message */}
          {message && (
            <div
              className={`rounded-lg p-3 text-sm ${
                status
                  ? "border border-green-200 bg-green-50 text-green-700"
                  : "border border-red-200 bg-red-50 text-red-600"
              }`}
            >
              {message}
            </div>
          )}
        </form>
      </div>
    </main>
  )
}

export default Login
