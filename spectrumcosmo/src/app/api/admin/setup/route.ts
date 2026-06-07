// app/api/admin/setup/route.ts
import { NextResponse } from 'next/server';
import { getDb, queryAsArray, queryMany } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const sql = getDb();

    // 1. Create admins table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 2. Check if default admin already exists – use queryAsArray to get a real array
    const existingAdmins = await queryAsArray<{ id: string }>`
      SELECT id FROM admins WHERE username = 'admin'
    `;

    if (existingAdmins.length === 0) {
      // Hash the default password
      const hash = await bcrypt.hash('SpectrumAdmin2024!', 10);
      await sql`
        INSERT INTO admins (username, password_hash)
        VALUES ('admin', ${hash})
      `;
      return NextResponse.json({
        message: 'Table created and default admin user initialized! You can now log in.',
      });
    }

    return NextResponse.json({
      message: 'Table exists and admin is already initialized.',
    });
  } catch (err) {
    console.error('Admin setup error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
