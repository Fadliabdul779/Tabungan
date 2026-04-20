"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Wallet, Shield, Clock, TrendingUp, Eye, EyeOff } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [showLogin, setShowLogin] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error)
        return
      }

      router.push("/dashboard")
    } catch {
      setError("Terjadi kesalahan server")
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: Shield,
      title: "Aman & Terpercaya",
      description: "Data tabungan tersimpan dengan sistem keamanan tinggi",
    },
    {
      icon: Clock,
      title: "Akses 24/7",
      description: "Pantau saldo dan riwayat transaksi kapan saja",
    },
    {
      icon: TrendingUp,
      title: "Laporan Lengkap",
      description: "Laporan keuangan terstruktur dan mudah dipahami",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">Tabungan Santri</h1>
              <p className="text-xs text-muted-foreground">PPM Zaenab Masykur</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogin(true)}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Masuk
          </button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            Sistem Tabungan Digital
            <span className="text-primary"> Modern</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty">
            Kelola tabungan santri dengan mudah, aman, dan transparan. 
            Pantau saldo dan riwayat transaksi secara real-time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowLogin(true)}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              Mulai Sekarang
            </button>
          </div>
        </div>

        <section id="features" className="mt-24 grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-8 bg-card rounded-2xl border border-border hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="container mx-auto px-4 py-8 border-t border-border mt-16">
        <p className="text-center text-muted-foreground text-sm">
          2024 Pondok Pesantren Modern Zaenab Masykur. Hak Cipta Dilindungi.
        </p>
      </footer>

      {showLogin && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border">
            <div className="p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center text-foreground mb-2">
                Selamat Datang
              </h2>
              <p className="text-center text-muted-foreground mb-8">
                Masuk ke akun Anda untuk melanjutkan
              </p>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Masukkan username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                      placeholder="Masukkan password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? "Memproses..." : "Masuk"}
                </button>
              </form>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  <strong>Demo:</strong> admin / admin123
                </p>
              </div>
            </div>
            <div className="px-8 py-4 bg-muted/50 border-t border-border rounded-b-2xl">
              <button
                onClick={() => setShowLogin(false)}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
