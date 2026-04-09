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

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const kelas = searchParams.get("kelas") || ""

    let santriList
    if (search && kelas) {
      santriList = await sql`
        SELECT * FROM santri 
        WHERE (nama ILIKE ${'%' + search + '%'} OR nis ILIKE ${'%' + search + '%'})
        AND kelas = ${kelas}
        ORDER BY nama ASC
      `
    } else if (search) {
      santriList = await sql`
        SELECT * FROM santri 
        WHERE nama ILIKE ${'%' + search + '%'} OR nis ILIKE ${'%' + search + '%'}
        ORDER BY nama ASC
      `
    } else if (kelas) {
      santriList = await sql`
        SELECT * FROM santri 
        WHERE kelas = ${kelas}
        ORDER BY nama ASC
      `
    } else {
      santriList = await sql`SELECT * FROM santri ORDER BY nama ASC`
    }

    return NextResponse.json({ santri: santriList })
  } catch (error) {
    console.error("Get santri error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const { nis, nama, kelas, alamat, no_hp } = await request.json()

    if (!nis || !nama || !kelas) {
      return NextResponse.json({ error: "NIS, nama, dan kelas diperlukan" }, { status: 400 })
    }

    const existing = await sql`SELECT id FROM santri WHERE nis = ${nis}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "NIS sudah terdaftar" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO santri (nis, nama, kelas, alamat, no_hp, saldo)
      VALUES (${nis}, ${nama}, ${kelas}, ${alamat || ''}, ${no_hp || ''}, 0)
      RETURNING *
    `

    return NextResponse.json({ success: true, santri: result[0] })
  } catch (error) {
    console.error("Add santri error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
