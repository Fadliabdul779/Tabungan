"use client"

import { useState } from "react"
import useSWR from "swr"
import { Search, Eye, Trash2, Edit, ChevronDown, ChevronUp, X } from "lucide-react"
import { useAuth } from "./auth-provider"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatRupiah(num: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num)
}

export function SantriList() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [kelas, setKelas] = useState("")
  const [selectedSantri, setSelectedSantri] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editData, setEditData] = useState({ nama: "", kelas: "", alamat: "", no_hp: "" })

  const { data, mutate } = useSWR(
    `/api/santri?search=${encodeURIComponent(search)}&kelas=${encodeURIComponent(kelas)}`,
    fetcher
  )

  const { data: detailData, mutate: mutateDetail } = useSWR(
    selectedSantri ? `/api/santri/${selectedSantri.id}` : null,
    fetcher
  )

  const handleViewDetail = (santri: any) => {
    setSelectedSantri(santri)
    setIsDetailOpen(true)
  }

  const handleEdit = (santri: any) => {
    setSelectedSantri(santri)
    setEditData({
      nama: santri.nama,
      kelas: santri.kelas,
      alamat: santri.alamat || "",
      no_hp: santri.no_hp || "",
    })
    setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    const res = await fetch(`/api/santri/${selectedSantri.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    })

    if (res.ok) {
      mutate()
      setIsEditOpen(false)
    }
  }

  const handleDelete = async (santri: any) => {
    if (!confirm(`Yakin ingin menghapus data ${santri.nama}?`)) return

    const res = await fetch(`/api/santri/${santri.id}`, {
      method: "DELETE",
    })

    if (res.ok) {
      mutate()
    }
  }

  const kelasList = ["7A", "7B", "8A", "8B", "9A", "9B", "10A", "10B", "11A", "11B", "12A", "12B"]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Data Santri</h2>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama atau NIS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={kelas}
          onChange={(e) => setKelas(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Semua Kelas</option>
          {kelasList.map((k) => (
            <option key={k} value={k}>
              Kelas {k}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">NIS</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Nama</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">
                  Kelas
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Saldo</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.santri?.length > 0 ? (
                data.santri.map((s: any) => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm text-foreground">{s.nis}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{s.nama}</td>
                    <td className="px-4 py-3 text-sm text-foreground hidden sm:table-cell">{s.kelas}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-primary">
                      {formatRupiah(s.saldo)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetail(s)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg"
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {user?.role === "admin" && (
                          <>
                            <button
                              onClick={() => handleEdit(s)}
                              className="p-2 text-warning hover:bg-warning/10 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(s)}
                              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {data ? "Tidak ada data santri" : "Memuat..."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailOpen && selectedSantri && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Detail Santri</h3>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-1 hover:bg-muted rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">NIS</p>
                  <p className="font-medium text-foreground">{selectedSantri.nis}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-medium text-foreground">{selectedSantri.nama}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kelas</p>
                  <p className="font-medium text-foreground">{selectedSantri.kelas}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className="font-semibold text-primary">{formatRupiah(selectedSantri.saldo)}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="font-medium text-foreground mb-3">Riwayat Transaksi</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {detailData?.transaksi?.length > 0 ? (
                    detailData.transaksi.map((t: any) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground capitalize">{t.jenis}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(t.created_at).toLocaleString("id-ID")}
                          </p>
                        </div>
                        <p
                          className={`font-semibold ${
                            t.jenis === "setoran" ? "text-success" : "text-destructive"
                          }`}
                        >
                          {t.jenis === "setoran" ? "+" : "-"}
                          {formatRupiah(t.jumlah)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Belum ada transaksi
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && selectedSantri && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border w-full max-w-md">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Edit Santri</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1 hover:bg-muted rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nama</label>
                <input
                  type="text"
                  value={editData.nama}
                  onChange={(e) => setEditData({ ...editData, nama: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Kelas</label>
                <select
                  value={editData.kelas}
                  onChange={(e) => setEditData({ ...editData, kelas: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {kelasList.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Alamat</label>
                <input
                  type="text"
                  value={editData.alamat}
                  onChange={(e) => setEditData({ ...editData, alamat: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">No. HP</label>
                <input
                  type="text"
                  value={editData.no_hp}
                  onChange={(e) => setEditData({ ...editData, no_hp: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
