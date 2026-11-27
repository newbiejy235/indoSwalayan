"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import userData from "@/utils/userData"
import { BookUser, Plus } from "lucide-react"

interface Karyawan {
  code: string
  first_name: string
  last_name: string
  email: string
  phone_number?: string
}

const DashboardKaryawan = () => {
  const router = useRouter()

  const [karyawan, setKaryawan] = useState<Karyawan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchKaryawan = async () => {
      try {
        const session = await userData.get()

        if (!session?.token) {
          router.replace("/")
          return
        }

        const response = await api.get("/data/karyawan", {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        })

        // Mengambil data dari response API
        const result = response.data.data

        setKaryawan(Array.isArray(result) ? result : [])
      } catch (err) {
        console.error("Gagal mengambil data karyawan:", err)
        setError("Gagal mengambil data karyawan.")
      } finally {
        setLoading(false)
      }
    }

    fetchKaryawan()
  }, [router])

  const filteredKaryawan = useMemo(() => {
    return karyawan.filter((item) => {
      const keyword = search.toLowerCase()

      return (
        item.first_name?.toLowerCase().includes(keyword) ||
        item.last_name?.toLowerCase().includes(keyword) ||
        item.email?.toLowerCase().includes(keyword) ||
        item.code?.includes(keyword)
      )
    })
  }, [karyawan, search])

  return (
    <div className="min-h-screen w-full min-w-0 bg-gray-50">
      <main className="p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Data</h1>
            <p className="mt-1 text-sm text-gray-500">
              Kelola dan pantau seluruh data karyawan IndoSwalayan.
            </p>
          </div>

          <Link
            href="/addKaryawan"
            className="flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Add new employee
          </Link>
        </div>

        {/* Statistics */}
        <div className="mb-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Karyawan</p>
                <h2 className="mt-2 text-3xl font-bold text-gray-900">
                  {loading ? "..." : karyawan.length}
                </h2>
              </div>

              <div>
                <BookUser />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Employee List </h2>
              <p className="mt-1 text-xs text-gray-500">
                Informasi seluruh karyawan yang terdaftar.
              </p>
            </div>

            <input
              type="text"
              placeholder="Cari nama, email, atau ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 sm:w-72"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">Employee code</th>
                  <th className="px-6 py-4">Nama Karyawan</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">No. Telepon</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      Memuat data karyawan...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-red-500">
                      {error}
                    </td>
                  </tr>
                ) : filteredKaryawan.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="mb-2 text-3xl">📂</div>
                      <p className="font-medium text-gray-700">
                        {search
                          ? "Karyawan tidak ditemukan"
                          : "Belum ada karyawan"}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {search
                          ? "Coba gunakan kata kunci lain."
                          : "Data karyawan akan muncul di sini."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredKaryawan.map((item, index) => (
                    <tr key={item.code} className="transition hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 text-gray-500">#{item.code}</td>

                      <td className="px-6 py-4 font-semibold whitespace-nowrap text-gray-800">
                        {item.first_name || "-"} <span></span>
                        {item.last_name || "-"}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {item.email || "-"}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {item.phone_number || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-100 px-6 py-4 text-xs text-gray-500">
            Menampilkan {filteredKaryawan.length} dari {karyawan.length}{" "}
            karyawan
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardKaryawan
