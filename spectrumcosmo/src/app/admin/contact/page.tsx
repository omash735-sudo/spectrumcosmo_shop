'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Upload, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  Image as ImageIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Link as LinkIcon, 
  MessageCircle,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

// Types
interface FeatureGridItem {
  title: string;
  description: string;
  link: string;
}

interface ContactDetails {
  email: string;
  phone: string;
  address: string;
  whatsapp_link: string;
  instagram: string;
  facebook: string;
  twitter: string;
}

interface HeroSection {
  mode: 'single' | 'carousel';
  single_image: string;
  carousel_images: string[];
  title: string;
  subtitle: string;
  text_color: string;
}

interface ContactContent {
  hero: HeroSection;
  form_title: string;
  form_subtitle: string;
  feature_grid: FeatureGridItem[];
  contact_details: ContactDetails;
  community_link: string;
}

// Constants
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'spectrumcosmo';

const defaultContent: ContactContent = {
  hero: {
    mode: 'single',
    single_image: '',
    carousel_images: [],
    title: 'Get in Touch',
    subtitle: "We'd love to hear from you",
    text_color: '#C96712',
  },
  form_title: 'Send us a Message',
  form_subtitle: "We'll get back to you within 24 hours",
  feature_grid: [],
  contact_details: {
    email: '',
    phone: '',
    address: '',
    whatsapp_link: '',
    instagram: '',
    facebook: '',
    twitter: '',
  },
  community_link: '',
};

// ===== SKELETON =====
function ContactSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
      <div className="h-4 bg-[var(--background-secondary)] rounded w-64" />
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-[var(--background-secondary)] rounded flex-1" />
        ))}
      </div>
      <div className="h-96 bg-[var(--background-secondary)] rounded" />
    </div>
  );
}

