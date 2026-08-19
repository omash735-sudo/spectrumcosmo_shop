import { getDb, queryAsArray, queryOne } from './db';

export interface PaymentRoute {
  id: number;
  provider_id: number;
  provider_name: string;
  provider_type: string;
  provider_category: string;
  sending_country: string;
  sending_currency: string;
  receiving_country: string;
  receiving_currency: string;
  min_amount: number;
  max_amount: number | null;
  fee_percentage: number;
  fee_fixed: number;
  is_active: boolean;
  requires_quote: boolean;
  verification_status: 'unverified' | 'verified' | 'failed';
  provider_config: Record<string, any>;
  display_order: number;
}

export interface AvailableRoute {
  route: PaymentRoute;
  estimated_fee: number;
  estimated_total: number;
  fee_breakdown: {
    percentage: number;
    fixed: number;
    total: number;
  };
  availability_message?: string;
}

export interface PaymentProviderWithRoutes {
  id: number;
  name: string;
  type: string;
  category: string;
  is_enabled: boolean;
  logo_url: string | null;
  account_name: string | null;
  account_number: string | null;
  branch: string | null;
  instructions: string | null;
  routes: PaymentRoute[];
}

export class PaymentRouter {
  /**
   * Get all available payment routes for a customer
   */
  async getAvailableRoutes(params: {
    country: string;
    currency: string;
    amount: number;
  }): Promise<{
    routes: AvailableRoute[];
    noRouteMessage?: string;
  }> {
    const routes = await queryAsArray<PaymentRoute>`
      SELECT 
        pr.*,
        p.name as provider_name,
        p.type as provider_type,
        p.category as provider_category
      FROM payment_routes pr
      JOIN payment_providers p ON p.id = pr.provider_id
      WHERE 
        pr.sending_country = ${params.country}
        AND pr.sending_currency = ${params.currency}
        AND pr.receiving_country = 'MW'
        AND pr.receiving_currency = 'MWK'
        AND pr.is_active = true
        AND pr.verification_status = 'verified'
        AND (pr.min_amount <= ${params.amount} OR pr.min_amount = 0)
        AND (pr.max_amount >= ${params.amount} OR pr.max_amount IS NULL)
        AND p.is_enabled = true
      ORDER BY pr.display_order ASC, pr.fee_percentage ASC
    `;

    if (routes.length === 0) {
      return {
        routes: [],
        noRouteMessage: `No automated payment route is currently available for customers in ${params.country} using ${params.currency}. Please contact us for alternative payment options.`
      };
    }

    const availableRoutes: AvailableRoute[] = routes.map(route => {
      const feePercentage = (params.amount * route.fee_percentage) / 100;
      const feeFixed = route.fee_fixed || 0;
      const totalFee = feePercentage + feeFixed;
      const estimatedTotal = params.amount + totalFee;

      return {
        route,
        estimated_fee: totalFee,
        estimated_total: estimatedTotal,
        fee_breakdown: {
          percentage: feePercentage,
          fixed: feeFixed,
          total: totalFee
        }
      };
    });

    return { routes: availableRoutes };
  }

  /**
   * Get providers with their routes for a customer
   */
  async getProvidersWithRoutes(params: {
    country: string;
    currency: string;
    amount: number;
  }): Promise<PaymentProviderWithRoutes[]> {
    const results = await queryAsArray<{
      id: number;
      name: string;
      type: string;
      category: string;
      is_enabled: boolean;
      logo_url: string | null;
      account_name: string | null;
      account_number: string | null;
      branch: string | null;
      instructions: string | null;
      route_id: number;
      route_provider_id: number;
      sending_country: string;
      sending_currency: string;
      receiving_country: string;
      receiving_currency: string;
      min_amount: number;
      max_amount: number | null;
      fee_percentage: number;
      fee_fixed: number;
      is_active: boolean;
      requires_quote: boolean;
      verification_status: string;
      provider_config: any;
      display_order: number;
    }>`
      SELECT 
        p.id,
        p.name,
        p.type,
        p.category,
        p.is_enabled,
        p.logo_url,
        p.account_name,
        p.account_number,
        p.branch,
        p.instructions,
        pr.id as route_id,
        pr.provider_id as route_provider_id,
        pr.sending_country,
        pr.sending_currency,
        pr.receiving_country,
        pr.receiving_currency,
        pr.min_amount,
        pr.max_amount,
        pr.fee_percentage,
        pr.fee_fixed,
        pr.is_active,
        pr.requires_quote,
        pr.verification_status,
        pr.provider_config,
        pr.display_order
      FROM payment_providers p
      JOIN payment_routes pr ON pr.provider_id = p.id
      WHERE 
        pr.sending_country = ${params.country}
        AND pr.sending_currency = ${params.currency}
        AND pr.receiving_country = 'MW'
        AND pr.receiving_currency = 'MWK'
        AND pr.is_active = true
        AND pr.verification_status = 'verified'
        AND (pr.min_amount <= ${params.amount} OR pr.min_amount = 0)
        AND (pr.max_amount >= ${params.amount} OR pr.max_amount IS NULL)
        AND p.is_enabled = true
      ORDER BY pr.display_order ASC, pr.fee_percentage ASC
    `;

    // Group by provider
    const providerMap = new Map<number, PaymentProviderWithRoutes>();

    for (const row of results) {
      if (!providerMap.has(row.id)) {
        providerMap.set(row.id, {
          id: row.id,
          name: row.name,
          type: row.type,
          category: row.category,
          is_enabled: row.is_enabled,
          logo_url: row.logo_url,
          account_name: row.account_name,
          account_number: row.account_number,
          branch: row.branch,
          instructions: row.instructions,
          routes: []
        });
      }

      const provider = providerMap.get(row.id)!;
      provider.routes.push({
        id: row.route_id,
        provider_id: row.route_provider_id,
        provider_name: row.name,
        provider_type: row.type,
        provider_category: row.category,
        sending_country: row.sending_country,
        sending_currency: row.sending_currency,
        receiving_country: row.receiving_country,
        receiving_currency: row.receiving_currency,
        min_amount: row.min_amount,
        max_amount: row.max_amount,
        fee_percentage: row.fee_percentage,
        fee_fixed: row.fee_fixed,
        is_active: row.is_active,
        requires_quote: row.requires_quote,
        verification_status: row.verification_status as any,
        provider_config: row.provider_config,
        display_order: row.display_order
      });
    }

    return Array.from(providerMap.values());
  }

