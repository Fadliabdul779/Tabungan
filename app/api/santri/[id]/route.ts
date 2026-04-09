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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 })
    }

    const { id } = await params
    const santriId = parseInt(id)

    const santriList = await sql`SELECT * FROM santri WHERE id = ${santriId}`
    if (santriList.length === 0) {
      return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 })
    }

    const transaksi = await sql`
      SELECT * FROM transaksi 
      WHERE santri_id = ${santriId} 
      ORDER BY created_at DESC 
      LIMIT 50
    `

    return NextResponse.json({ 
      santri: santriList[0],
      transaksi 
    })
  } catch (error) {
    console.error("Get santri detail error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const { id } = await params
    const santriId = parseInt(id)
    const { nama, kelas, alamat, no_hp } = await request.json()

    const result = await sql`
      UPDATE santri 
      SET nama = ${nama}, kelas = ${kelas}, alamat = ${alamat || ''}, no_hp = ${no_hp || ''}
      WHERE id = ${santriId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ success: true, santri: result[0] })
  } catch (error) {
    console.error("Update santri error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const { id } = await params
    const santriId = parseInt(id)

    await sql`DELETE FROM transaksi WHERE santri_id = ${santriId}`
    await sql`DELETE FROM santri WHERE id = ${santriId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete santri error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
