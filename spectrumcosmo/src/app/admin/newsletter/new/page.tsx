'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Upload, X } from 'lucide-react';

export default function NewNewsletterPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('all');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  const uploadToCloudinary = async (file: File) => {
    setUploadingImage(true);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert('Cloudinary not configured. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to .env.local');
      setUploadingImage(false);
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setImagePreview(data.secure_url);
        setImageUrl(data.secure_url);
        return data.secure_url;
      }
      throw new Error('Upload failed');
    } catch (err) {
      console.error('Upload error:', err);
      alert('Image upload failed. Please try again.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadToCloudinary(file);
    }
  };

  const handleCreate = async () => {
    if (!title || !content) {
      alert('Title and content are required');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/newsletter/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        image_url: imageUrl || null,
        audience,
        status: 'draft',
      }),
    });

    if (res.ok) {
      router.push('/admin/newsletter');
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to create newsletter');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h1 className="text-xl font-bold mb-6">Create Newsletter</h1>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="label">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="e.g., New Anime Collection Drop"
            />
          </div>

          {/* Content */}
          <div>
            <label className="label">Content *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="input resize-none"
              placeholder="Write your newsletter content here... (HTML supported)"
            />
            <p className="text-xs text-gray-400 mt-1">
              You can use basic HTML tags: &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, etc.
            </p>
          </div>

          {/* Audience */}
          <div>
            <label className="label">Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="input"
            >
              <option value="all">All Subscribers</option>
              <option value="customers">Customers Only</option>
            </select>
          </div>

          {/* Image Upload */}
          <div>
            <label className="label">Header Image (optional)</label>
            <div className="space-y-3">
              {imagePreview && (
                <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-gray-100 border">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => {
                      setImagePreview('');
                      setImageUrl('');
                    }}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black/80"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <label className="cursor-pointer flex-1">
                  <div className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                    <Upload size={16} />
                    <span className="text-sm">Upload image</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                  className="flex-1 input text-sm"
                  placeholder="Or paste image URL"
                />
              </div>
              {uploadingImage && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="animate-spin" size={16} />
                  Uploading to Cloudinary...
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || uploadingImage}
              className="flex-1 bg-[#F97316] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Create as Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
              }
