// app/api/payment-providers/route.ts
import { NextResponse } from 'next/server';
import { getDb, queryOne, queryAsArray } from '@/lib/db';

interface PaymentSettings {
  automatic_enabled: boolean;
  manual_enabled: boolean;
}

interface PaymentProvider {
  id: string;
  name: string;
  type: 'automatic' | 'manual';
  category: string;
  logo_url: string | null;
  account_name: string | null;
  account_number: string | null;
  branch: string | null;
  instructions: string | null;
}

export async function GET() {
  try {
    const sql = getDb();

    // Get global payment settings – use queryOne for single row
    const settings = await queryOne<PaymentSettings>`
      SELECT automatic_enabled, manual_enabled 
      FROM payment_settings 
      LIMIT 1
    `;

    const defaultSettings = { automatic_enabled: true, manual_enabled: true };
    const finalSettings = settings || defaultSettings;

    // Get enabled payment providers – use queryAsArray for multiple rows
    const providers = await queryAsArray<PaymentProvider>`
      SELECT 
        id, 
        name, 
        type, 
        category, 
        logo_url,
        account_name,
        account_number,
        branch,
        instructions
      FROM payment_providers
      WHERE is_enabled = true
      ORDER BY display_order ASC, id ASC
    `;

    // Split into automatic and manual based on settings
    const result = {
      automatic_enabled: finalSettings.automatic_enabled,
      manual_enabled: finalSettings.manual_enabled,
      automatic: [] as PaymentProvider[],
      manual: [] as PaymentProvider[],
    };

    for (const provider of providers) {
      if (provider.type === 'automatic' && finalSettings.automatic_enabled) {
        result.automatic.push(provider);
      } else if (provider.type === 'manual' && finalSettings.manual_enabled) {
        result.manual.push(provider);
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Payment providers error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
