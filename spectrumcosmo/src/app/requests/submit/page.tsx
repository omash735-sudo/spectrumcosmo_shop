'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Loader2, CheckCircle, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
}

const MAX_IMAGES = 5;
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

export default function RequestSubmitPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [images, setImages] = useState<{ file: File; preview: string; id: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          const activeCategories = data.filter((cat: Category) => cat.is_active !== false);
          setCategories(activeCategories);
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
    const remaining = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, remaining);
    
    if (files.length > remaining) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
    }

    const newImages = toAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7),
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const newImages = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return newImages;
    });
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;
    
    setImages(prev => {
      const newImages = [...prev];
      [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
      return newImages;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
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
          title: title.trim(),
          description: description.trim(),
          categoryId: categoryId || null,
          imageUrls: uploadedUrls,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Submission failed');
      }

      setSuccess(true);
      toast.success('Request submitted successfully!');
      
      setTimeout(() => {
        router.push('/requests');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <Navbar />
        <div className="min-h-[70vh] bg-[var(--background)] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Request Submitted!</h2>
            <p className="text-[var(--foreground-muted)] mb-6">
              Your request has been sent for review by our team. You'll be notified once it's reviewed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push('/requests')}
                className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-xl font-medium hover:bg-[var(--primary-hover)] transition min-h-[44px] flex items-center justify-center"
              >
                Browse Community Requests
              </button>
              <button
                onClick={() => router.push('/wishlist')}
                className="px-6 py-2.5 border border-[var(--border)] rounded-xl font-medium hover:bg-[var(--background-secondary)] transition min-h-[44px] flex items-center justify-center"
              >
                View My Requests
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--background)] py-8 md:py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 px-3 py-1 rounded-full mb-3">
              <span className="text-xs font-medium text-[var(--primary)]">Submit Request</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">
              Submit a Request
            </h1>
            <p className="text-[var(--foreground-muted)] mt-1">
              Share your product idea with the community
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] p-6 md:p-8 shadow-sm space-y-6">
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                What do you want? <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
                placeholder="e.g., Jujutsu Kaisen Hoodie"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition"
                maxLength={MAX_TITLE_LENGTH}
                required
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${title.length >= MAX_TITLE_LENGTH ? 'text-red-500' : 'text-[var(--foreground-muted)]'}`}>
                  {title.length}/{MAX_TITLE_LENGTH}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Describe your idea <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
                rows={4}
                placeholder="Colors, size, material, specific characters, etc."
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition resize-none"
                maxLength={MAX_DESCRIPTION_LENGTH}
                required
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${description.length >= MAX_DESCRIPTION_LENGTH ? 'text-red-500' : 'text-[var(--foreground-muted)]'}`}>
                  {description.length}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Category <span className="text-[var(--foreground-muted)]">(optional)</span>
              </label>
              {loadingCategories ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-[var(--foreground-muted)]" />
                  <span className="text-sm text-[var(--foreground-muted)]">Loading categories...</span>
                </div>
              ) : (
                <select 
                  value={categoryId} 
                  onChange={(e) => setCategoryId(e.target.value)} 
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Reference Images <span className="text-red-500">*</span>
                <span className="text-[var(--foreground-muted)] text-xs ml-1">(max {MAX_IMAGES})</span>
              </label>
              
              <div className="flex flex-wrap gap-3 mb-3">
                {images.map((img, idx) => (
                  <div key={img.id} className="relative w-24 h-24 rounded-xl overflow-hidden border border-[var(--border)] group">
                    <Image src={img.preview} alt="Preview" fill className="object-cover" />
                    
                    {/* Reorder buttons */}
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => moveImage(idx, 'up')}
                          className="p-0.5 bg-black/50 rounded hover:bg-black/70 transition"
                          aria-label="Move up"
                        >
                          <ArrowUp size={12} className="text-white" />
                        </button>
                      )}
                      {idx < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveImage(idx, 'down')}
                          className="p-0.5 bg-black/50 rounded hover:bg-black/70 transition"
                          aria-label="Move down"
                        >
                          <ArrowDown size={12} className="text-white" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute top-1 right-1 bg-black/50 p-1 rounded-lg hover:bg-black/70 transition"
                    >
                      <X size={14} className="text-white" />
                    </button>
                    
                    <div className="absolute bottom-1 right-1 bg-black/50 px-1.5 py-0.5 rounded text-[10px] text-white">
                      {idx + 1}/{images.length}
                    </div>
                  </div>
                ))}
                
                {images.length < MAX_IMAGES && (
                  <label className="w-24 h-24 border-2 border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--background-secondary)] transition group">
                    <Upload size={20} className="text-[var(--foreground-muted)] group-hover:text-[var(--primary)] transition" />
                    <span className="text-[10px] text-[var(--foreground-muted)] mt-1">Upload</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={handleImageChange}
                      disabled={images.length >= MAX_IMAGES}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-[var(--foreground-muted)]">
                {images.length === 0 
                  ? 'At least one image is required. You can upload up to 5.' 
                  : `${images.length}/${MAX_IMAGES} images uploaded`}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full bg-[var(--primary)] text-white py-3 rounded-xl font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 transition flex items-center justify-center gap-2 min-h-[52px]"
            >
              {submitting || uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {uploading ? 'Uploading images...' : 'Submitting...'}
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
