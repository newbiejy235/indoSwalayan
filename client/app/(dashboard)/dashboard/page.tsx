"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ShoppingCart,
  Package,
  Wallet,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from "lucide-react"

import userData from "@/utils/userData"
import api from "@/lib/api"
import axios from "axios"

interface SalesStatistic {
  totalTransactions: number
  totalItemsSold: number
}

interface IncomeStatistic {
  totalIncome: number
  totalTransactions: number
}

interface PopularProduct {
  productId: number | null
  productName: string
  totalSold: number
  totalRevenue: number
}

const getToday = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

const Dashboard = () => {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [salesData, setSalesData] = useState<SalesStatistic>({
    totalTransactions: 0,
    totalItemsSold: 0,
  })
  const [incomeData, setIncomeData] = useState<IncomeStatistic>({
    totalIncome: 0,
    totalTransactions: 0,
  })
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([])

  const [today, setToday] = useState("")

  const fetchStatistic = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      const date = getToday()
      setToday(date)

      const data = userData.get()

      const params = {
        startDate: date,
        endDate: date,
      }

      const [sales, income, popular] = await Promise.all([
        api.get("/statistic/sales", {
          headers: {
            Authorization: `Bearer ${data?.token}`,
          },
          params,
        }),
        api.get("/statistic/income", {
          headers: {
            Authorization: `Bearer ${data?.token}`,
          },
          params,
        }),
        api.get("/statistic/popular-product", {
          headers: {
            Authorization: `Bearer ${data?.token}`,
          },
          params,
        }),
      ])

      // Jika tidak ada transaksi, backend mengembalikan angka 0
      setSalesData({
        totalTransactions: sales.data.data?.totalTransactions ?? 0,
        totalItemsSold: sales.data.data?.totalItemsSold ?? 0,
      })

      setIncomeData({
        totalIncome: income.data.data?.totalIncome ?? 0,
        totalTransactions: income.data.data?.totalTransactions ?? 0,
      })

      // Jika tidak ada produk terjual, tampilkan array kosong
      setPopularProducts(
        Array.isArray(popular.data.data) ? popular.data.data : []
      )
    } catch (err: unknown) {
      console.error("Gagal mengambil statistik:", err)

      setError(
        (axios.isAxiosError(err) &&
          (err.response?.data?.message as string | undefined)) ||
          "Gagal memuat statistik. Silakan coba lagi."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = userData.get()?.token
    if (!token) {
      router.replace("/")
      return
    }

    fetchStatistic()
  }, [router, fetchStatistic])

  return (
    <div className="min-h-screen w-full min-w-0 bg-gray-50">
      <main className="p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Ringkasan aktivitas penjualan IndoSwalayan
            </p>
          </div>

          <button
            onClick={fetchStatistic}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh Data
          </button>
        </div>

        {/* Date */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <span className="font-medium text-gray-700">Periode:</span>
          {today
            ? new Date(`${today}T12:00:00+07:00`).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "Hari ini"}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle size={18} />
              {error}
            </div>
            <button
              onClick={fetchStatistic}
              className="text-sm font-semibold text-red-600"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Statistic Cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {/* Transactions */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <ShoppingCart size={23} />
              </div>
              <span className="text-xs font-medium text-gray-400">
                HARI INI
              </span>
            </div>

            <p className="text-sm text-gray-500">Total Transaksi</p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              {loading
                ? "..."
                : salesData.totalTransactions.toLocaleString("id-ID")}
            </h2>

            <p className="mt-3 text-xs text-gray-400">
              Transaksi berhasil diselesaikan
            </p>
          </div>

          {/* Items Sold */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                <Package size={23} />
              </div>
              <span className="text-xs font-medium text-gray-400">
                HARI INI
              </span>
            </div>

            <p className="text-sm text-gray-500">Barang Terjual</p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              {loading
                ? "..."
                : salesData.totalItemsSold.toLocaleString("id-ID")}
            </h2>

            <p className="mt-3 text-xs text-gray-400">
              Total kuantitas seluruh produk
            </p>
          </div>

          {/* Income */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="rounded-xl bg-green-50 p-3 text-green-600">
                <Wallet size={23} />
              </div>
              <span className="text-xs font-medium text-gray-400">
                HARI INI
              </span>
            </div>

            <p className="text-sm text-gray-500">Total Pendapatan</p>

            <h2 className="mt-2 text-2xl font-bold break-words text-gray-900 sm:text-3xl">
              {loading ? "..." : formatRupiah(incomeData.totalIncome)}
            </h2>

            <p className="mt-3 text-xs text-gray-400">
              Dari transaksi yang telah selesai
            </p>
          </div>
        </div>

        {/* Popular Products */}
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="text-green-600" size={20} />
                <h2 className="text-lg font-bold text-gray-900">
                  Best Selling Products
                </h2>
              </div>
              <p className="mt-1 text-sm text-gray-400">
                10 produk dengan penjualan tertinggi hari ini
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-medium">#</th>
                  <th className="px-6 py-4 font-medium">Nama Produk</th>
                  <th className="px-6 py-4 text-right font-medium">Terjual</th>
                  <th className="px-6 py-4 text-right font-medium">
                    Pendapatan
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400">
                      Memuat data produk...
                    </td>
                  </tr>
                ) : popularProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400">
                      Belum ada penjualan produk hari ini.
                    </td>
                  </tr>
                ) : (
                  popularProducts.map((product, index) => (
                    <tr
                      key={`${product.productId ?? product.productName}-${index}`}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-400">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-800">
                        {product.productName}
                      </td>

                      <td className="px-6 py-4 text-right font-semibold text-gray-700">
                        {product.totalSold.toLocaleString("id-ID")} pcs
                      </td>

                      <td className="px-6 py-4 text-right text-gray-600">
                        {formatRupiah(product.totalRevenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-gray-400">
          IndoSwalayan POS Dashboard
        </p>
      </main>
    </div>
  )
}

export default Dashboard
