"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { formatRupiah, formatDateTime } from "@/lib/utils"
import { Users, Wallet, ArrowUpCircle, ArrowDownCircle, Activity, TrendingUp } from "lucide-react"

interface DashboardData {
  stats: {
    totalSantri: number
    totalSaldo: number
    totalSetoran: number
    totalPenarikan: number
    transaksiHariIni: number
  }
  recentTransactions: Array<{
    id: number
    jenis: string
    jumlah: number
    created_at: string
    santri_nama: string
    santri_nis: string
    user_nama: string
    keterangan: string | null
  }>
  topSavers: Array<{
    id: number
    nama: string
    nis: string
    saldo: number
  }>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/dashboard")
        const result = await res.json()
        setData(result)
      } catch (error) {
        console.error("Error fetching dashboard:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const stats = [
    { label: "Total Santri", value: data?.stats.totalSantri || 0, icon: Users, color: "bg-blue-500", format: (v: number) => v.toString() },
    { label: "Total Saldo", value: data?.stats.totalSaldo || 0, icon: Wallet, color: "bg-primary", format: formatRupiah },
    { label: "Total Setoran", value: data?.stats.totalSetoran || 0, icon: ArrowUpCircle, color: "bg-emerald-500", format: formatRupiah },
    { label: "Total Penarikan", value: data?.stats.totalPenarikan || 0, icon: ArrowDownCircle, color: "bg-orange-500", format: formatRupiah },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Selamat Datang, {user?.nama}!
        </h1>
        <p className="text-muted-foreground mt-1">Berikut ringkasan data tabungan santri</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="p-6 bg-card rounded-xl border border-border hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stat.format(stat.value)}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-card rounded-xl border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Aktivitas Hari Ini</h3>
            <p className="text-sm text-muted-foreground">{data?.stats.transaksiHariIni || 0} transaksi</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-foreground">Transaksi Terbaru</h3>
          </div>
          <div className="divide-y divide-border">
            {data?.recentTransactions?.slice(0, 5).map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tx.jenis === "setoran" ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"}`}>
                    {tx.jenis === "setoran" ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{tx.santri_nama}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(tx.created_at)}</p>
                  </div>
                </div>
                <p className={`font-semibold ${tx.jenis === "setoran" ? "text-emerald-600" : "text-orange-600"}`}>
                  {tx.jenis === "setoran" ? "+" : "-"}{formatRupiah(tx.jumlah)}
                </p>
              </div>
            ))}
            {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
              <div className="p-8 text-center text-muted-foreground">Belum ada transaksi</div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Penabung Terbaik</h3>
          </div>
          <div className="divide-y divide-border">
            {data?.topSavers?.map((santri, index) => (
              <div key={santri.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? "bg-yellow-500 text-white" : index === 1 ? "bg-gray-400 text-white" : index === 2 ? "bg-amber-700 text-white" : "bg-muted text-muted-foreground"}`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{santri.nama}</p>
                    <p className="text-xs text-muted-foreground">NIS: {santri.nis}</p>
                  </div>
                </div>
                <p className="font-semibold text-primary">{formatRupiah(santri.saldo)}</p>
              </div>
            ))}
            {(!data?.topSavers || data.topSavers.length === 0) && (
              <div className="p-8 text-center text-muted-foreground">Belum ada data santri</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
