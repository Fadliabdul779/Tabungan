"use client"

import { useState } from "react"
import useSWR from "swr"
import { useAuth } from "./auth-provider"
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  LogOut, 
  Menu, 
  X,
  Home,
  UserPlus,
  CreditCard,
  BarChart3,
  Settings
} from "lucide-react"
import { SantriList } from "./santri-list"
import { TransaksiForm } from "./transaksi-form"
import { TransaksiHistory } from "./transaksi-history"
import { SantriForm } from "./santri-form"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatRupiah(num: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num)
}

export function Dashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { data: stats, mutate: mutateStats } = useSWR("/api/stats", fetcher, {
    refreshInterval: 30000,
  })

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "santri", label: "Data Santri", icon: Users },
    { id: "transaksi", label: "Transaksi", icon: CreditCard },
    { id: "riwayat", label: "Riwayat", icon: BarChart3 },
    ...(user?.role === "admin" ? [{ id: "tambah-santri", label: "Tambah Santri", icon: UserPlus }] : []),
  ]

  const handleTransactionSuccess = () => {
    mutateStats()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-md">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-primary-foreground/10 rounded-lg"
        >
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <h1 className="font-bold">Tabungan Santri</h1>
        <button
          onClick={logout}
          className="p-2 hover:bg-primary-foreground/10 rounded-lg"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-40 transform transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary">Tabungan Santri</h1>
          <p className="text-sm text-muted-foreground">PPM Zaenab Masykur</p>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id)
                setIsSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{user?.nama}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Santri</p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats?.totalSantri || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Saldo</p>
                      <p className="text-lg lg:text-2xl font-bold text-foreground">
                        {formatRupiah(stats?.totalSaldo || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Setoran Hari Ini</p>
                      <p className="text-lg lg:text-2xl font-bold text-success">
                        {formatRupiah(stats?.todaySetoran || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                      <TrendingDown className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Penarikan Hari Ini</p>
                      <p className="text-lg lg:text-2xl font-bold text-destructive">
                        {formatRupiah(stats?.todayPenarikan || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Transaksi Terbaru</h3>
                </div>
                <div className="divide-y divide-border">
                  {stats?.recentTransaksi?.length > 0 ? (
                    stats.recentTransaksi.map((t: any) => (
                      <div
                        key={t.id}
                        className="px-6 py-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-foreground">{t.santri_nama}</p>
                          <p className="text-sm text-muted-foreground">
                            {t.santri_nis} - {new Date(t.created_at).toLocaleString("id-ID")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-semibold ${
                              t.jenis === "setoran" ? "text-success" : "text-destructive"
                            }`}
                          >
                            {t.jenis === "setoran" ? "+" : "-"}
                            {formatRupiah(t.jumlah)}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{t.jenis}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-8 text-center text-muted-foreground">
                      Belum ada transaksi
                    </div>
                  )}
                </div>
              </div>

              {/* Kelas Stats */}
              {stats?.kelasStats?.length > 0 && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">Statistik Per Kelas</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                            Kelas
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                            Jumlah Santri
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
                            Total Saldo
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {stats.kelasStats.map((k: any) => (
                          <tr key={k.kelas}>
                            <td className="px-6 py-4 font-medium text-foreground">{k.kelas}</td>
                            <td className="px-6 py-4 text-foreground">{k.jumlah_santri}</td>
                            <td className="px-6 py-4 text-foreground">
                              {formatRupiah(parseFloat(k.total_saldo))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "santri" && <SantriList />}
          {activeTab === "transaksi" && <TransaksiForm onSuccess={handleTransactionSuccess} />}
          {activeTab === "riwayat" && <TransaksiHistory />}
          {activeTab === "tambah-santri" && user?.role === "admin" && <SantriForm />}
        </div>
      </main>
    </div>
  )
}
