// app/api/exchange-rates/route.ts
import { NextResponse } from 'next/server';

let cachedRates: any = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 60 * 60 * 1000;

const REALISTIC_RATES = {
  MWK: 4500,
  ZAR: 18.5,
  EUR: 0.92,
  GBP: 0.75,
  NGN: 1500,
  KES: 150,
  TZS: 2500,
  ZMW: 25,
  ZWL: 322,
};

const MARKUP = 1.05;
const SUPPORTED_CURRENCIES = ['MWK', 'ZAR', 'EUR', 'GBP', 'NGN', 'KES', 'TZS', 'ZMW', 'ZWL'];

export async function GET() {
  try {
    const now = Date.now();
    if (cachedRates && (now - lastFetchTime) < CACHE_DURATION) {
      return NextResponse.json({
        ...cachedRates,
        cached: true,
        updatedAt: new Date(lastFetchTime).toISOString(),
      });
    }

    const response = await fetch(
      `https://api.frankfurter.app/latest?from=USD&to=${SUPPORTED_CURRENCIES.join(',')}`,
      { next: { revalidate: 3600 } }
    );

    let rates: Record<string, number> = { USD: 1 };
    let updatedAt = new Date().toISOString();

    if (response.ok) {
      const data = await response.json();
      updatedAt = data.date;
      
      rates = {
        USD: 1,
        MWK: REALISTIC_RATES.MWK * MARKUP,
        ZAR: data.rates?.ZAR ? data.rates.ZAR * MARKUP : REALISTIC_RATES.ZAR * MARKUP,
        EUR: data.rates?.EUR ? data.rates.EUR * MARKUP : REALISTIC_RATES.EUR * MARKUP,
        GBP: data.rates?.GBP ? data.rates.GBP * MARKUP : REALISTIC_RATES.GBP * MARKUP,
        NGN: data.rates?.NGN ? data.rates.NGN * MARKUP : REALISTIC_RATES.NGN * MARKUP,
        KES: data.rates?.KES ? data.rates.KES * MARKUP : REALISTIC_RATES.KES * MARKUP,
        TZS: data.rates?.TZS ? data.rates.TZS * MARKUP : REALISTIC_RATES.TZS * MARKUP,
        ZMW: data.rates?.ZMW ? data.rates.ZMW * MARKUP : REALISTIC_RATES.ZMW * MARKUP,
        ZWL: data.rates?.ZWL ? data.rates.ZWL * MARKUP : REALISTIC_RATES.ZWL * MARKUP,
      };
    } else {
      rates = {
        USD: 1,
        MWK: REALISTIC_RATES.MWK * MARKUP,
        ZAR: REALISTIC_RATES.ZAR * MARKUP,
        EUR: REALISTIC_RATES.EUR * MARKUP,
        GBP: REALISTIC_RATES.GBP * MARKUP,
        NGN: REALISTIC_RATES.NGN * MARKUP,
        KES: REALISTIC_RATES.KES * MARKUP,
        TZS: REALISTIC_RATES.TZS * MARKUP,
        ZMW: REALISTIC_RATES.ZMW * MARKUP,
        ZWL: REALISTIC_RATES.ZWL * MARKUP,
      };
    }

    cachedRates = rates;
    lastFetchTime = now;

    return NextResponse.json({
      ...rates,
      updatedAt,
      markup: MARKUP,
    });
  } catch (error) {
    console.error('Exchange rate fetch error:', error);
    return NextResponse.json(
      {
        USD: 1,
        MWK: REALISTIC_RATES.MWK * MARKUP,
        ZAR: REALISTIC_RATES.ZAR * MARKUP,
        EUR: REALISTIC_RATES.EUR * MARKUP,
        GBP: REALISTIC_RATES.GBP * MARKUP,
        NGN: REALISTIC_RATES.NGN * MARKUP,
        KES: REALISTIC_RATES.KES * MARKUP,
        TZS: REALISTIC_RATES.TZS * MARKUP,
        ZMW: REALISTIC_RATES.ZMW * MARKUP,
        ZWL: REALISTIC_RATES.ZWL * MARKUP,
        fallback: true,
        updatedAt: new Date().toISOString(),
        markup: MARKUP,
      },
      { status: 200 }
    );
  }
}
