import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { sendMail } from '@/lib/mailer'
import crypto from 'crypto'

async function ensureTables() {
  const sql = getDb()
  // Users table with email_verified
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      profile_image TEXT,
      email_verified BOOLEAN DEFAULT false,
      email_verified_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  // Email verifications table
  await sql`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
}

async function getRecentProducts(limit = 3) {
  const sql = getDb()
  try {
    const products = await sql`
      SELECT name, price, image, currency
      FROM products
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return products
  } catch (err) {
    console.error('Failed to fetch products for email:', err)
    return []
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, acceptedTerms } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'name, email, password required' }, { status: 400 })
    }
    if (!acceptedTerms) {
      return NextResponse.json({ error: 'You must agree to the Terms & Conditions and Privacy Policy' }, { status: 400 })
    }

    await ensureTables()
    const sql = getDb()

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const hash = await bcrypt.hash(password, 10)
    const [user] = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${hash})
      RETURNING id, name, email
    `

    // Insert into newsletter_subscriptions table
    await sql`
      INSERT INTO newsletter_subscriptions (email, user_id, is_subscribed, subscribed_at)
      VALUES (${email.toLowerCase()}, ${user.id}, true, NOW())
      ON CONFLICT (email) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        is_subscribed = true,
        updated_at = NOW()
    `

    // Generate email verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)
    await sql`
      INSERT INTO email_verifications (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt})
    `

    // Prepare verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`

    // Optional: still show recent products in a "while you wait" section
    const recentProducts = await getRecentProducts(3)
    const productsHtml = recentProducts.map(p => `
      <div style="flex: 1; min-width: 120px; text-align: center; background: #f9f9f9; padding: 12px; border-radius: 12px; margin: 4px;">
        <img src="${p.image || 'https://via.placeholder.com/100'}" style="width:80px; border-radius:8px;" alt="${p.name}" />
        <p style="font-size:12px; margin-top:6px;"><strong>${p.name}</strong></p>
        <p style="color:#F97316; font-size:12px;">${p.currency || 'MWK'} ${p.price}</p>
      </div>
    `).join('')

    const verificationHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 20px; overflow: hidden;">
        <div style="background: #F97316; padding: 24px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
        </div>
        <div style="padding: 24px; background: white;">
          <p style="font-size: 16px; color: #333;">Hi <strong>${name}</strong>,</p>
          <p style="font-size: 15px; line-height: 1.5; color: #555;">Thanks for joining SpectrumCosmo! Please confirm your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" style="background: #F97316; color: white; padding: 12px 28px; text-decoration: none; border-radius: 40px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="font-size: 13px; color: #777;">This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
          <hr style="margin: 30px 0 20px; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #999;">While you wait, check out what's new:</p>
          <div style="display: flex; flex-wrap: wrap; gap: 12px; margin: 16px 0 24px;">
            ${productsHtml || '<p style="color: #888;">Shop our latest arrivals now!</p>'}
          </div>
          <p style="font-size: 12px; color: #999;">Questions? Just reply to this email – we're here to help.<br/>SpectrumCosmo Team – Wear your excitement with pride.</p>
        </div>
      </div>
    `

    await sendMail({
      to: user.email,
      subject: 'Please verify your email – SpectrumCosmo',
      text: `Hi ${name}, please verify your email by clicking this link: ${verificationUrl}\n\nAfter verification you can log in and start shopping.`,
      html: verificationHtml,
    }).catch(err => console.error('Failed to send verification email:', err))

    // Return success without logging the user in
    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      needsVerification: true
    })
  } catch (err: any) {
    console.error('Registration error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
