// app/api/admin/upload-event-image/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'light';

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Get Cloudinary config from environment
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dfsvnaslv';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'spectrumcosmo_unsigned_upload';

    // Create form data for Cloudinary
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('upload_preset', uploadPreset);
    cloudinaryFormData.append('folder', 'events/posters');
    cloudinaryFormData.append('public_id', `event-poster-${type}-${Date.now()}`);
    
    // Add transformation parameters
    cloudinaryFormData.append('transformation', JSON.stringify([
      { width: 1200, height: 675, crop: 'fill' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]));

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Cloudinary upload error:', data);
      throw new Error(data.error?.message || 'Upload failed');
    }

    if (!data?.secure_url) {
      throw new Error('No secure_url in response');
    }

    return NextResponse.json({
      success: true,
      url: data.secure_url,
      public_id: data.public_id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    );
  }
}
