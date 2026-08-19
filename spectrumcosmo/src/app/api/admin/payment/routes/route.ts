// app/api/admin/payment/routes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';
import { paymentRouter } from '@/lib/payment-routing';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await getVerifiedUser(req);
    if (authError) return authError;

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');

    const sql = getDb();

    let query = `
      SELECT 
        pr.*,
        p.name as provider_name,
        p.type as provider_type,
        p.category as provider_category
      FROM payment_routes pr
      JOIN payment_providers p ON p.id = pr.provider_id
    `;

    if (providerId) {
      query += ` WHERE pr.provider_id = ${parseInt(providerId)}`;
    }
    query += ` ORDER BY p.name ASC, pr.sending_country ASC, pr.sending_currency ASC`;

    const routes = await queryAsArray<any>`
      ${query}
    `;

    return NextResponse.json({ routes });

  } catch (error) {
    console.error('Admin routes error:', error);
    return NextResponse.json(
      { error: 'Failed to get routes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getVerifiedUser(req);
    if (authError) return authError;

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const {
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
    } = body;

    if (!provider_id || !sending_country || !sending_currency) {
      return NextResponse.json(
        { error: 'Missing required fields: provider_id, sending_country, sending_currency' },
        { status: 400 }
      );
    }

    const id = await paymentRouter.createRoute({
      provider_id,
      sending_country,
      sending_currency,
      receiving_country: receiving_country || 'MW',
      receiving_currency: receiving_currency || 'MWK',
      min_amount: min_amount || 0,
      max_amount: max_amount || null,
      fee_percentage: fee_percentage || 0,
      fee_fixed: fee_fixed || 0,
      is_active: is_active !== undefined ? is_active : true,
      requires_quote: requires_quote || false,
      verification_status: verification_status || 'unverified',
      provider_config: provider_config || {},
      display_order: display_order || 10
    });

    return NextResponse.json({
      success: true,
      id,
      message: 'Payment route created successfully'
    });

  } catch (error) {
    console.error('Create route error:', error);
    return NextResponse.json(
      { error: 'Failed to create route' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, error: authError } = await getVerifiedUser(req);
    if (authError) return authError;

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { routeId, ...updates } = body;

    if (!routeId) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 }
      );
    }

    await paymentRouter.updateRoute({
      routeId,
      ...updates
    });

    return NextResponse.json({
      success: true,
      message: 'Route updated successfully'
    });

  } catch (error) {
    console.error('Update route error:', error);
    return NextResponse.json(
      { error: 'Failed to update route' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, error: authError } = await getVerifiedUser(req);
    if (authError) return authError;

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const routeId = searchParams.get('routeId');

    if (!routeId) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 }
      );
    }

    const result = await paymentRouter.deleteRoute(parseInt(routeId));

    if (!result) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Route deleted successfully'
    });

  } catch (error) {
    console.error('Delete route error:', error);
    return NextResponse.json(
      { error: 'Failed to delete route' },
      { status: 500 }
    );
  }
}
