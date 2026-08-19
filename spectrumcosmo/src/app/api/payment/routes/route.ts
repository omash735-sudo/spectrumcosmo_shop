import { NextRequest, NextResponse } from 'next/server';
import { paymentRouter } from '@/lib/payment-routing';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const country = searchParams.get('country');
    const currency = searchParams.get('currency');
    const amount = parseFloat(searchParams.get('amount') || '0');
    const providerId = searchParams.get('providerId');

    if (!country || !currency) {
      return NextResponse.json(
        { error: 'Missing required parameters: country and currency are required' },
        { status: 400 }
      );
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount parameter' },
        { status: 400 }
      );
    }

    if (providerId) {
      const route = await paymentRouter.getRouteForProvider({
        providerId: parseInt(providerId),
        country,
        currency,
        amount
      });

      if (!route) {
        return NextResponse.json({
          available: false,
          message: `This payment provider is not available for ${country} with ${currency}`
        });
      }

      return NextResponse.json({
        available: true,
        route
      });
    }

    const result = await paymentRouter.getAvailableRoutes({
      country,
      currency,
      amount
    });

    return NextResponse.json({
      routes: result.routes,
      noRouteMessage: result.noRouteMessage
    });

  } catch (error) {
    console.error('Payment routes error:', error);
    return NextResponse.json(
      { error: 'Failed to get payment routes' },
      { status: 500 }
    );
  }
}
