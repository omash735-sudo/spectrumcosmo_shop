import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET: Fetch feature settings
export async function GET() {
  try {
    const sql = getDb();
    let features = await sql`
      SELECT * FROM homepage_features WHERE id = 1
    `;
    
    if (!features || features.length === 0) {
      // Return defaults if not found
      return NextResponse.json({
        recentlyViewed: {
          enabled: true,
          maxItems: 6,
          title: 'Recently Viewed',
          showClearButton: true,
        },
        continueShopping: {
          enabled: true,
          position: 'bottom-right',
          expiryDays: 7,
          buttonText: 'Continue',
        },
      });
    }
    
    return NextResponse.json(features[0].settings);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 });
  }
}

// POST: Save feature settings
export async function POST(request: NextRequest) {
  try {
    const settings = await request.json();
    const sql = getDb();
    
    await sql`
      INSERT INTO homepage_features (id, settings, updated_at)
      VALUES (1, ${JSON.stringify(settings)}, NOW())
      ON CONFLICT (id) 
      DO UPDATE SET settings = ${JSON.stringify(settings)}, updated_at = NOW()
    `;
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to save features' }, { status: 500 });
  }
}
