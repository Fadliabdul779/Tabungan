import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      )
    }

    const result = await sql`
      SELECT u.id, u.username, u.nama, u.role
      FROM users u
      JOIN sessions s ON u.id = s.user_id
      WHERE s.token = ${token} AND s.expires_at > NOW()
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Sesi tidak valid" },
        { status: 401 }
      )
    }

    return NextResponse.json({ user: result[0] })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
