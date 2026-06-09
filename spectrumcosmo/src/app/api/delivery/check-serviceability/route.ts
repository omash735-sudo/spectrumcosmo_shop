import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray, queryOne } from '@/lib/db';

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
    const { location, deliveryMethodId } = await req.json();

    if (!location || !deliveryMethodId) {
      return NextResponse.json(
        { error: 'Location and delivery method ID are required' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Get all delivery areas
    const areas = await queryAsArray<DeliveryArea>`
      SELECT id, area_name, city, base_fee, express_multiplier, 
             estimated_days_standard, estimated_days_express
      FROM delivery_areas
      WHERE is_active = true
      ORDER BY sort_order ASC
    `;

    // Find matching area based on location string
    const matchedArea = areas.find(area => 
      location.toLowerCase().includes(area.area_name.toLowerCase()) ||
      location.toLowerCase().includes(area.city.toLowerCase())
    );

    // Get delivery method details
    const deliveryMethod = await queryOne<{ name: string; type: string }>`
      SELECT name, type FROM delivery_methods WHERE id = ${deliveryMethodId}
    `;

    const isServiceable = !!matchedArea;
    const defaultOutOfAreaFee = 10000; // Will fetch from settings

    if (isServiceable) {
      // Serviceable - return area details
      return NextResponse.json({
        isServiceable: true,
        area: matchedArea,
        baseFee: matchedArea.base_fee,
        estimatedDays: deliveryMethod?.type === 'express' 
          ? matchedArea.estimated_days_express 
          : matchedArea.estimated_days_standard,
        message: null,
      });
    } else {
      // Not serviceable - needs quote
      return NextResponse.json({
        isServiceable: false,
        area: null,
        baseFee: null,
        estimatedDays: null,
        defaultFee: defaultOutOfAreaFee,
        message: 'Your location is outside our standard delivery zones. You will only pay for products now. Our team will contact you with a delivery fee quote.',
        requiresQuote: true,
      });
    }
  } catch (err) {
    console.error('Serviceability check error:', err);
    return NextResponse.json(
      { error: 'Failed to check serviceability' },
      { status: 500 }
    );
  }
}
