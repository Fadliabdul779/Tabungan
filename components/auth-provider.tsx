"use client"

import { createContext, useContext, ReactNode } from "react"
import useSWR from "swr"

interface User {
  id: number
  username: string
  nama: string
  role: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  mutate: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Not authenticated")
    return res.json()
  })

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, error, isLoading, mutate } = useSWR("/api/auth/me", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || "Login gagal" }
      }

      await mutate()
      return { success: true }
    } catch (err) {
      return { success: false, error: "Terjadi kesalahan" }
    }
  }

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    await mutate(null, false)
  }

  return (
    <AuthContext.Provider
      value={{
        user: data?.user || null,
        isLoading,
        login,
        logout,
        mutate,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
