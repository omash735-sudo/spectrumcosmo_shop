import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const sql = getDb()
    
    // Create the admins table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    // Check if the default admin already exists
    const existing = await sql`SELECT * FROM admins WHERE username = 'admin'`
    
    if (existing.length === 0) {
      // Hash the default password "SpectrumAdmin2024!"
      const hash = await bcrypt.hash('SpectrumAdmin2024!', 10)
      await sql`INSERT INTO admins (username, password_hash) VALUES ('admin', ${hash})`
      return NextResponse.json({ message: 'Table created and default admin user initialized! You can now log in.' })
    }

    return NextResponse.json({ message: 'Table exists and admin is already initialized.' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