  /**
   * Check if a specific provider has a route for a country/currency
   */
  async getRouteForProvider(params: {
    providerId: number;
    country: string;
    currency: string;
    amount: number;
  }): Promise<PaymentRoute | null> {
    const route = await queryOne<PaymentRoute>`
      SELECT 
        pr.*,
        p.name as provider_name,
        p.type as provider_type,
        p.category as provider_category
      FROM payment_routes pr
      JOIN payment_providers p ON p.id = pr.provider_id
      WHERE 
        pr.provider_id = ${params.providerId}
        AND pr.sending_country = ${params.country}
        AND pr.sending_currency = ${params.currency}
        AND pr.receiving_country = 'MW'
        AND pr.receiving_currency = 'MWK'
        AND pr.is_active = true
        AND pr.verification_status = 'verified'
        AND (pr.min_amount <= ${params.amount} OR pr.min_amount = 0)
        AND (pr.max_amount >= ${params.amount} OR pr.max_amount IS NULL)
    `;

    return route || null;
  }

  /**
   * Update a payment route
   */
  async updateRoute(params: {
    routeId: number;
    is_active?: boolean;
    verification_status?: string;
    fee_percentage?: number;
    fee_fixed?: number;
    min_amount?: number;
    max_amount?: number;
    provider_config?: Record<string, any>;
  }): Promise<boolean> {
    const sql = getDb();
    
    const updates: string[] = [];
    
    if (params.is_active !== undefined) {
      updates.push(`is_active = ${params.is_active}`);
    }
    if (params.verification_status !== undefined) {
      updates.push(`verification_status = '${params.verification_status}'`);
    }
    if (params.fee_percentage !== undefined) {
      updates.push(`fee_percentage = ${params.fee_percentage}`);
    }
    if (params.fee_fixed !== undefined) {
      updates.push(`fee_fixed = ${params.fee_fixed}`);
    }
    if (params.min_amount !== undefined) {
      updates.push(`min_amount = ${params.min_amount}`);
    }
    if (params.max_amount !== undefined) {
      updates.push(`max_amount = ${params.max_amount}`);
    }
    if (params.provider_config !== undefined) {
      updates.push(`provider_config = '${JSON.stringify(params.provider_config)}'::jsonb`);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 0) {
      return false;
    }

    // Build the complete SQL query string
    const queryString = `
      UPDATE payment_routes
      SET ${updates.join(', ')}
      WHERE id = ${params.routeId}
    `;

    // Execute using the sql client directly
    await sql`${queryString}`;

    return true;
  }

  /**
   * Create a new payment route
   */
  async createRoute(params: {
    provider_id: number;
    sending_country: string;
    sending_currency: string;
    receiving_country?: string;
    receiving_currency?: string;
    min_amount?: number;
    max_amount?: number;
    fee_percentage?: number;
    fee_fixed?: number;
    is_active?: boolean;
    requires_quote?: boolean;
    verification_status?: string;
    provider_config?: Record<string, any>;
    display_order?: number;
  }): Promise<number> {
    const sql = getDb();

    const result = await sql`
      INSERT INTO payment_routes (
        provider_id,
        sending_country,
        sending_currency,
        receiving_country,
        receiving_currency,
        min_amount,
        max_amount,
        fee_percentage,
        fee_fixed,
        is_active,
        requires_quote,
        verification_status,
        provider_config,
        display_order
      ) VALUES (
        ${params.provider_id},
        ${params.sending_country},
        ${params.sending_currency},
        ${params.receiving_country || 'MW'},
        ${params.receiving_currency || 'MWK'},
        ${params.min_amount || 0},
        ${params.max_amount || null},
        ${params.fee_percentage || 0},
        ${params.fee_fixed || 0},
        ${params.is_active !== undefined ? params.is_active : true},
        ${params.requires_quote || false},
        ${params.verification_status || 'unverified'},
        ${params.provider_config ? JSON.stringify(params.provider_config) : '{}'}::jsonb,
        ${params.display_order || 10}
      )
      RETURNING id
    `;

    return result[0]?.id;
  }

  /**
   * Delete a payment route
   */
  async deleteRoute(routeId: number): Promise<boolean> {
    const sql = getDb();
    
    const result = await sql`
      DELETE FROM payment_routes
      WHERE id = ${routeId}
      RETURNING id
    `;

    return result !== null && result.length > 0 && result[0]?.id !== undefined;
  }

  /**
   * Get all routes (admin)
   */
  async getAllRoutes(): Promise<PaymentRoute[]> {
    const routes = await queryAsArray<PaymentRoute>`
      SELECT 
        pr.*,
        p.name as provider_name,
        p.type as provider_type,
        p.category as provider_category
      FROM payment_routes pr
      JOIN payment_providers p ON p.id = pr.provider_id
      ORDER BY p.name ASC, pr.sending_country ASC, pr.sending_currency ASC
    `;

    return routes;
  }
}

export const paymentRouter = new PaymentRouter();
