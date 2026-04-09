import { cookies } from 'next/headers'
import sql from './db'
import bcrypt from 'bcryptjs'

export interface User {
  id: number
  username: string
  nama: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  
  await sql`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (${sessionId}, ${userId}, ${expiresAt.toISOString()})
  `
  
  const cookieStore = await cookies()
  cookieStore.set('session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/'
  })
  
  return sessionId
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session')?.value
  
  if (!sessionId) return null
  
  const result = await sql`
    SELECT u.id, u.username, u.nama, u.role
    FROM users u
    JOIN sessions s ON u.id = s.user_id
    WHERE s.id = ${sessionId} AND s.expires_at > NOW()
  `
  
  if (result.length === 0) return null
  
  return result[0] as User
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session')?.value
  
  if (sessionId) {
    await sql`DELETE FROM sessions WHERE id = ${sessionId}`
    cookieStore.delete('session')
  }
}

export async function login(username: string, password: string): Promise<User | null> {
  const result = await sql`
    SELECT id, username, nama, role, password
    FROM users
    WHERE username = ${username}
  `
  
  if (result.length === 0) return null
  
  const user = result[0]
  const isValid = await verifyPassword(password, user.password)
  
  if (!isValid) return null
  
  await createSession(user.id)
  
  return {
    id: user.id,
    username: user.username,
    nama: user.nama,
    role: user.role
  }
}
