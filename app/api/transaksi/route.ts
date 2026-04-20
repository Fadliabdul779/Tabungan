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
    const santriId = searchParams.get("santri_id")
    const jenis = searchParams.get("jenis")
    const limit = parseInt(searchParams.get("limit") || "100")

    let transaksi
    if (santriId && jenis) {
      transaksi = await sql`
        SELECT t.*, s.nama as santri_nama, s.nis as santri_nis
        FROM transaksi t
        JOIN santri s ON t.santri_id = s.id
        WHERE t.santri_id = ${parseInt(santriId)} AND t.jenis = ${jenis}
        ORDER BY t.created_at DESC
        LIMIT ${limit}
      `
    } else if (santriId) {
      transaksi = await sql`
        SELECT t.*, s.nama as santri_nama, s.nis as santri_nis
        FROM transaksi t
        JOIN santri s ON t.santri_id = s.id
        WHERE t.santri_id = ${parseInt(santriId)}
        ORDER BY t.created_at DESC
        LIMIT ${limit}
      `
    } else if (jenis) {
      transaksi = await sql`
        SELECT t.*, s.nama as santri_nama, s.nis as santri_nis
        FROM transaksi t
        JOIN santri s ON t.santri_id = s.id
        WHERE t.jenis = ${jenis}
        ORDER BY t.created_at DESC
        LIMIT ${limit}
      `
    } else {
      transaksi = await sql`
        SELECT t.*, s.nama as santri_nama, s.nis as santri_nis
        FROM transaksi t
        JOIN santri s ON t.santri_id = s.id
        ORDER BY t.created_at DESC
        LIMIT ${limit}
      `
    }

    return NextResponse.json({ transaksi })
  } catch (error) {
    console.error("Get transaksi error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 })
    }

    const { santri_id, jenis, jumlah, keterangan } = await request.json()

    if (!santri_id || !jenis || !jumlah) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    if (jumlah <= 0) {
      return NextResponse.json({ error: "Jumlah harus lebih dari 0" }, { status: 400 })
    }

    const santriList = await sql`SELECT * FROM santri WHERE id = ${santri_id}`
    if (santriList.length === 0) {
      return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 })
    }

    const santri = santriList[0]
    let newSaldo = parseFloat(santri.saldo)

    if (jenis === "setoran") {
      newSaldo += jumlah
    } else if (jenis === "penarikan") {
      if (jumlah > parseFloat(santri.saldo)) {
        return NextResponse.json({ error: "Saldo tidak mencukupi" }, { status: 400 })
      }
      newSaldo -= jumlah
    } else {
      return NextResponse.json({ error: "Jenis transaksi tidak valid" }, { status: 400 })
    }

    const transaksi = await sql`
      INSERT INTO transaksi (santri_id, jenis, jumlah, saldo_sebelum, saldo_sesudah, keterangan, user_id)
      VALUES (${santri_id}, ${jenis}, ${jumlah}, ${santri.saldo}, ${newSaldo}, ${keterangan || ''}, ${user.id})
      RETURNING *
    `

    await sql`UPDATE santri SET saldo = ${newSaldo} WHERE id = ${santri_id}`

    return NextResponse.json({ 
      success: true, 
      transaksi: transaksi[0],
      saldo_baru: newSaldo
    })
  } catch (error) {
    console.error("Create transaksi error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
