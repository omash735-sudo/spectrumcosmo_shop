import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { getVerifiedUser } from '@/lib/auth';

// GET published FAQs (public)
export async function GET() {
  try {
    const sql = getDb();
    const faqs = await sql`
      SELECT id, question, answer, created_at 
      FROM faqs 
      WHERE is_published = true AND is_answered = true
      ORDER BY created_at DESC
    `;
    return NextResponse.json(faqs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - user asks a question
export async function POST(req: NextRequest) {
  try {
    const { question, name, email } = await req.json();
    
    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const sql = getDb();
    const user = await getVerifiedUser(req);
    
    await sql`
      INSERT INTO faqs (question, asked_by_email, asked_by_name, is_published, is_answered)
      VALUES (${question}, ${email || user?.email || null}, ${name || user?.name || null}, false, false)
    `;

    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      await sendMail({
        to: adminEmail,
        subject: 'New FAQ Question',
        text: `New question from ${name || email || 'Anonymous'}: ${question}`,
      }).catch(() => null);
    }

    return NextResponse.json({ success: true, message: 'Question submitted. We will answer soon.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
