// app/api/payment-providers/route.ts
import { NextRequest, NextResponse } from 'next/server';
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

interface ProviderWithRoutes {
  id: string;
  name: string;
  type: 'automatic' | 'manual';
  category: string;
  logo_url: string | null;
  account_name: string | null;
  account_number: string | null;
  branch: string | null;
  instructions: string | null;
  route_id: number;
  sending_country: string;
  sending_currency: string;
  receiving_country: string;
  receiving_currency: string;
  min_amount: number;
  max_amount: number | null;
  fee_percentage: number;
  fee_fixed: number;
  is_active: boolean;
  verification_status: string;
  display_order: number;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const country = searchParams.get('country');
    const currency = searchParams.get('currency');
    const amount = parseFloat(searchParams.get('amount') || '0');

    const sql = getDb();

    // Get global payment settings
    const settings = await queryOne<PaymentSettings>`
      SELECT automatic_enabled, manual_enabled 
      FROM payment_settings 
      LIMIT 1
    `;

    const defaultSettings = { automatic_enabled: true, manual_enabled: true };
    const finalSettings = settings || defaultSettings;

    // If country and currency are provided, filter by available routes
    if (country && currency && amount > 0) {
      // Get providers with verified routes for this country/currency
      const providersWithRoutes = await queryAsArray<ProviderWithRoutes>`
        SELECT 
          p.id,
          p.name,
          p.type,
          p.category,
          p.logo_url,
          p.account_name,
          p.account_number,
          p.branch,
          p.instructions,
          pr.id as route_id,
          pr.sending_country,
          pr.sending_currency,
          pr.receiving_country,
          pr.receiving_currency,
          pr.min_amount,
          pr.max_amount,
          pr.fee_percentage,
          pr.fee_fixed,
          pr.is_active,
          pr.verification_status,
          pr.display_order
        FROM payment_providers p
        INNER JOIN payment_routes pr ON pr.provider_id = p.id
        WHERE 
          p.is_enabled = true
          AND pr.sending_country = ${country}
          AND pr.sending_currency = ${currency}
          AND pr.receiving_country = 'MW'
          AND pr.receiving_currency = 'MWK'
          AND pr.is_active = true
          AND pr.verification_status = 'verified'
          AND (pr.min_amount <= ${amount} OR pr.min_amount = 0)
          AND (pr.max_amount >= ${amount} OR pr.max_amount IS NULL)
        ORDER BY pr.display_order ASC, p.display_order ASC
      `;

      // Group by provider
      const providerMap = new Map<string, PaymentProvider>();

      for (const row of providersWithRoutes) {
        if (!providerMap.has(row.id)) {
          providerMap.set(row.id, {
            id: row.id,
            name: row.name,
            type: row.type,
            category: row.category,
            logo_url: row.logo_url,
            account_name: row.account_name,
            account_number: row.account_number,
            branch: row.branch,
            instructions: row.instructions,
          });
        }
      }

      const providers = Array.from(providerMap.values());

      // Split into automatic and manual based on settings
      const result = {
        automatic_enabled: finalSettings.automatic_enabled,
        manual_enabled: finalSettings.manual_enabled,
        automatic: [] as PaymentProvider[],
        manual: [] as PaymentProvider[],
        country,
        currency,
        amount,
        has_routes: providers.length > 0,
        no_route_message: providers.length === 0 
          ? `No payment methods are currently available for customers in ${country} using ${currency}. Please contact us for alternative payment options.`
          : null,
      };

      for (const provider of providers) {
        if (provider.type === 'automatic' && finalSettings.automatic_enabled) {
          result.automatic.push(provider);
        } else if (provider.type === 'manual' && finalSettings.manual_enabled) {
          result.manual.push(provider);
        }
      }

      // If no providers with routes, return fallback manual providers if they exist
      if (providers.length === 0) {
        const fallbackProviders = await queryAsArray<PaymentProvider>`
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

        // Only include manual providers as fallback
        for (const provider of fallbackProviders) {
          if (provider.type === 'manual' && finalSettings.manual_enabled) {
            // Check if already added
            if (!result.manual.some(p => p.id === provider.id)) {
              result.manual.push(provider);
            }
          }
        }

        // Update message if we added fallback providers
        if (result.manual.length > 0) {
          result.no_route_message = `Automated payment routes are not available for ${country} with ${currency}. However, you can still pay using manual transfer methods below. Please note these may take longer to process.`;
        }
      }

      return NextResponse.json(result);
    }

    // Fallback: Return all enabled providers (no filtering)
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
