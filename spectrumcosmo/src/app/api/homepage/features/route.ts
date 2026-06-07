// app/api/homepage/features/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray, queryOne } from '@/lib/db';

interface FeatureSettings {
  recentlyViewed: {
    enabled: boolean;
    maxItems: number;
    title: string;
    showClearButton: boolean;
  };
  continueShopping: {
    enabled: boolean;
    position: string;
    expiryDays: number;
    buttonText: string;
  };
}

const DEFAULT_SETTINGS: FeatureSettings = {
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
};

export async function GET() {
  try {
    const features = await queryAsArray<{ settings: FeatureSettings }>`
      SELECT settings FROM homepage_features WHERE id = 1
    `;

    if (features.length === 0) {
      return NextResponse.json(DEFAULT_SETTINGS);
    }

    return NextResponse.json(features[0].settings);
  } catch (err) {
    console.error('Failed to fetch homepage features:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings: FeatureSettings = await request.json();
    const sql = getDb();

    await sql`
      INSERT INTO homepage_features (id, settings, updated_at)
      VALUES (1, ${JSON.stringify(settings)}, NOW())
      ON CONFLICT (id) 
      DO UPDATE SET settings = EXCLUDED.settings, updated_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to save homepage features:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
