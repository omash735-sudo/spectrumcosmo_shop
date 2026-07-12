import { NextResponse } from 'next/server';
import { generateCsrfToken, setCsrfToken } from '@/lib/csrf';

export async function GET() {
  const token = generateCsrfToken();
  const response = NextResponse.json({ token });
  setCsrfToken(response);
  return response;
}
