"use client"

import { useState } from "react"
import useSWR from "swr"
import { TrendingUp, TrendingDown, Filter } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatRupiah(num: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num)
}

export function TransaksiHistory() {
  const [filter, setFilter] = useState<"" | "setoran" | "penarikan">("")

  const { data } = useSWR(
    `/api/transaksi${filter ? `?jenis=${filter}` : ""}`,
    fetcher
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Riwayat Transaksi</h2>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === ""
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilter("setoran")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            filter === "setoran"
              ? "bg-success text-success-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Setoran
        </button>
        <button
          onClick={() => setFilter("penarikan")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            filter === "penarikan"
              ? "bg-destructive text-destructive-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <TrendingDown className="h-4 w-4" />
          Penarikan
        </button>
      </div>

      {/* Transaction List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Waktu
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Santri
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">
                  Jenis
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Jumlah
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground hidden md:table-cell">
                  Saldo Setelah
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.transaksi?.length > 0 ? (
                data.transaksi.map((t: any) => (
                  <tr key={t.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div>
                        <p>{new Date(t.created_at).toLocaleDateString("id-ID")}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleTimeString("id-ID")}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <p className="font-medium text-foreground">{t.santri_nama}</p>
                      <p className="text-xs text-muted-foreground">{t.santri_nis}</p>
                    </td>
                    <td className="px-4 py-3 text-sm hidden sm:table-cell">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          t.jenis === "setoran"
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {t.jenis === "setoran" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {t.jenis}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p
                        className={`font-semibold ${
                          t.jenis === "setoran" ? "text-success" : "text-destructive"
                        }`}
                      >
                        {t.jenis === "setoran" ? "+" : "-"}
                        {formatRupiah(t.jumlah)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <p className="font-medium text-foreground">
                        {formatRupiah(t.saldo_sesudah)}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {data ? "Belum ada transaksi" : "Memuat..."}
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
