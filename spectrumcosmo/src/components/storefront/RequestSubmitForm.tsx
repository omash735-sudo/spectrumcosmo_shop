'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader2, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
}

export default function RequestSubmitForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch categories from your API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          // Filter only active categories
          const activeCategories = data.filter((cat: Category) => cat.is_active !== false);
          setCategories(activeCategories);
        } else {
          console.error('Failed to fetch categories');
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'spectrumcosmo';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!data.secure_url) throw new Error('Upload failed');
    return data.secure_url;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      setError('Title and description are required');
      return;
    }
    if (images.length === 0) {
      setError('Please upload at least one reference image');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      setUploading(true);
      const uploadedUrls = await Promise.all(images.map(img => uploadToCloudinary(img.file)));
      setUploading(false);

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          categoryId: categoryId || null,
          imageUrls: uploadedUrls,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Submission failed');
      }

      setSuccess(true);
      setTimeout(() => router.push('/newsletter'), 3000);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h3 className="text-xl font-bold mb-2">Request Submitted!</h3>
        <p className="text-gray-500">Your request has been sent for review by our team.</p>
        <button
          onClick={() => router.push('/newsletter')}
          className="mt-4 text-orange-500 hover:underline"
        >
          Back to Newsletter
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1">What do you want? *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Jujutsu Kaisen Hoodie"
          className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Describe your idea *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Colors, size, material, specific characters, etc."
          className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        {loadingCategories ? (
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-gray-400" />
            <span className="text-sm text-gray-400">Loading categories...</span>
          </div>
        ) : (
          <select 
            value={categoryId} 
            onChange={(e) => setCategoryId(e.target.value)} 
            className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Reference Images *</label>
        <div className="flex flex-wrap gap-3 mb-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border">
              <Image src={img.preview} alt="Preview" fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-0 right-0 bg-black/50 p-1 rounded-bl"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          ))}
          <label className="w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition">
            <Upload size={20} className="text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Upload</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
          </label>
        </div>
        <p className="text-xs text-gray-400">At least one image is required. You can upload multiple.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-200">{error}</div>}

      <button
        type="submit"
        disabled={submitting || uploading}
        className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
      >
        {submitting || uploading ? <Loader2 size={18} className="animate-spin" /> : null}
        {submitting || uploading ? 'Submitting...' : 'Submit Request'}
      </button>
    </form>
  );
}
