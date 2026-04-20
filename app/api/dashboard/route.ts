import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

async function getCurrentUser(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value
  if (!token) return null

  const result = await sql`
    SELECT u.id, u.username, u.nama, u.role
    FROM users u
    JOIN sessions s ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > NOW()
  `
  return result.length > 0 ? result[0] : null
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 })
    }

    // Total santri
    const totalSantriResult = await sql`SELECT COUNT(*) as count FROM santri`
    const totalSantri = parseInt(totalSantriResult[0].count)

    // Total saldo
    const totalSaldoResult = await sql`SELECT COALESCE(SUM(saldo), 0) as total FROM santri`
    const totalSaldo = parseFloat(totalSaldoResult[0].total)

    // Total setoran
    const totalSetoranResult = await sql`
      SELECT COALESCE(SUM(jumlah), 0) as total FROM transaksi WHERE jenis = 'setoran'
    `
    const totalSetoran = parseFloat(totalSetoranResult[0].total)

    // Total penarikan
    const totalPenarikanResult = await sql`
      SELECT COALESCE(SUM(jumlah), 0) as total FROM transaksi WHERE jenis = 'penarikan'
    `
    const totalPenarikan = parseFloat(totalPenarikanResult[0].total)

    // Transaksi hari ini
    const transaksiHariIniResult = await sql`
      SELECT COUNT(*) as count FROM transaksi WHERE DATE(created_at) = CURRENT_DATE
    `
    const transaksiHariIni = parseInt(transaksiHariIniResult[0].count)

    // Recent transactions
    const recentTransactions = await sql`
      SELECT t.id, t.jenis, t.jumlah, t.created_at, t.keterangan,
             s.nama as santri_nama, s.nis as santri_nis,
             u.nama as user_nama
      FROM transaksi t
      JOIN santri s ON t.santri_id = s.id
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `

    // Top savers
    const topSavers = await sql`
      SELECT id, nama, nis, saldo
      FROM santri
      ORDER BY saldo DESC
      LIMIT 5
    `

    return NextResponse.json({
      stats: {
        totalSantri,
        totalSaldo,
        totalSetoran,
        totalPenarikan,
        transaksiHariIni,
      },
      recentTransactions,
      topSavers,
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
