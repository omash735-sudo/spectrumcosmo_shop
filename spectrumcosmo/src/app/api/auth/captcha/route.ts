import { NextRequest, NextResponse } from 'next/server';

// Simple CAPTCHA store
const captchaStore = new Map<string, { answer: string; expires: number }>();

function generateCaptcha(ipAddress: string): { token: string; challenge: string } {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const answer = String(num1 + num2);
  const token = Buffer.from(`${ipAddress}:${Date.now()}:${Math.random()}`).toString('base64');
  
  captchaStore.set(token, {
    answer,
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes expiry
  });
  
  // Clean up expired CAPTCHAs
  setTimeout(() => captchaStore.delete(token), 5 * 60 * 1000);
  
  return {
    token,
    challenge: `What is ${num1} + ${num2}?`,
  };
}

export async function GET(req: NextRequest) {
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const { token, challenge } = generateCaptcha(ipAddress);
  return NextResponse.json({ token, challenge });
}
