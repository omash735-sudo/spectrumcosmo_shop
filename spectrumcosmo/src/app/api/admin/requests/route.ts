// app/api/admin/product-requests/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// Types
interface ProductRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  like_count: number;
  created_at: Date;
  user_id: string;
}

interface UserInfo {
  name: string;
  email: string;
}

interface CountResult {
  count: string | number;
}

interface AdminProductRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  like_count: number;
  created_at: Date;
  user_name: string;
  user_email: string;
  image_count: number;
  category_name: string | null;
}

interface PatchBody {
  id: string;
  status: string;
  admin_notes?: string;
}

// Helper function to safely parse count
function safeParseCount(count: string | number | undefined | null): number {
  if (typeof count === 'number') return count;
  if (typeof count === 'string') {
    const parsed = parseInt(count, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'pending';
  
  // Validate status parameter
  const validStatuses = ['pending', 'approved', 'declined', 'in_progress', 'completed'];
  const sanitizedStatus = validStatuses.includes(status) ? status : 'pending';

  const sql = getDb();

  try {
    // Simple query without complex joins
    const requests = await sql`
      SELECT 
        r.id,
        r.title,
        r.description,
        r.status,
        r.like_count,
        r.created_at,
        r.user_id
      FROM product_requests r
      WHERE r.status = ${sanitizedStatus}
      ORDER BY r.created_at DESC
    ` as ProductRequest[];

    // Return empty array if no results
    if (!requests || requests.length === 0) {
      return NextResponse.json([]);
    }

    // Get user info for each request
    const results: AdminProductRequest[] = [];
    for (const request of requests) {
      const [user] = await sql`
        SELECT name, email FROM users WHERE id = ${request.user_id}
      ` as UserInfo[];
      
      const [imageCount] = await sql`
        SELECT COUNT(*) as count FROM request_images WHERE request_id = ${request.id}
      ` as CountResult[];
      
      const [likeCount] = await sql`
        SELECT COUNT(*) as count FROM request_likes WHERE request_id = ${request.id}
      ` as CountResult[];

      results.push({
        id: request.id,
        title: request.title,
        description: request.description,
        status: request.status,
        like_count: safeParseCount(likeCount?.count),
        created_at: request.created_at,
        user_name: user?.name || 'Unknown',
        user_email: user?.email || '',
        image_count: safeParseCount(imageCount?.count),
        category_name: null,
      });
    }

    return NextResponse.json(results);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('Admin requests GET error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json() as PatchBody;
    const { id, status, admin_notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'declined', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const sql = getDb();

    // Check if request exists
    const [existingRequest] = await sql`
      SELECT id FROM product_requests WHERE id = ${id}
    `;

    if (!existingRequest) {
      return NextResponse.json({ error: 'Product request not found' }, { status: 404 });
    }

    await sql`
      UPDATE product_requests 
      SET status = ${status}, admin_notes = ${admin_notes || null}, updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('Admin PATCH error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
