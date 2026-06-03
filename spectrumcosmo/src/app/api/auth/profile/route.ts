import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getVerifiedUser } from '@/lib/auth'
import { sendMail } from '@/lib/mailer'

async function ensureUsersTable() {
  const sql = getDb()
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
  `
}

async function getRecentProducts(limit = 4) {
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

export async function PATCH(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req)
  if (error) return error

  try {
    await ensureUsersTable()
    const body = await req.json()
    const { name, phone, newsletterSubscribed, profileImage } = body
    
    console.log('Received update request:', { name, phone, profileImage }) // Debug log
    
    const sql = getDb()

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`)
      values.push(name)
      paramIndex++
    }
    
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex}`)
      values.push(phone)
      paramIndex++
    }
    
    if (profileImage !== undefined) {
      updates.push(`profile_image = $${paramIndex}`)
      values.push(profileImage)
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    values.push(user.id)
    
    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING id, name, email, phone, profile_image AS "profileImage"
    `
    
    const result = await sql.query(query, values)
    const updated = result[0] || result.rows?.[0]

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Handle newsletter subscription if provided
    if (newsletterSubscribed !== undefined) {
      const normalizedEmail = updated.email.toLowerCase()
      const [current] = await sql`
        SELECT is_subscribed FROM newsletter_subscriptions
        WHERE email = ${normalizedEmail}
      `
      const wasSubscribed = current?.is_subscribed === true

      await sql`
        INSERT INTO newsletter_subscriptions (email, user_id, is_subscribed, subscribed_at)
        VALUES (${normalizedEmail}, ${user.id}, ${newsletterSubscribed}, NOW())
        ON CONFLICT (email) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          is_subscribed = EXCLUDED.is_subscribed,
          updated_at = NOW()
      `

      if (newsletterSubscribed === true && !wasSubscribed) {
        const recentProducts = await getRecentProducts(4)
        const productsHtml = recentProducts.map(p => `
          <div style="flex: 1; min-width: 120px; text-align: center; background: #f9f9f9; padding: 12px; border-radius: 12px; margin: 4px;">
            <img src="${p.image || 'https://via.placeholder.com/100'}" style="width:80px; border-radius:8px;" alt="${p.name}" />
            <p style="font-size:12px; margin-top:6px;"><strong>${p.name}</strong></p>
            <p style="color:#F97316; font-size:12px;">${p.currency || 'MWK'} ${p.price}</p>
          </div>
        `).join('')
        
        const reSubscribeHtml = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 20px; overflow: hidden;">
            <div style="background: #F97316; padding: 20px; text-align: center;">
              <h2 style="color: white; margin: 0;">You're back! 🎉</h2>
            </div>
            <div style="padding: 24px; background: white;">
              <p style="font-size: 16px;">Hi <strong>${updated.name || 'there'}</strong>,</p>
              <p>Great to have you subscribed again. Here are some of the latest items we've dropped – you might love them:</p>
              <div style="display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0;">
                ${productsHtml || '<p>Check out our new arrivals →</p>'}
              </div>
              <div style="text-align: center; margin: 30px 0 20px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://spectrumcosmo.com'}/products" 
                   style="background: #F97316; color: white; padding: 10px 24px; border-radius: 40px; text-decoration: none; font-weight: bold;">
                  Shop new arrivals →
                </a>
              </div>
              <p style="font-size: 12px; color: #888;">We'll only send you the good stuff – updates on products and offers. Unsubscribe anytime.</p>
              <hr style="margin: 20px 0;" />
              <p style="font-size: 12px;">SpectrumCosmo – Wear your excitement with pride.</p>
            </div>
          </div>
        `
        
        await sendMail({
          to: updated.email,
          subject: 'We missed you! Here’s what’s new at SpectrumCosmo',
          text: `Hi ${updated.name}, welcome back to our newsletter. Check out our latest products at ${process.env.NEXT_PUBLIC_APP_URL}/products`,
          html: reSubscribeHtml,
        }).catch(err => console.error('Re-subscription email failed:', err))
      }

      if (newsletterSubscribed === false && wasSubscribed) {
        await sendMail({
          to: updated.email,
          subject: 'You’ve unsubscribed from SpectrumCosmo newsletters',
          text: "We're sorry to see you go. If this was a mistake, you can resubscribe anytime from your account settings. Let us know why you left – we appreciate feedback.",
        }).catch(() => null)
      }
    }

    return NextResponse.json({ user: updated })
  } catch (err: any) {
    console.error('Profile update error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req)
  if (error) return error

  try {
    const sql = getDb()
    const [userData] = await sql`
      SELECT id, name, email, phone, profile_image AS "profileImage"
      FROM users
      WHERE id = ${user.id}
    `
    
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({ user: userData })
  } catch (err: any) {
    console.error('Error fetching user:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
