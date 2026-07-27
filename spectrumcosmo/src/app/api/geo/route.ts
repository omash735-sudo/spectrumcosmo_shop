// app/api/geo/route.ts
import { NextResponse } from 'next/server';
import { COUNTRY_CURRENCY_MAP, DEFAULT_CURRENCY } from '@/lib/currency';

export async function GET() {
  try {
    const ip = process.env.NODE_ENV === 'development'
      ? '154.160.6.242'
      : (await fetch('https://api.ipify.org?format=json').then(r => r.json())).ip;

    const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
    const geo = await geoRes.json();

    const countryInfo = COUNTRY_CURRENCY_MAP[geo.country_code];

    return NextResponse.json({
      country_code: geo.country_code || 'MW',
      country_name: geo.country_name || 'Malawi',
      currency: countryInfo?.currency || DEFAULT_CURRENCY,
      detected: true,
    });
  } catch (error) {
    console.error('Geo detection failed:', error);
    return NextResponse.json({
      country_code: 'MW',
      country_name: 'Malawi',
      currency: DEFAULT_CURRENCY,
      detected: false,
    });
  }
}
