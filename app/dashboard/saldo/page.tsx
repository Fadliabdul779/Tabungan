"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { formatRupiah, formatDateTime } from "@/lib/utils"
import { Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react"

interface SantriData {
  id: number
  nama: string
  nis: string
  kelas: string
  asrama: string
  saldo: number
}

interface Transaksi {
  id: number
  jenis: string
  jumlah: number
  keterangan: string | null
  created_at: string
}

export default function SaldoPage() {
  const { user } = useAuth()
  const [santri, setSantri] = useState<SantriData | null>(null)
  const [transaksi, setTransaksi] = useState<Transaksi[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.santri_id) {
        setLoading(false)
        return
      }

      try {
        const santriRes = await fetch(`/api/santri/${user.santri_id}`)
        const santriData = await santriRes.json()
        setSantri(santriData.santri)

        const txRes = await fetch(`/api/transaksi?santri_id=${user.santri_id}&limit=20`)
        const txData = await txRes.json()
        setTransaksi(txData.transaksi || [])
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-muted rounded-xl animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!santri) {
    return (
      <div className="text-center py-16">
        <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Akun Tidak Terhubung</h3>
        <p className="text-muted-foreground">Akun Anda belum terhubung dengan data santri</p>
      </div>
    )
  }

  const totalSetoran = transaksi
    .filter((tx) => tx.jenis === "setoran")
    .reduce((sum, tx) => sum + tx.jumlah, 0)

  const totalPenarikan = transaksi
    .filter((tx) => tx.jenis === "penarikan")
    .reduce((sum, tx) => sum + tx.jumlah, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Saldo Saya</h1>
        <p className="text-muted-foreground mt-1">Informasi saldo dan riwayat transaksi Anda</p>
      </div>

      {/* Saldo Card */}
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 text-primary-foreground">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-primary-foreground/80">Saldo Tabungan</p>
            <h2 className="text-3xl md:text-4xl font-bold">{formatRupiah(santri.saldo)}</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-primary-foreground/20">
          <div>
            <p className="text-sm text-primary-foreground/70">Nama</p>
            <p className="font-semibold">{santri.nama}</p>
          </div>
          <div>
            <p className="text-sm text-primary-foreground/70">NIS</p>
            <p className="font-semibold">{santri.nis}</p>
          </div>
          <div>
            <p className="text-sm text-primary-foreground/70">Kelas</p>
            <p className="font-semibold">{santri.kelas}</p>
          </div>
          <div>
            <p className="text-sm text-primary-foreground/70">Asrama</p>
            <p className="font-semibold">{santri.asrama}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-6 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <ArrowUpCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Setoran</p>
              <p className="text-xl font-bold text-emerald-600">{formatRupiah(totalSetoran)}</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <ArrowDownCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Penarikan</p>
              <p className="text-xl font-bold text-orange-600">{formatRupiah(totalPenarikan)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-foreground">Riwayat Transaksi Terakhir</h3>
        </div>
        <div className="divide-y divide-border">
          {transaksi.slice(0, 10).map((tx) => (
            <div key={tx.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${tx.jenis === "setoran" ? "bg-emerald-500/10" : "bg-orange-500/10"}`}>
                  {tx.jenis === "setoran" ? (
                    <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ArrowDownCircle className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground capitalize">{tx.jenis}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(tx.created_at)}</p>
                </div>
              </div>
              <p className={`font-semibold ${tx.jenis === "setoran" ? "text-emerald-600" : "text-orange-600"}`}>
                {tx.jenis === "setoran" ? "+" : "-"}{formatRupiah(tx.jumlah)}
              </p>
            </div>
          ))}
          {transaksi.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Belum ada riwayat transaksi
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
