// app/api/requests/[id]/image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const index = parseInt(searchParams.get('index') || '0');
    
    const sql = getDb();
    const images = await sql`
      SELECT image_url FROM request_images
      WHERE request_id = ${params.id}
      ORDER BY display_order ASC
    `;
    
    if (!images || images.length === 0 || !images[index]) {
      // Return a placeholder image if no image exists
      return NextResponse.redirect('https://via.placeholder.com/400x300?text=No+Image');
    }
    
    return NextResponse.redirect(images[index].image_url);
  } catch (err) {
    return NextResponse.redirect('https://via.placeholder.com/400x300?text=Error');
  }
}
