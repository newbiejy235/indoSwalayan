"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import userData from "@/utils/userData"
import Sidebar from "@/components/sidebar/sidebar"

const TambahKaryawan = () => {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
  })

  useEffect(() => {
    const checkAuth = async () => {
      const session = await userData.get()

      if (!session?.token) {
        router.replace("/")
      }
    }

    checkAuth()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setLoading(true)
    setMessage("")
    setError("")

    try {
      const session = await userData.get()

      if (!session?.token) {
        router.replace("/")
        return
      }
      const response = await api.post(
        "/auth/register/karyawan",
        {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone_number: form.phone_number,
          password: form.password,
        },
        {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        }
      )

      setMessage(response.data.message || "Karyawan berhasil ditambahkan.")

      setForm({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        password: "",
      })
    } catch (err: any) {
      console.error("Gagal menambahkan karyawan:", err)

      setError(
        err.response?.data?.message ||
          "Terjadi kesalahan saat menambahkan karyawan."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full min-w-0 bg-gray-50">
      <main className="p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="karyawan"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Kembali ke Data Karyawan
          </Link>

          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Tambah Karyawan
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Daftarkan akun baru untuk karyawan IndoSwalayan.
          </p>
        </div>

        <div className="max-w-3xl rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h2 className="font-bold text-gray-900">Informasi Akun Karyawan</h2>
            <p className="mt-1 text-xs text-gray-500">
              Lengkapi informasi berikut untuk membuat akun karyawan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            {message && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Nama */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Nama depan
              </label>

              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Nama belakang
              </label>

              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="contoh@email.com"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Telepon */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Nomor Telepon
              </label>

              <input
                type="tel"
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                placeholder="08xxxxxxxxxx"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Password
              </label>

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Masukkan password akun"
                required
                minLength={6}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />

              <p className="mt-2 text-xs text-gray-400">Minimal 6 karakter.</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-100 pt-5 sm:flex-row">
              <Link
                href="/dashboard/karyawan"
                className="rounded-xl border border-gray-200 px-5 py-3 text-center text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Batal
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? "Mendaftarkan..." : "Daftarkan Karyawan"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default TambahKaryawan
