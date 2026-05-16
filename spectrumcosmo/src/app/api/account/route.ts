import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

// GET - Fetch all addresses for the user
export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    const sql = getDb();
    const addresses = await sql`
      SELECT * FROM addresses
      WHERE user_id = ${user.id}
      ORDER BY is_default DESC, created_at DESC
    `;
    
    return NextResponse.json(addresses);
  } catch (err) {
    console.error('Failed to fetch addresses:', err);
    return NextResponse.json([]);
  }
}

// POST - Create a new address
export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    const {
      full_name,
      phone_number,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      is_default,
    } = await req.json();

    if (!full_name || !phone_number || !address_line1 || !city) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // If this address is set as default, remove default from other addresses
    if (is_default) {
      await sql`
        UPDATE addresses SET is_default = FALSE
        WHERE user_id = ${user.id}
      `;
    }

    const [address] = await sql`
      INSERT INTO addresses (
        user_id, full_name, phone_number, address_line1, address_line2,
        city, state, postal_code, country, is_default, created_at, updated_at
      ) VALUES (
        ${user.id}, ${full_name}, ${phone_number}, ${address_line1}, ${address_line2 || null},
        ${city}, ${state || null}, ${postal_code || null}, ${country || 'Malawi'},
        ${is_default || false}, NOW(), NOW()
      )
      RETURNING *
    `;

    return NextResponse.json(address, { status: 201 });
  } catch (err) {
    console.error('Failed to create address:', err);
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing address
export async function PUT(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    const {
      id,
      full_name,
      phone_number,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
      is_default,
    } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Address ID required' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Check if address belongs to user
    const [existing] = await sql`
      SELECT id FROM addresses
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    if (!existing) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // If this address is set as default, remove default from other addresses
    if (is_default) {
      await sql`
        UPDATE addresses SET is_default = FALSE
        WHERE user_id = ${user.id} AND id != ${id}
      `;
    }

    const [address] = await sql`
      UPDATE addresses SET
        full_name = ${full_name},
        phone_number = ${phone_number},
        address_line1 = ${address_line1},
        address_line2 = ${address_line2 || null},
        city = ${city},
        state = ${state || null},
        postal_code = ${postal_code || null},
        country = ${country || 'Malawi'},
        is_default = ${is_default || false},
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `;

    return NextResponse.json(address);
  } catch (err) {
    console.error('Failed to update address:', err);
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

// DELETE - Remove an address
export async function DELETE(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Address ID required' },
        { status: 400 }
      );
    }

    const sql = getDb();

    const [deleted] = await sql`
      DELETE FROM addresses
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING id
    `;

    if (!deleted) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete address:', err);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}
