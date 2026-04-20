"use client"

import { useEffect, useState } from "react"
import { formatRupiah } from "@/lib/utils"
import { Plus, Search, Edit2, Trash2, X, Users } from "lucide-react"

interface Santri {
  id: number
  nama: string
  nis: string
  kelas: string
  asrama: string
  no_hp: string | null
  alamat: string | null
  saldo: number
}

export default function SantriPage() {
  const [santriList, setSantriList] = useState<Santri[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingSantri, setEditingSantri] = useState<Santri | null>(null)
  const [formData, setFormData] = useState({
    nama: "", nis: "", kelas: "", asrama: "", no_hp: "", alamat: ""
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const fetchSantri = async () => {
    try {
      const res = await fetch(`/api/santri?search=${search}`)
      const data = await res.json()
      setSantriList(data.santri || [])
    } catch (err) {
      console.error("Error fetching santri:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSantri()
  }, [search])

  const openForm = (santri?: Santri) => {
    if (santri) {
      setEditingSantri(santri)
      setFormData({
        nama: santri.nama,
        nis: santri.nis,
        kelas: santri.kelas,
        asrama: santri.asrama,
        no_hp: santri.no_hp || "",
        alamat: santri.alamat || ""
      })
    } else {
      setEditingSantri(null)
      setFormData({ nama: "", nis: "", kelas: "", asrama: "", no_hp: "", alamat: "" })
    }
    setShowForm(true)
    setError("")
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingSantri(null)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const url = editingSantri ? `/api/santri/${editingSantri.id}` : "/api/santri"
      const method = editingSantri ? "PUT" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }

      closeForm()
      fetchSantri()
    } catch {
      setError("Terjadi kesalahan server")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Yakin ingin menghapus santri "${nama}"?`)) return

    try {
      const res = await fetch(`/api/santri/${id}`, { method: "DELETE" })
      const data = await res.json()
      
      if (!res.ok) {
        alert(data.error)
        return
      }

      fetchSantri()
    } catch {
      alert("Terjadi kesalahan server")
    }
  }

  const kelasList = ["VII", "VIII", "IX", "X", "XI", "XII"]
  const asramaList = ["Putra A", "Putra B", "Putri A", "Putri B"]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Data Santri</h1>
          <p className="text-muted-foreground mt-1">Kelola data santri pesantren</p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Tambah Santri
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau NIS..."
          className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : santriList.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Belum Ada Data Santri</h3>
          <p className="text-muted-foreground mb-6">Klik tombol &quot;Tambah Santri&quot; untuk menambahkan</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Nama</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">NIS</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Kelas</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Asrama</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Saldo</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {santriList.map((santri) => (
                  <tr key={santri.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{santri.nama}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{santri.nis}</td>
                    <td className="px-6 py-4 text-muted-foreground">{santri.kelas}</td>
                    <td className="px-6 py-4 text-muted-foreground">{santri.asrama}</td>
                    <td className="px-6 py-4 text-right font-semibold text-primary">
                      {formatRupiah(santri.saldo)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openForm(santri)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(santri.id, santri.nama)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {editingSantri ? "Edit Santri" : "Tambah Santri Baru"}
              </h2>
              <button onClick={closeForm} className="p-2 hover:bg-muted rounded-lg">
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
                <label className="block text-sm font-medium text-foreground mb-2">Nama Lengkap *</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">NIS *</label>
                  <input
                    type="text"
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Kelas *</label>
                  <select
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Pilih Kelas</option>
                    {kelasList.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Asrama *</label>
                <select
                  value={formData.asrama}
                  onChange={(e) => setFormData({ ...formData, asrama: e.target.value })}
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Pilih Asrama</option>
                  {asramaList.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">No. HP</label>
                <input
                  type="text"
                  value={formData.no_hp}
                  onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Alamat</label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : editingSantri ? "Update" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
