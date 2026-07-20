// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, queryOne, queryAsArray } from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import crypto from 'crypto';

// Types
interface Product {
  name: string;
  price: number;
  image: string | null;
  currency: string;
}

interface RegistrationRequest {
  name: string;
  email: string;
  password: string;
  acceptedTerms: boolean;
}

async function ensureTables(): Promise<void> {
  const sql = getDb();
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
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

async function getRecentProducts(limit: number = 3): Promise<Product[]> {
  try {
    return await queryAsArray<Product>`
      SELECT name, price, image, currency
      FROM products
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
  } catch (err) {
    console.error('Failed to fetch products for email:', err);
    return [];
  }
}

function generateProductCards(products: Product[]): string {
  if (products.length === 0) {
    return '<p style="color: #888;">Shop our latest arrivals now!</p>';
  }
  return products.map((product: Product) => `
    <div style="flex: 1; min-width: 120px; text-align: center; background: #f9f9f9; padding: 12px; border-radius: 12px; margin: 4px;">
      <img src="${product.image || 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png'}" 
           style="width:80px; border-radius:8px;" 
           alt="${product.name}" />
      <p style="font-size:12px; margin-top:6px;"><strong>${product.name}</strong></p>
      <p style="color:#F97316; font-size:12px;">${product.currency || 'MWK'} ${product.price.toLocaleString()}</p>
    </div>
  `).join('');
}

async function sendVerificationEmail(email: string, name: string, token: string, products: Product[]): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spectrumcosmo.com';
  const verificationUrl = `${appUrl}/api/auth/verify-email?token=${token}`;
  const productsHtml = generateProductCards(products);
  const html = `
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
          ${productsHtml}
        </div>
        <p style="font-size: 12px; color: #999;">Questions? Just reply to this email – we're here to help.<br/>SpectrumCosmo Team – Wear your excitement with pride.</p>
      </div>
    </div>
  `;
  await sendMail({
    to: email,
    subject: 'Please verify your email – SpectrumCosmo',
    text: `Hi ${name}, please verify your email by clicking this link: ${verificationUrl}\n\nAfter verification you can log in and start shopping.`,
    html,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RegistrationRequest;
    const { name, email, password, acceptedTerms } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }
    if (!acceptedTerms) {
      return NextResponse.json({ error: 'You must agree to the Terms & Conditions and Privacy Policy' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    await ensureTables();
    const sql = getDb();

    // Check for existing user
    const existingUsers = await queryAsArray<{ id: string }>`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `;
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Create user
    const hash = await bcrypt.hash(password, 10);
    const newUser = await queryOne<{ id: string; name: string; email: string }>`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email.toLowerCase()}, ${hash})
      RETURNING id, name, email
    `;
    if (!newUser) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Subscribe to newsletter (non-blocking — won't crash registration if table is missing)
    try {
      await sql`
        INSERT INTO newsletter_subscriptions (email, user_id, is_subscribed, subscribed_at)
        VALUES (${email.toLowerCase()}, ${newUser.id}, true, NOW())
        ON CONFLICT (email) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          is_subscribed = true,
          updated_at = NOW()
      `;
    } catch (newsletterErr) {
      console.error('Newsletter subscription failed (non-fatal):', newsletterErr);
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    await sql`
      INSERT INTO email_verifications (user_id, token, expires_at)
      VALUES (${newUser.id}, ${token}, ${expiresAt})
    `;

    // Send verification email (fire and forget)
    const recentProducts = await getRecentProducts(3);
    sendVerificationEmail(newUser.email, newUser.name, token, recentProducts).catch(err => {
      console.error('Failed to send verification email:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      needsVerification: true,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('Registration error:', errorMessage);
    return NextResponse.json({ error: 'Failed to register. Please try again later.' }, { status: 500 });
  }
}