// ===== IMAGE UPLOAD COMPONENT =====
function ImageUploadArea({
  label,
  imageUrl,
  onUpload,
  onRemove,
  uploading,
  className = '',
}: {
  label: string;
  imageUrl: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  uploading: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
        {label}
      </label>
      <div className="relative w-full max-w-md h-40 sm:h-48 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--background-secondary)]">
        {imageUrl ? (
          <>
            <Image src={imageUrl} alt={label} fill className="object-cover" />
            <button
              onClick={onRemove}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full transition shadow-lg min-h-[32px] min-w-[32px] flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--foreground-muted)] opacity-30" />
          </div>
        )}
      </div>
      <label className="cursor-pointer inline-flex items-center gap-2 mt-3 px-4 py-2 bg-[var(--background-secondary)] hover:bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs sm:text-sm font-medium text-[var(--foreground)] transition min-h-[40px]">
        <Upload className="w-3.5 h-3.5" />
        {imageUrl ? 'Replace Image' : 'Upload Image'}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onUpload}
          disabled={uploading}
        />
      </label>
      {uploading && (
        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
          <Loader2 className="animate-spin w-3.5 h-3.5" />
          Uploading...
        </div>
      )}
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function AdminContactPage() {
  const [content, setContent] = useState<ContactContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'form' | 'grid' | 'details'>('hero');

  useEffect(() => {
    fetch('/api/admin/contact')
      .then(res => res.json())
      .then(data => {
        setContent({ ...defaultContent, ...data });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load content:', err);
        toast.error('Failed to load contact page content');
        setLoading(false);
      });
  }, []);

  const updateField = useCallback((path: string[], value: unknown) => {
    setContent((prev: ContactContent) => {
      const newContent = { ...prev };
      let cur: any = newContent;
      for (let i = 0; i < path.length - 1; i++) {
        if (!cur[path[i]]) cur[path[i]] = {};
        cur = cur[path[i]];
      }
      cur[path[path.length - 1]] = value;
      return newContent;
    });
  }, []);

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!CLOUDINARY_CLOUD_NAME) {
      toast.error('Cloudinary not configured');
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.secure_url) throw new Error('Upload failed');
      return data.secure_url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      console.error('Upload failed:', errorMessage);
      toast.error(errorMessage);
      return null;
    }
  };

  // Hero image handlers
  const handleSingleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    const url = await uploadImage(file);
    if (url) updateField(['hero', 'single_image'], url);
    setUploadingImg(false);
  };

  const removeSingleImage = () => updateField(['hero', 'single_image'], '');

  const addCarouselImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    const url = await uploadImage(file);
    if (url) {
      const images = [...(content.hero?.carousel_images || []), url];
      updateField(['hero', 'carousel_images'], images);
    }
    setUploadingImg(false);
  };

  const removeCarouselImage = (idx: number) => {
    const images = [...(content.hero?.carousel_images || [])];
    images.splice(idx, 1);
    updateField(['hero', 'carousel_images'], images);
  };

  const moveCarouselImage = (idx: number, direction: 'up' | 'down') => {
    const images = [...(content.hero?.carousel_images || [])];
    if (direction === 'up' && idx > 0) {
      [images[idx - 1], images[idx]] = [images[idx], images[idx - 1]];
    } else if (direction === 'down' && idx < images.length - 1) {
      [images[idx], images[idx + 1]] = [images[idx + 1], images[idx]];
    }
    updateField(['hero', 'carousel_images'], images);
  };

  // Feature grid helpers
  const addGridItem = () => {
    const grid = [...(content.feature_grid || [])];
    grid.push({ title: '', description: '', link: '' });
    updateField(['feature_grid'], grid);
  };

  const removeGridItem = (idx: number) => {
    const grid = [...(content.feature_grid || [])];
    grid.splice(idx, 1);
    updateField(['feature_grid'], grid);
  };

  const updateGridItem = (idx: number, field: keyof FeatureGridItem, val: string) => {
    const grid = [...(content.feature_grid || [])];
    grid[idx] = { ...grid[idx], [field]: val };
    updateField(['feature_grid'], grid);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success('Contact page content saved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Save failed';
      console.error('Save error:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[var(--primary)] w-8 h-8 mx-auto mb-3" />
          <p className="text-[var(--foreground-muted)]">Loading contact page content...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'hero' as const, label: 'Hero Section', icon: ImageIcon },
    { id: 'form' as const, label: 'Form Section', icon: Mail },
    { id: 'grid' as const, label: 'Feature Grid', icon: LinkIcon },
    { id: 'details' as const, label: 'Contact Details', icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background-card)] border-b border-[var(--border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Contact Page Editor</h1>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
                Manage your contact page content and settings
              </p>
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition disabled:opacity-50 shadow-sm text-sm sm:text-base min-h-[44px]"
            >
              {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 mb-4 sm:mb-6 bg-[var(--background-card)] rounded-lg border border-[var(--border)] p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-md font-medium text-xs sm:text-sm transition min-h-[40px] ${
                  activeTab === tab.id
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">{tab.label}</span>
                <span className="xs:hidden">{tab.id.charAt(0).toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        {/* Content Card */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
          {/* Hero Tab */}
          {activeTab === 'hero' && (
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Mode Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-2">
                  Hero Display Mode
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="single"
                      checked={content.hero?.mode === 'single'}
                      onChange={() => updateField(['hero', 'mode'], 'single')}
                      className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="text-sm">Single Image</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="carousel"
                      checked={content.hero?.mode === 'carousel'}
                      onChange={() => updateField(['hero', 'mode'], 'carousel')}
                      className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="text-sm">Carousel / Slider</span>
                  </label>
                </div>
              </div>

              {/* Single Image Upload */}
              {content.hero?.mode === 'single' && (
                <ImageUploadArea
                  label="Hero Image"
                  imageUrl={content.hero?.single_image || ''}
                  onUpload={handleSingleUpload}
                  onRemove={removeSingleImage}
                  uploading={uploadingImg}
                />
              )}

              {/* Carousel Images */}
              {content.hero?.mode === 'carousel' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-2">
                    Carousel Images
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {content.hero?.carousel_images?.map((url: string, idx: number) => (
                      <div
                        key={idx}
                        className="relative group border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--background-secondary)] aspect-square"
                      >
                        <Image src={url} alt={`Slide ${idx + 1}`} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                          <button
                            onClick={() => moveCarouselImage(idx, 'up')}
                            className="bg-black/60 hover:bg-black/80 p-1.5 rounded text-white transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                            disabled={idx === 0}
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveCarouselImage(idx, 'down')}
                            className="bg-black/60 hover:bg-black/80 p-1.5 rounded text-white transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                            disabled={idx === (content.hero?.carousel_images?.length || 0) - 1}
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeCarouselImage(idx)}
                            className="bg-red-600 hover:bg-red-700 p-1.5 rounded text-white transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <label className="aspect-square border-2 border-dashed border-[var(--border)] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--background-secondary)] transition">
                      <Plus className="w-6 h-6 text-[var(--foreground-muted)]" />
                      <span className="text-xs text-[var(--foreground-muted)] mt-1">Add Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={addCarouselImage}
                        disabled={uploadingImg}
                      />
                    </label>
                  </div>
                  {uploadingImg && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                      <Loader2 className="animate-spin w-4 h-4" />
                      Uploading image...
                    </div>
                  )}
                  <p className="text-xs text-[var(--foreground-muted)] mt-4 opacity-70">
                    Recommended image size: 1200x600px. Use arrow buttons to reorder.
                  </p>
                </div>
              )}

              {/* Text Content */}
              <div className="space-y-3 sm:space-y-4 pt-4 border-t border-[var(--border)]">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    Hero Title
                  </label>
                  <input
                    value={content.hero?.title || ''}
                    onChange={(e) => updateField(['hero', 'title'], e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    placeholder="Main heading text"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    Hero Subtitle
                  </label>
                  <input
                    value={content.hero?.subtitle || ''}
                    onChange={(e) => updateField(['hero', 'subtitle'], e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    placeholder="Secondary text"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    Text Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={content.hero?.text_color || '#C96712'}
                      onChange={(e) => updateField(['hero', 'text_color'], e.target.value)}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded border border-[var(--border)] cursor-pointer bg-[var(--background-secondary)]"
                    />
                    <span className="text-xs sm:text-sm text-[var(--foreground-muted)] font-mono">
                      {content.hero?.text_color || '#C96712'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Tab */}
          {activeTab === 'form' && (
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                  Form Title
                </label>
                <input
                  value={content.form_title || ''}
                  onChange={(e) => updateField(['form_title'], e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                  placeholder="Send us a Message"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                  Form Subtitle
                </label>
                <input
                  value={content.form_subtitle || ''}
                  onChange={(e) => updateField(['form_subtitle'], e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                  placeholder="We'll get back to you within 24 hours"
                />
              </div>
            </div>
          )}

          {/* Feature Grid Tab */}
          {activeTab === 'grid' && (
            <div className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {content.feature_grid?.map((item: FeatureGridItem, idx: number) => (
                  <div key={idx} className="border border-[var(--border)] rounded-lg p-3 sm:p-4 space-y-3">
                    <input
                      placeholder="Feature Title"
                      value={item.title}
                      onChange={(e) => updateGridItem(idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    />
                    <input
                      placeholder="Feature Description"
                      value={item.description}
                      onChange={(e) => updateGridItem(idx, 'description', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    />
                    <input
                      placeholder="Link URL (e.g., /products)"
                      value={item.link}
                      onChange={(e) => updateGridItem(idx, 'link', e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    />
                    <button
                      onClick={() => removeGridItem(idx)}
                      className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Feature
                    </button>
                  </div>
                ))}
                <button
                  onClick={addGridItem}
                  className="inline-flex items-center gap-1.5 text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium transition"
                >
                  <Plus className="w-4 h-4" /> Add Feature
                </button>
                {(!content.feature_grid || content.feature_grid.length === 0) && (
                  <p className="text-sm text-[var(--foreground-muted)] text-center py-4">
                    No features added. Click "Add Feature" to start.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Contact Details Tab */}
          {activeTab === 'details' && (
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    <Mail className="inline w-3 h-3 mr-1" /> Email
                  </label>
                  <input
                    type="email"
                    value={content.contact_details?.email || ''}
                    onChange={(e) => updateField(['contact_details', 'email'], e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    placeholder="contact@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    <Phone className="inline w-3 h-3 mr-1" /> Phone
                  </label>
                  <input
                    value={content.contact_details?.phone || ''}
                    onChange={(e) => updateField(['contact_details', 'phone'], e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    placeholder="+265 123 456 789"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    <MapPin className="inline w-3 h-3 mr-1" /> Address
                  </label>
                  <input
                    value={content.contact_details?.address || ''}
                    onChange={(e) => updateField(['contact_details', 'address'], e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    placeholder="123 Main St, City, Country"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    <MessageCircle className="inline w-3 h-3 mr-1" /> WhatsApp Link
                  </label>
                  <input
                    value={content.contact_details?.whatsapp_link || ''}
                    onChange={(e) => updateField(['contact_details', 'whatsapp_link'], e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    placeholder="https://wa.me/123456789"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    Instagram URL
                  </label>
                  <input
                    value={content.contact_details?.instagram || ''}
                    onChange={(e) => updateField(['contact_details', 'instagram'], e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    Facebook URL
                  </label>
                  <input
                    value={content.contact_details?.facebook || ''}
                    onChange={(e) => updateField(['contact_details', 'facebook'], e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    Twitter URL
                  </label>
                  <input
                    value={content.contact_details?.twitter || ''}
                    onChange={(e) => updateField(['contact_details', 'twitter'], e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    placeholder="https://twitter.com/..."
                  />
                </div>
              </div>

              {/* Community Link */}
              <div className="pt-4 border-t border-[var(--border)]">
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                  <LinkIcon className="inline w-3 h-3 mr-1" /> Community Link
                </label>
                <input
                  value={content.community_link || ''}
                  onChange={(e) => updateField(['community_link'], e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                  placeholder="https://chat.whatsapp.com/your-invite-link"
                />
                <p className="text-xs text-[var(--foreground-muted)] mt-1.5 opacity-70">
                  This link will be used for the "Join Our Community" button across the site.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="mt-4 sm:mt-6 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400">
                <strong>Pro Tip:</strong> The hero section supports both single images and carousels. 
                Use carousel mode to showcase multiple images or promotions. Recommended size: 1200x600px.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
