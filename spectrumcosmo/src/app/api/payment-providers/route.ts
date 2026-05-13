import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();

    // Get global payment settings
    const settingsResult = await sql`
      SELECT automatic_enabled, manual_enabled 
      FROM payment_settings 
      LIMIT 1
    `;
    
    const settings = settingsResult[0] || { automatic_enabled: true, manual_enabled: true };

    // Get enabled payment providers
    let providers = await sql`
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
    const result: {
      automatic_enabled: boolean;
      manual_enabled: boolean;
      automatic: any[];
      manual: any[];
    } = {
      automatic_enabled: settings.automatic_enabled,
      manual_enabled: settings.manual_enabled,
      automatic: [],
      manual: [],
    };

    for (const provider of providers) {
      if (provider.type === 'automatic' && settings.automatic_enabled) {
        result.automatic.push(provider);
      } else if (provider.type === 'manual' && settings.manual_enabled) {
        result.manual.push(provider);
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Payment providers error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
