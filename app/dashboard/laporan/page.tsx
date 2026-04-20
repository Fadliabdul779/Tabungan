"use client"

import { useEffect, useState } from "react"
import { formatRupiah, formatDate } from "@/lib/utils"
import { FileText, Download, Calendar, TrendingUp, TrendingDown, Wallet } from "lucide-react"

interface ReportData {
  totalSetoran: number
  totalPenarikan: number
  totalSaldo: number
  totalSantri: number
  transaksiCount: number
}

interface Transaksi {
  id: number
  jenis: string
  jumlah: number
  created_at: string
  santri_nama: string
  santri_nis: string
}

export default function LaporanPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const fetchReport = async () => {
    setLoading(true)
    try {
      const dashRes = await fetch("/api/dashboard")
      const dashData = await dashRes.json()
      
      setReportData({
        totalSetoran: dashData.stats.totalSetoran,
        totalPenarikan: dashData.stats.totalPenarikan,
        totalSaldo: dashData.stats.totalSaldo,
        totalSantri: dashData.stats.totalSantri,
        transaksiCount: dashData.stats.transaksiHariIni
      })

      const txRes = await fetch("/api/transaksi?limit=50")
      const txData = await txRes.json()
      setTransaksiList(txData.transaksi || [])
    } catch (err) {
      console.error("Error fetching report:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

  const filteredTransaksi = transaksiList.filter((tx) => {
    if (!startDate && !endDate) return true
    const txDate = new Date(tx.created_at).toISOString().split("T")[0]
    if (startDate && txDate < startDate) return false
    if (endDate && txDate > endDate) return false
    return true
  })

  const filteredSetoran = filteredTransaksi
    .filter((tx) => tx.jenis === "setoran")
    .reduce((sum, tx) => sum + tx.jumlah, 0)

  const filteredPenarikan = filteredTransaksi
    .filter((tx) => tx.jenis === "penarikan")
    .reduce((sum, tx) => sum + tx.jumlah, 0)

  const exportCSV = () => {
    const headers = ["No", "Tanggal", "Nama Santri", "NIS", "Jenis", "Jumlah"]
    const rows = filteredTransaksi.map((tx, index) => [
      index + 1,
      formatDate(tx.created_at),
      tx.santri_nama,
      tx.santri_nis,
      tx.jenis === "setoran" ? "Setoran" : "Penarikan",
      tx.jumlah
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `laporan-tabungan-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Laporan</h1>
          <p className="text-muted-foreground mt-1">Ringkasan dan laporan keuangan tabungan</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Saldo</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {formatRupiah(reportData?.totalSaldo || 0)}
              </p>
            </div>
            <div className="p-3 bg-primary rounded-lg">
              <Wallet className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Setoran</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {formatRupiah(reportData?.totalSetoran || 0)}
              </p>
            </div>
            <div className="p-3 bg-emerald-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Penarikan</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {formatRupiah(reportData?.totalPenarikan || 0)}
              </p>
            </div>
            <div className="p-3 bg-orange-500 rounded-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="p-4 bg-card rounded-xl border border-border">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium">Filter Tanggal:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="self-center text-muted-foreground">sampai</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(""); setEndDate("") }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filtered Summary */}
      {(startDate || endDate) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <p className="text-sm text-emerald-600 font-medium">Setoran (Periode)</p>
            <p className="text-xl font-bold text-emerald-600">{formatRupiah(filteredSetoran)}</p>
          </div>
          <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
            <p className="text-sm text-orange-600 font-medium">Penarikan (Periode)</p>
            <p className="text-xl font-bold text-orange-600">{formatRupiah(filteredPenarikan)}</p>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Riwayat Transaksi</h3>
          <span className="text-sm text-muted-foreground">({filteredTransaksi.length} transaksi)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Tanggal</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Santri</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Jenis</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransaksi.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(tx.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{tx.santri_nama}</p>
                    <p className="text-xs text-muted-foreground">NIS: {tx.santri_nis}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${tx.jenis === "setoran" ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"}`}>
                      {tx.jenis === "setoran" ? "Setoran" : "Penarikan"}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-semibold ${tx.jenis === "setoran" ? "text-emerald-600" : "text-orange-600"}`}>
                    {tx.jenis === "setoran" ? "+" : "-"}{formatRupiah(tx.jumlah)}
                  </td>
                </tr>
              ))}
              {filteredTransaksi.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    Tidak ada transaksi untuk periode ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
