import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { getDb } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function getUserFromRequest(req: NextRequest) {
  // Get token from cookies (assumes you set it as 'token' after login)
  const token = req.cookies.get('token')?.value
  
  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string }
    const db = getDb()
    const users = await db`
      SELECT email, name, id FROM users WHERE email = ${decoded.email}
    `
    return users[0] || null
  } catch {
    return null
  }
}
