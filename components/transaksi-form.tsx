"use client"

import { useState } from "react"
import useSWR from "swr"
import { Search, TrendingUp, TrendingDown, CheckCircle } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatRupiah(num: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num)
}

interface TransaksiFormProps {
  onSuccess?: () => void
}

export function TransaksiForm({ onSuccess }: TransaksiFormProps) {
  const [search, setSearch] = useState("")
  const [selectedSantri, setSelectedSantri] = useState<any>(null)
  const [jenis, setJenis] = useState<"setoran" | "penarikan">("setoran")
  const [jumlah, setJumlah] = useState("")
  const [keterangan, setKeterangan] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<{ message: string; saldoBaru: number } | null>(null)
  const [error, setError] = useState("")

  const { data: santriData, mutate: mutateSantri } = useSWR(
    search.length > 0 ? `/api/santri?search=${encodeURIComponent(search)}` : null,
    fetcher
  )

  const handleSelectSantri = (santri: any) => {
    setSelectedSantri(santri)
    setSearch("")
    setSuccess(null)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSantri) return

    setIsLoading(true)
    setError("")
    setSuccess(null)

    const amount = parseInt(jumlah.replace(/\D/g, ""))

    if (!amount || amount <= 0) {
      setError("Jumlah harus lebih dari 0")
      setIsLoading(false)
      return
    }

    const res = await fetch("/api/transaksi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        santri_id: selectedSantri.id,
        jenis,
        jumlah: amount,
        keterangan,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || "Transaksi gagal")
    } else {
      setSuccess({
        message: `${jenis === "setoran" ? "Setoran" : "Penarikan"} berhasil!`,
        saldoBaru: data.saldo_baru,
      })
      setSelectedSantri({ ...selectedSantri, saldo: data.saldo_baru })
      setJumlah("")
      setKeterangan("")
      onSuccess?.()
    }

    setIsLoading(false)
  }

  const handleJumlahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value) {
      setJumlah(new Intl.NumberFormat("id-ID").format(parseInt(value)))
    } else {
      setJumlah("")
    }
  }

  const quickAmounts = [10000, 20000, 50000, 100000, 200000, 500000]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Transaksi</h2>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Search Santri */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Pilih Santri</h3>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama atau NIS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Search Results */}
          {search && santriData?.santri && (
            <div className="border border-border rounded-lg max-h-60 overflow-y-auto">
              {santriData.santri.length > 0 ? (
                santriData.santri.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSantri(s)}
                    className="w-full px-4 py-3 text-left hover:bg-muted/50 border-b border-border last:border-b-0 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">{s.nama}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.nis} - Kelas {s.kelas}
                      </p>
                    </div>
                    <p className="font-semibold text-primary">{formatRupiah(s.saldo)}</p>
                  </button>
                ))
              ) : (
                <p className="px-4 py-3 text-muted-foreground text-center">
                  Tidak ditemukan
                </p>
              )}
            </div>
          )}

          {/* Selected Santri */}
          {selectedSantri && (
            <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{selectedSantri.nama}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSantri.nis} - Kelas {selectedSantri.kelas}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className="text-xl font-bold text-primary">
                    {formatRupiah(selectedSantri.saldo)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Form */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Form Transaksi</h3>

          {!selectedSantri ? (
            <div className="text-center py-8 text-muted-foreground">
              Pilih santri terlebih dahulu
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Transaction Type */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setJenis("setoran")}
                  className={`p-4 rounded-lg border-2 flex items-center gap-3 transition-colors ${
                    jenis === "setoran"
                      ? "border-success bg-success/10 text-success"
                      : "border-border text-muted-foreground hover:border-success/50"
                  }`}
                >
                  <TrendingUp className="h-6 w-6" />
                  <span className="font-medium">Setoran</span>
                </button>
                <button
                  type="button"
                  onClick={() => setJenis("penarikan")}
                  className={`p-4 rounded-lg border-2 flex items-center gap-3 transition-colors ${
                    jenis === "penarikan"
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-border text-muted-foreground hover:border-destructive/50"
                  }`}
                >
                  <TrendingDown className="h-6 w-6" />
                  <span className="font-medium">Penarikan</span>
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Jumlah (Rp)
                </label>
                <input
                  type="text"
                  value={jumlah}
                  onChange={handleJumlahChange}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Quick Amounts */}
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setJumlah(new Intl.NumberFormat("id-ID").format(amount))}
                    className="px-3 py-1.5 text-sm bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"
                  >
                    {formatRupiah(amount)}
                  </button>
                ))}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Keterangan (opsional)
                </label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Masukkan keterangan..."
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-success/10 text-success px-4 py-3 rounded-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{success.message}</p>
                    <p className="text-sm">Saldo baru: {formatRupiah(success.saldoBaru)}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !jumlah}
                className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  jenis === "setoran"
                    ? "bg-success text-success-foreground hover:bg-success/90"
                    : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : jenis === "setoran" ? (
                  <>
                    <TrendingUp className="h-5 w-5" />
                    Proses Setoran
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-5 w-5" />
                    Proses Penarikan
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
