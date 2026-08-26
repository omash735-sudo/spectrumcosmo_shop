import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();
    const [row] = await sql`SELECT content FROM page_contents WHERE page = 'privacy'`;
    const content = row?.content || {
      title: 'Privacy Policy',
      lastUpdated: '2026-05-09',
      htmlContent: `
        <h2>1. Introduction</h2>
        <p>SpectrumCosmo ("we", "us", "our") respects your privacy and is committed to protecting your personal data...</p>
      `
    };
    
    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching privacy content:', error);
    return NextResponse.json({
      title: 'Privacy Policy',
      lastUpdated: '2026-05-09',
      htmlContent: `
        <h2>1. Introduction</h2>
        <p>SpectrumCosmo ("we", "us", "our") respects your privacy and is committed to protecting your personal data...</p>
      `
    });
  }
}
