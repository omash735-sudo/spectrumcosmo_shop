import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    console.log('=== ORDER STATUSES API START ===');
    
    // Check admin auth
    console.log('Checking admin auth...');
    const authError = requireAdmin(req);
    if (authError) {
      console.log('Auth error:', authError);
      return authError;
    }
    
    console.log('Auth passed, getting database connection...');
    const sql = getDb();
    
    console.log('Executing query...');
    const statuses = await sql`
      SELECT * FROM order_statuses ORDER BY display_order ASC
    `;
    
    console.log('Query successful, found', statuses.length, 'statuses');
    console.log('Data sample:', JSON.stringify(statuses[0], null, 2));
    
    return NextResponse.json(statuses);
  } catch (err: any) {
    console.error('API Error Details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    return NextResponse.json({ 
      error: err.message,
      details: err.stack 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const { name, slug, description, color, icon, display_order } = await req.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const sql = getDb();
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const [status] = await sql`
      INSERT INTO order_statuses (name, slug, description, color, icon, display_order, is_active)
      VALUES (${name}, ${finalSlug}, ${description || null}, ${color || 'gray'}, ${icon || 'Clock'}, ${display_order || 0}, true)
      RETURNING *
    `;
    
    return NextResponse.json(status);
  } catch (err: any) {
    console.error('POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const { id, name, slug, description, color, icon, display_order, is_active } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const sql = getDb();
    const [status] = await sql`
      UPDATE order_statuses 
      SET name = COALESCE(${name}, name),
          slug = COALESCE(${slug}, slug),
          description = COALESCE(${description}, description),
          color = COALESCE(${color}, color),
          icon = COALESCE(${icon}, icon),
          display_order = COALESCE(${display_order}, display_order),
          is_active = COALESCE(${is_active}, is_active),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (!status) {
      return NextResponse.json({ error: 'Status not found' }, { status: 404 });
    }
    
    return NextResponse.json(status);
  } catch (err: any) {
    console.error('PATCH error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const sql = getDb();
    await sql`DELETE FROM order_statuses WHERE id = ${id}`;
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
