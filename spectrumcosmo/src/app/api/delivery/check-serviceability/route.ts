// app/api/delivery/check-serviceability/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface DeliveryArea {
  id: number;
  area_name: string;
  city: string;
  base_fee: number;
  express_multiplier: number;
  estimated_days_standard: string | null;
  estimated_days_express: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { location, deliveryMethodId } = body;

    console.log('Serviceability check:', { location, deliveryMethodId });

    if (!location || !deliveryMethodId) {
      return NextResponse.json(
        { error: 'Location and delivery method ID are required' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Get all active delivery areas
    const areas = await sql`
      SELECT id, area_name, city, base_fee, express_multiplier, 
             estimated_days_standard, estimated_days_express
      FROM delivery_areas
      WHERE is_active = true
      ORDER BY sort_order ASC NULLS LAST
    `;

    console.log('Delivery areas found:', areas.length);

    if (areas.length === 0) {
      return NextResponse.json({
        isServiceable: true,
        area: null,
        baseFee: 5000,
        estimatedDays: '2-3 days',
        message: 'Standard delivery available',
        requiresQuote: false,
      });
    }

    const cleanLocation = location.toLowerCase().trim();
    
    const matchedArea = areas.find((area: any) => {
      const areaName = (area.area_name || '').toLowerCase().trim();
      const city = (area.city || '').toLowerCase().trim();
      
      return cleanLocation.includes(areaName) || 
             cleanLocation.includes(city) ||
             areaName.includes(cleanLocation) ||
             city.includes(cleanLocation);
    });

    console.log('Matched area:', matchedArea?.area_name || 'None');

    let deliveryMethod = null;
    try {
      const [method] = await sql`
        SELECT name, type FROM delivery_methods WHERE id = ${deliveryMethodId}
      `;
      deliveryMethod = method;
    } catch (err) {
      console.log('Could not fetch delivery method, using default');
    }

    if (matchedArea) {
      const isExpress = deliveryMethod?.type === 'express' || deliveryMethodId === 2;
      
      return NextResponse.json({
        isServiceable: true,
        area: matchedArea,
        baseFee: matchedArea.base_fee,
        estimatedDays: isExpress 
          ? matchedArea.estimated_days_express || '1-2 days'
          : matchedArea.estimated_days_standard || '2-3 days',
        message: null,
        requiresQuote: false,
      });
    } else {
      return NextResponse.json({
        isServiceable: false,
        area: null,
        baseFee: null,
        estimatedDays: null,
        defaultFee: 10000,
        message: 'Your location is outside our standard delivery zones. Request a delivery quote.',
        requiresQuote: true,
      });
    }
  } catch (err) {
    console.error('Serviceability check error:', err);
    return NextResponse.json(
      { 
        error: 'Failed to check serviceability',
        message: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
