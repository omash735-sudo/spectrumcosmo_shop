// app/api/auth/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

// Types
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
}

interface Product {
  name: string;
  price: number;
  image: string | null;
  currency: string;
}

interface UpdateProfileBody {
  name?: string;
  phone?: string;
  newsletterSubscribed?: boolean;
  profileImage?: string;
}

async function ensureUsersTable(): Promise<void> {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      profile_image TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
}

async function getRecentProducts(limit: number = 4): Promise<Product[]> {
  const sql = getDb();
  try {
    const products = await sql`
      SELECT name, price, image, currency
      FROM products
      ORDER BY created_at DESC
      LIMIT ${limit}
    ` as Product[];
    return products;
  } catch (err) {
    console.error('Failed to fetch products for email:', err);
    return [];
  }
}

function generateProductCards(products: Product[]): string {
  if (products.length === 0) {
    return '<p>Check out our new arrivals on our website!</p>';
  }
  
  return products.map((product) => `
    <div style="flex: 1; min-width: 120px; text-align: center; background: #f9f9f9; padding: 12px; border-radius: 12px; margin: 4px;">
      <img src="${product.image || 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png'}" 
           style="width:80px; border-radius:8px;" 
           alt="${product.name}" />
      <p style="font-size:12px; margin-top:6px;"><strong>${product.name}</strong></p>
      <p style="color:#F97316; font-size:12px;">${product.currency || 'MWK'} ${product.price.toLocaleString()}</p>
    </div>
  `).join('');
}

async function sendWelcomeBackEmail(email: string, name: string | null, products: Product[]): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spectrumcosmo.com';
  const productsHtml = generateProductCards(products);
  
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 20px; overflow: hidden;">
      <div style="background: #F97316; padding: 20px; text-align: center;">
        <h2 style="color: white; margin: 0;">You're back!</h2>
      </div>
      <div style="padding: 24px; background: white;">
        <p style="font-size: 16px;">Hi <strong>${name || 'there'}</strong>,</p>
        <p>Great to have you subscribed again. Here are some of the latest items we've dropped:</p>
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0;">
          ${productsHtml}
        </div>
        <div style="text-align: center; margin: 30px 0 20px;">
          <a href="${appUrl}/products" 
             style="background: #F97316; color: white; padding: 10px 24px; border-radius: 40px; text-decoration: none; font-weight: bold;">
            Shop new arrivals →
          </a>
        </div>
        <p style="font-size: 12px; color: #888;">We'll only send you updates on products and offers. Unsubscribe anytime.</p>
        <hr style="margin: 20px 0;" />
        <p style="font-size: 12px;">SpectrumCosmo – Wear your excitement with pride.</p>
      </div>
    </div>
  `;
  
  await sendMail({
    to: email,
    subject: 'We missed you! Here\'s what\'s new at SpectrumCosmo',
    text: `Hi ${name || 'there'}, welcome back to our newsletter. Check out our latest products at ${appUrl}/products`,
    html,
  });
}

async function sendUnsubscribeEmail(email: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spectrumcosmo.com';
  
  await sendMail({
    to: email,
    subject: 'You\'ve unsubscribed from SpectrumCosmo newsletters',
    text: `We're sorry to see you go. If this was a mistake, you can resubscribe anytime from your account settings at ${appUrl}/account/settings.`,
  });
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    await ensureUsersTable();
    const body = await req.json() as UpdateProfileBody;
    const { name, phone, newsletterSubscribed, profileImage } = body;
    
    const sql = getDb();

    // Build update query safely using template literals
    const updates: string[] = [];
    const values: (string | null)[] = [];
    
    if (name !== undefined) {
      updates.push(`name = ${sql.param(name)}`);
    }
    
    if (phone !== undefined) {
      updates.push(`phone = ${sql.param(phone)}`);
    }
    
    if (profileImage !== undefined) {
      updates.push(`profile_image = ${sql.param(profileImage)}`);
    }

    if (updates.length === 0 && newsletterSubscribed === undefined) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    let updated: UserProfile | null = null;

    if (updates.length > 0) {
      const result = await sql`
        UPDATE users 
        SET ${sql.unsafe(updates.join(', '))}
        WHERE id = ${user.id}
        RETURNING id, name, email, phone, profile_image AS "profileImage"
      `;
      updated = result[0] as UserProfile | undefined || null;
    } else {
      const [existing] = await sql`
        SELECT id, name, email, phone, profile_image AS "profileImage"
        FROM users
        WHERE id = ${user.id}
      `;
      updated = existing as UserProfile | undefined || null;
    }

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle newsletter subscription
    if (newsletterSubscribed !== undefined) {
      const normalizedEmail = updated.email.toLowerCase();
      const [current] = await sql`
        SELECT is_subscribed FROM newsletter_subscriptions
        WHERE email = ${normalizedEmail}
      `;
      const wasSubscribed = current?.is_subscribed === true;

      await sql`
        INSERT INTO newsletter_subscriptions (email, user_id, is_subscribed, subscribed_at)
        VALUES (${normalizedEmail}, ${user.id}, ${newsletterSubscribed}, NOW())
        ON CONFLICT (email) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          is_subscribed = EXCLUDED.is_subscribed,
          updated_at = NOW()
      `;

      // Send email notifications (fire and forget - don't block response)
      if (newsletterSubscribed === true && !wasSubscribed) {
        const recentProducts = await getRecentProducts(4);
        sendWelcomeBackEmail(updated.email, updated.name, recentProducts).catch(err => {
          console.error('Welcome back email failed:', err);
        });
      } else if (newsletterSubscribed === false && wasSubscribed) {
        sendUnsubscribeEmail(updated.email).catch(err => {
          console.error('Unsubscribe email failed:', err);
        });
      }
    }

    return NextResponse.json({ user: updated });
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('Profile update error:', errorMessage);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    const sql = getDb();
    const [userData] = await sql`
      SELECT id, name, email, phone, profile_image AS "profileImage"
      FROM users
      WHERE id = ${user.id}
    `;
    
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ user: userData });
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('Error fetching user:', errorMessage);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}
