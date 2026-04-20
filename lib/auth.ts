import { cookies } from 'next/headers'
import { sql } from './db'

export interface User {
  id: number
  username: string
  nama: string
  role: string
}

export async function createSession(userId: number): Promise<string> {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  
  await sql`
    INSERT INTO sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
  `
  
  return token
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value
    
    if (!token) return null
    
    const result = await sql`
      SELECT u.id, u.username, u.nama, u.role
      FROM users u
      JOIN sessions s ON u.id = s.user_id
      WHERE s.token = ${token} AND s.expires_at > NOW()
    `
    
    if (result.length === 0) return null
    
    return result[0] as User
  } catch {
    return null
  }
}

export async function deleteSession(token: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE token = ${token}`
}
