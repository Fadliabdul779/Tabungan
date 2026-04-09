import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 })
    }

    // Total santri
    const totalSantriResult = await sql`SELECT COUNT(*) as count FROM santri`
    const totalSantri = parseInt(totalSantriResult[0].count)

    // Total saldo
    const totalSaldoResult = await sql`SELECT COALESCE(SUM(saldo), 0) as total FROM santri`
    const totalSaldo = parseFloat(totalSaldoResult[0].total)

    // Today's transactions
    const todaySetoran = await sql`
      SELECT COALESCE(SUM(jumlah), 0) as total 
      FROM transaksi 
      WHERE jenis = 'setoran' AND DATE(created_at) = CURRENT_DATE
    `
    const todayPenarikan = await sql`
      SELECT COALESCE(SUM(jumlah), 0) as total 
      FROM transaksi 
      WHERE jenis = 'penarikan' AND DATE(created_at) = CURRENT_DATE
    `

    // Recent transactions
    const recentTransaksi = await sql`
      SELECT t.*, s.nama as santri_nama, s.nis as santri_nis
      FROM transaksi t
      JOIN santri s ON t.santri_id = s.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `

    // Kelas stats
    const kelasStats = await sql`
      SELECT kelas, COUNT(*) as jumlah_santri, COALESCE(SUM(saldo), 0) as total_saldo
      FROM santri
      GROUP BY kelas
      ORDER BY kelas
    `

    return NextResponse.json({
      totalSantri,
      totalSaldo,
      todaySetoran: parseFloat(todaySetoran[0].total),
      todayPenarikan: parseFloat(todayPenarikan[0].total),
      recentTransaksi,
      kelasStats
    })
  } catch (error) {
    console.error("Get stats error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
