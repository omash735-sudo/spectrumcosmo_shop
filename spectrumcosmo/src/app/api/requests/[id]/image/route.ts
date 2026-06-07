// app/api/requests/[id]/image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';

interface RequestImage {
  image_url: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const index = parseInt(searchParams.get('index') || '0', 10);

    if (isNaN(index) || index < 0) {
      return NextResponse.redirect('https://via.placeholder.com/400x300?text=Invalid+Index');
    }

    const sql = getDb();
    const images = await queryAsArray<RequestImage>`
      SELECT image_url FROM request_images
      WHERE request_id = ${id}
      ORDER BY display_order ASC
    `;

    if (images.length === 0 || !images[index]?.image_url) {
      // No image found – redirect to placeholder
      return NextResponse.redirect('https://via.placeholder.com/400x300?text=No+Image');
    }

    return NextResponse.redirect(images[index].image_url);
  } catch (err) {
    console.error('Request image error:', err);
    // Redirect to a generic error placeholder (do not leak internal details)
    return NextResponse.redirect('https://via.placeholder.com/400x300?text=Error');
  }
}
