// app/api/custom-orders/route.ts
import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const ITEM_TYPES = ['T-Shirt', 'Hoodie', 'Anime Jersey', 'Accessory', 'Other'] as const;

const clean = (v: unknown, max: number) =>
  typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: corsHeaders });
  }

  // Honeypot: real people never fill this hidden field. Pretend success.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  }

  const name = clean(body.name, 100);
  const contact = clean(body.contact, 120);
  // Keep line breaks in the description, only trim and cap it.
  const description =
    typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : '';
  const itemType = ITEM_TYPES.includes(body.item_type as any)
    ? (body.item_type as string)
    : 'Other';
  const quantity = Math.min(1000, Math.max(1, Math.floor(Number(body.quantity) || 1)));

  if (name.length < 2) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400, headers: corsHeaders });
  }
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const looksLikePhone = contact.replace(/\D/g, '').length >= 7;
  if (!looksLikeEmail && !looksLikePhone) {
    return NextResponse.json(
      { error: 'Please enter a phone number or email we can reach you on.' },
      { status: 400, headers: corsHeaders }
    );
  }
  if (description.length < 10) {
    return NextResponse.json(
      { error: 'Please describe what you would like us to make.' },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const row = await queryOne<{ id: string }>`
      INSERT INTO custom_orders (name, contact, item_type, quantity, description)
      VALUES (${name}, ${contact}, ${itemType}, ${quantity}, ${description})
      RETURNING id
    `;
    return NextResponse.json({ success: true, id: row?.id ?? null }, { status: 201, headers: corsHeaders });
  } catch (err) {
    console.error('Custom order insert failed:', err);
    return NextResponse.json({ error: 'Could not save your request. Please try again.' }, { status: 500, headers: corsHeaders });
  }
}
