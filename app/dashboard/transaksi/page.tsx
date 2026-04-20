"use client"

import { useEffect, useState } from "react"
import { formatRupiah, formatDateTime } from "@/lib/utils"
import { ArrowUpCircle, ArrowDownCircle, Search, Plus, X, Wallet } from "lucide-react"

interface Santri {
  id: number
  nama: string
  nis: string
  saldo: number
}

interface Transaksi {
  id: number
  santri_id: number
  jenis: string
  jumlah: number
  keterangan: string | null
  created_at: string
  santri_nama: string
  santri_nis: string
  user_nama: string
}

export default function TransaksiPage() {
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([])
  const [santriList, setSantriList] = useState<Santri[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null)
  const [searchSantri, setSearchSantri] = useState("")
  const [jenis, setJenis] = useState<"setoran" | "penarikan">("setoran")
  const [jumlah, setJumlah] = useState("")
  const [keterangan, setKeterangan] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [filterJenis, setFilterJenis] = useState("")

  const fetchTransaksi = async () => {
    try {
      const url = filterJenis ? `/api/transaksi?jenis=${filterJenis}` : "/api/transaksi"
      const res = await fetch(url)
      const data = await res.json()
      setTransaksiList(data.transaksi || [])
    } catch (err) {
      console.error("Error fetching transaksi:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSantri = async () => {
    try {
      const res = await fetch("/api/santri")
      const data = await res.json()
      setSantriList(data.santri || [])
    } catch (err) {
      console.error("Error fetching santri:", err)
    }
  }

  useEffect(() => {
    fetchTransaksi()
    fetchSantri()
  }, [filterJenis])

  const openForm = () => {
    setShowForm(true)
    setSelectedSantri(null)
    setSearchSantri("")
    setJenis("setoran")
    setJumlah("")
    setKeterangan("")
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSantri) {
      setError("Pilih santri terlebih dahulu")
      return
    }
    if (!jumlah || parseInt(jumlah) <= 0) {
      setError("Jumlah harus lebih dari 0")
      return
    }

    setSaving(true)
    setError("")

    try {
      const res = await fetch("/api/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          santri_id: selectedSantri.id,
          jenis,
          jumlah: parseInt(jumlah),
          keterangan: keterangan || null
        })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }

      setShowForm(false)
      fetchTransaksi()
      fetchSantri()
    } catch {
      setError("Terjadi kesalahan server")
    } finally {
      setSaving(false)
    }
  }

  const filteredSantri = santriList.filter(
    (s) => s.nama.toLowerCase().includes(searchSantri.toLowerCase()) ||
           s.nis.includes(searchSantri)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Transaksi</h1>
          <p className="text-muted-foreground mt-1">Kelola setoran dan penarikan tabungan</p>
        </div>
        <button
          onClick={openForm}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Transaksi Baru
        </button>
      </div>

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

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : transaksiList.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Belum Ada Transaksi</h3>
          <p className="text-muted-foreground">Klik &quot;Transaksi Baru&quot; untuk memulai</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {transaksiList.map((tx) => (
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
                  <p className="font-medium text-foreground">{tx.santri_nama}</p>
                  <p className="text-sm text-muted-foreground">NIS: {tx.santri_nis}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(tx.created_at)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${tx.jenis === "setoran" ? "text-emerald-600" : "text-orange-600"}`}>
                  {tx.jenis === "setoran" ? "+" : "-"}{formatRupiah(tx.jumlah)}
                </p>
                {tx.keterangan && (
                  <p className="text-xs text-muted-foreground mt-1">{tx.keterangan}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Transaksi Baru</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Pilih Santri *</label>
                {selectedSantri ? (
                  <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{selectedSantri.nama}</p>
                      <p className="text-sm text-muted-foreground">NIS: {selectedSantri.nis} | Saldo: {formatRupiah(selectedSantri.saldo)}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedSantri(null)} className="p-1 hover:bg-accent rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={searchSantri}
                        onChange={(e) => setSearchSantri(e.target.value)}
                        placeholder="Cari nama atau NIS..."
                        className="w-full pl-10 pr-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                      {filteredSantri.slice(0, 5).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => { setSelectedSantri(s); setSearchSantri("") }}
                          className="w-full p-3 text-left hover:bg-muted transition-colors"
                        >
                          <p className="font-medium text-foreground">{s.nama}</p>
                          <p className="text-sm text-muted-foreground">NIS: {s.nis}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Jenis Transaksi *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setJenis("setoran")}
                    className={`p-4 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${jenis === "setoran" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "border-border hover:border-emerald-300"}`}
                  >
                    <ArrowUpCircle className="w-5 h-5" />
                    Setoran
                  </button>
                  <button
                    type="button"
                    onClick={() => setJenis("penarikan")}
                    className={`p-4 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${jenis === "penarikan" ? "border-orange-500 bg-orange-500/10 text-orange-600" : "border-border hover:border-orange-300"}`}
                  >
                    <ArrowDownCircle className="w-5 h-5" />
                    Penarikan
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Jumlah (Rp) *</label>
                <input
                  type="number"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  placeholder="0"
                  min="1"
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-lg font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Keterangan</label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Opsional..."
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${jenis === "setoran" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"}`}
                >
                  {saving ? "Memproses..." : `Proses ${jenis === "setoran" ? "Setoran" : "Penarikan"}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
