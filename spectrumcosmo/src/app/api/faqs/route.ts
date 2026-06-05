// app/api/faqs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { getVerifiedUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

// Types
interface FAQ {
  id: string;
  question: string;
  answer: string | null;
  created_at: Date;
}

interface FAQRequest {
  question: string;
  name?: string;
  email?: string;
}

interface VerifiedUser {
  id: string;
  name: string;
  email: string;
}

// Constants
const MAX_QUESTION_LENGTH = 1000;
const MIN_QUESTION_LENGTH = 10;

function validateQuestion(question: string): string | null {
  if (!question || question.trim().length === 0) {
    return 'Question is required';
  }
  if (question.length < MIN_QUESTION_LENGTH) {
    return `Question must be at least ${MIN_QUESTION_LENGTH} characters`;
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return `Question cannot exceed ${MAX_QUESTION_LENGTH} characters`;
  }
  return null;
}

function validateEmail(email: string | undefined): boolean {
  if (!email) return true; // Email is optional for guests
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export async function GET() {
  try {
    const sql = getDb();
    const faqs = await sql`
      SELECT id, question, answer, created_at 
      FROM faqs 
      WHERE is_published = true AND is_answered = true
      ORDER BY created_at DESC
    ` as FAQ[];
    
    return NextResponse.json(faqs);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('Failed to fetch FAQs:', errorMessage);
    return NextResponse.json({ error: 'Failed to load FAQs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
  
  const rateResult = await rateLimit(`faq:${ipAddress}`, 5, 3600);
  
  if (!rateResult.success) {
    return NextResponse.json({ 
      error: `Too many questions. Please try again in ${rateResult.retryAfterMinutes} minutes.` 
    }, { status: 429 });
  }
  
  try {
    const body = await req.json() as FAQRequest;
    let { question, name, email } = body;
    
    // Validate question
    const questionError = validateQuestion(question);
    if (questionError) {
      return NextResponse.json({ error: questionError }, { status: 400 });
    }
    
    // Validate email if provided
    if (email && !validateEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }
    
    // Sanitize inputs
    question = sanitizeInput(question);
    name = name ? sanitizeInput(name) : undefined;
    email = email ? email.toLowerCase().trim() : undefined;
    
    const sql = getDb();
    
    // Get authenticated user (handles the destructuring correctly)
    const authResult = await getVerifiedUser(req);
    const user = authResult.user as VerifiedUser | null;
    const authError = authResult.error;
    
    // Determine submitter info
    let submitterEmail = email || user?.email || null;
    let submitterName = name || user?.name || null;
    
    // If user is authenticated but didn't provide email, use their registered email
    if (user && !email) {
      submitterEmail = user.email;
      submitterName = user.name;
    }
    
    await sql`
      INSERT INTO faqs (question, asked_by_email, asked_by_name, is_published, is_answered)
      VALUES (${question}, ${submitterEmail}, ${submitterName}, false, false)
    `;
    
    // Notify admin (fire and forget)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spectrumcosmo.com';
    
    if (adminEmail) {
      const adminNotificationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
          <h2 style="color: #F97316; margin-bottom: 20px;">New FAQ Question</h2>
          <p><strong>From:</strong> ${submitterName || submitterEmail || 'Anonymous'}</p>
          <p><strong>Email:</strong> ${submitterEmail || 'Not provided'}</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="margin: 0; white-space: pre-wrap;">${question}</p>
          </div>
          <p style="margin-top: 20px;">
            <a href="${appUrl}/admin/faqs" style="background: #F97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View in Admin Panel</a>
          </p>
          <hr style="margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">SpectrumCosmo FAQ System</p>
        </div>
      `;
      
      sendMail({
        to: adminEmail,
        subject: `New FAQ Question from ${submitterName || submitterEmail || 'Anonymous'}`,
        text: `New question: ${question}\nFrom: ${submitterName || submitterEmail || 'Anonymous'}`,
        html: adminNotificationHtml,
      }).catch(err => {
        console.error('Failed to send admin notification:', err);
      });
    }
    
    // Send confirmation to user if email provided
    if (submitterEmail) {
      const confirmationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; text-align: center;">
          <h2 style="color: #F97316;">Thank You for Your Question</h2>
          <p>We've received your question and will respond within 24-48 hours.</p>
          <p style="color: #666; font-size: 14px;">Your question: "${question.substring(0, 100)}${question.length > 100 ? '...' : ''}"</p>
          <hr style="margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">SpectrumCosmo – Wear your excitement with pride.</p>
        </div>
      `;
      
      sendMail({
        to: submitterEmail,
        subject: 'We received your question – SpectrumCosmo',
        text: `Thank you for your question. We'll respond within 24-48 hours.\n\nYour question: ${question}`,
        html: confirmationHtml,
      }).catch(err => {
        console.error('Failed to send confirmation email:', err);
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Question submitted successfully. We will answer within 24-48 hours.' 
    });
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('FAQ submission error:', errorMessage);
    return NextResponse.json({ 
      error: 'Failed to submit question. Please try again later.' 
    }, { status: 500 });
  }
}
