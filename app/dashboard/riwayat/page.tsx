"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { formatRupiah, formatDateTime } from "@/lib/utils"
import { FileText, ArrowUpCircle, ArrowDownCircle, Calendar } from "lucide-react"

interface Transaksi {
  id: number
  jenis: string
  jumlah: number
  keterangan: string | null
  created_at: string
}

export default function RiwayatPage() {
  const { user } = useAuth()
  const [transaksi, setTransaksi] = useState<Transaksi[]>([])
  const [loading, setLoading] = useState(true)
  const [filterJenis, setFilterJenis] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.santri_id) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/transaksi?santri_id=${user.santri_id}&limit=100`)
        const data = await res.json()
        setTransaksi(data.transaksi || [])
      } catch (err) {
        console.error("Error fetching transaksi:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const filteredTransaksi = filterJenis
    ? transaksi.filter((tx) => tx.jenis === filterJenis)
    : transaksi

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Riwayat Transaksi</h1>
        <p className="text-muted-foreground mt-1">Seluruh riwayat setoran dan penarikan Anda</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterJenis("")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${!filterJenis ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilterJenis("setoran")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterJenis === "setoran" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}
        >
          Setoran
        </button>
        <button
          onClick={() => setFilterJenis("penarikan")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterJenis === "penarikan" ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}
        >
          Penarikan
        </button>
      </div>

      {/* Transaction List */}
      {filteredTransaksi.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Belum Ada Riwayat</h3>
          <p className="text-muted-foreground">Anda belum memiliki riwayat transaksi</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {filteredTransaksi.map((tx) => (
            <div key={tx.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${tx.jenis === "setoran" ? "bg-emerald-500/10" : "bg-orange-500/10"}`}>
                  {tx.jenis === "setoran" ? (
                    <ArrowUpCircle className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ArrowDownCircle className="w-6 h-6 text-orange-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground capitalize">{tx.jenis}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Calendar className="w-3 h-3" />
                    {formatDateTime(tx.created_at)}
                  </div>
                  {tx.keterangan && (
                    <p className="text-sm text-muted-foreground mt-1">{tx.keterangan}</p>
                  )}
                </div>
              </div>
              <p className={`text-lg font-bold ${tx.jenis === "setoran" ? "text-emerald-600" : "text-orange-600"}`}>
                {tx.jenis === "setoran" ? "+" : "-"}{formatRupiah(tx.jumlah)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
