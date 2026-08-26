import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();
    const [row] = await sql`SELECT content FROM page_contents WHERE page = 'terms'`;
    const content = row?.content || {
      title: 'Terms & Conditions',
      lastUpdated: '2026-05-09',
      htmlContent: `
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using SpectrumCosmo ("we", "us", "our"), you agree to be bound by these Terms of Service...</p>
      `
    };
    
    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching terms content:', error);
    return NextResponse.json({
      title: 'Terms & Conditions',
      lastUpdated: '2026-05-09',
      htmlContent: `
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using SpectrumCosmo ("we", "us", "our"), you agree to be bound by these Terms of Service...</p>
      `
    });
  }
}
