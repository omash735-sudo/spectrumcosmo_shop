'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, X, ChevronLeft, ChevronRight, Upload, Save, Image as ImageIcon, Eye } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

// Types
type AlignmentType = 'left' | 'center' | 'right';
type VerticalPositionType = 'top' | 'center' | 'bottom';
type HeroType = 'single' | 'carousel';
type TextSizeType = 'text-3xl' | 'text-4xl' | 'text-5xl' | 'text-6xl' | 'text-7xl';

interface HeroSection {
  page: string;
  type: HeroType;
  images: string[];
  title: string;
  subtitle: string;
  title_color: string;
  subtitle_color: string;
  text_size: TextSizeType;
  title_alignment: AlignmentType;
  subtitle_alignment: AlignmentType;
  vertical_position: VerticalPositionType;
  button_label: string;
  button_link: string;
  button_bg_color: string;
  button_text_color: string;
  overlay_opacity: number;
  active: boolean;
}

const pageOptions = ['home', 'products', 'reviews', 'about', 'contact'];
const pageNames: Record<string, string> = {
  home: 'Home Page',
  products: 'Products Page',
  reviews: 'Reviews Page',
  about: 'About Page',
  contact: 'Contact Page',
};

const alignmentOptions: AlignmentType[] = ['left', 'center', 'right'];
const verticalOptions: VerticalPositionType[] = ['top', 'center', 'bottom'];
const textSizeOptions: TextSizeType[] = ['text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl'];

const defaultSection: Omit<HeroSection, 'page'> = {
  type: 'single',
  images: [],
  title: '',
  subtitle: '',
  title_color: '#FFFFFF',
  subtitle_color: '#FFFFFF',
  text_size: 'text-5xl',
  title_alignment: 'center',
  subtitle_alignment: 'center',
  vertical_position: 'center',
  button_label: '',
  button_link: '',
  button_bg_color: '#F97316',
  button_text_color: '#FFFFFF',
  overlay_opacity: 50,
  active: true,
};

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'spectrumcosmo';

export default function AdminHeroPage() {
  const [sections, setSections] = useState<Record<string, HeroSection>>({});
  const [selectedPage, setSelectedPage] = useState<string>('home');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/hero')
      .then(res => res.json())
      .then(data => {
        const map: Record<string, HeroSection> = {};
        data.forEach((s: HeroSection) => { 
          map[s.page] = s; 
        });
        setSections(map);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load hero sections:', err);
        toast.error('Failed to load hero sections');
        setLoading(false);
      });
  }, []);

  const current: HeroSection = sections[selectedPage] || {
    ...defaultSection,
    page: selectedPage,
  };

  const updateField = useCallback((field: keyof HeroSection, value: unknown) => {
    setSections(prev => ({
      ...prev,
      [selectedPage]: { ...prev[selectedPage], [field]: value }
    }));
  }, [selectedPage]);

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

  const handleSingleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    if (url) updateField('images', [url]);
    setUploading(false);
  };

  const addCarouselImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    if (url) {
      const images = [...(current.images || []), url];
      updateField('images', images);
    }
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    const images = [...(current.images || [])];
    images.splice(idx, 1);
    updateField('images', images);
  };

  const moveImage = (idx: number, direction: 'up' | 'down') => {
    const images = [...(current.images || [])];
    if (direction === 'up' && idx > 0) {
      [images[idx - 1], images[idx]] = [images[idx], images[idx - 1]];
    } else if (direction === 'down' && idx < images.length - 1) {
      [images[idx], images[idx + 1]] = [images[idx + 1], images[idx]];
    }
    updateField('images', images);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(current),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success('Hero section saved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Save failed';
      console.error('Save error:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Helper function to get alignment classes for Tailwind (for preview)
  const getAlignmentClasses = (alignment: AlignmentType, vertical: VerticalPositionType) => {
    const horizontalClass = {
      left: 'items-start',
      center: 'items-center',
      right: 'items-end',
    }[alignment];
    
    const verticalClass = {
      top: 'justify-start',
      center: 'justify-center',
      bottom: 'justify-end',
    }[vertical];
    
    return `${horizontalClass} ${verticalClass}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <Loader2 className="animate-spin text-orange-500 w-8 h-8 mb-3" />
        <p className="text-gray-500 dark:text-gray-400">Loading hero sections...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Shopify-style Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hero Section Editor</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage hero banners for each page
              </p>
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition disabled:opacity-50 shadow-sm"
            >
              {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {pageOptions.map(page => (
            <button
              key={page}
              onClick={() => setSelectedPage(page)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedPage === page 
                  ? 'bg-orange-500 text-white shadow-sm' 
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
              }`}
            >
              {pageNames[page]}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Panel */}
          <div className="space-y-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            {/* Hero Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hero Mode
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="single"
                    checked={current.type === 'single'}
                    onChange={() => updateField('type', 'single')}
                    className="w-4 h-4 text-orange-500"
                  />
                  <span className="text-sm">Single Image</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="carousel"
                    checked={current.type === 'carousel'}
                    onChange={() => updateField('type', 'carousel')}
                    className="w-4 h-4 text-orange-500"
                  />
                  <span className="text-sm">Carousel / Slider</span>
                </label>
              </div>
            </div>

            {/* Images Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Images
              </label>
              <div className="flex flex-wrap gap-3">
                {current.images?.map((url, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group bg-gray-100 dark:bg-gray-800">
                    <Image src={url} alt={`Slide ${idx + 1}`} fill className="object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/60 p-1.5 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => moveImage(idx, 'up')}
                        className="text-white hover:text-orange-400 text-xs p-1"
                        disabled={idx === 0}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        onClick={() => moveImage(idx, 'down')}
                        className="text-white hover:text-orange-400 text-xs p-1"
                        disabled={idx === (current.images?.length || 0) - 1}
                      >
                        <ChevronRight size={14} />
                      </button>
                      <button
                        onClick={() => removeImage(idx)}
                        className="text-red-400 hover:text-red-300 text-xs p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                <label className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  {uploading ? (
                    <Loader2 size={20} className="animate-spin text-orange-500" />
                  ) : (
                    <>
                      <Plus size={20} className="text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={current.type === 'single' ? handleSingleUpload : addCarouselImage}
                    disabled={uploading}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {current.type === 'single' ? 'Upload one main image' : 'Upload multiple images for carousel slider'}
              </p>
            </div>

            {/* Text Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                value={current.title || ''}
                onChange={e => updateField('title', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Hero title text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subtitle
              </label>
              <input
                value={current.subtitle || ''}
                onChange={e => updateField('subtitle', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Hero subtitle text"
              />
            </div>

            {/* Color Pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={current.title_color || '#FFFFFF'}
                    onChange={e => updateField('title_color', e.target.value)}
                    className="w-10 h-10 rounded border border-gray-300 dark:border-gray-700 cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{current.title_color || '#FFFFFF'}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subtitle Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={current.subtitle_color || '#FFFFFF'}
                    onChange={e => updateField('subtitle_color', e.target.value)}
                    className="w-10 h-10 rounded border border-gray-300 dark:border-gray-700 cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{current.subtitle_color || '#FFFFFF'}</span>
                </div>
              </div>
            </div>

            {/* Text Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title Text Size
              </label>
              <select
                value={current.text_size}
                onChange={e => updateField('text_size', e.target.value as TextSizeType)}
                className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500"
              >
                {textSizeOptions.map(size => (
                  <option key={size} value={size}>
                    {size.replace('text-', '').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Alignments */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title Alignment
                </label>
                <select
                  value={current.title_alignment}
                  onChange={e => updateField('title_alignment', e.target.value as AlignmentType)}
                  className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500"
                >
                  {alignmentOptions.map(align => (
                    <option key={align} value={align}>{align.charAt(0).toUpperCase() + align.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subtitle Alignment
                </label>
                <select
                  value={current.subtitle_alignment}
                  onChange={e => updateField('subtitle_alignment', e.target.value as AlignmentType)}
                  className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500"
                >
                  {alignmentOptions.map(align => (
                    <option key={align} value={align}>{align.charAt(0).toUpperCase() + align.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vertical Position
              </label>
              <select
                value={current.vertical_position}
                onChange={e => updateField('vertical_position', e.target.value as VerticalPositionType)}
                className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500"
              >
                {verticalOptions.map(pos => (
                  <option key={pos} value={pos}>{pos.charAt(0).toUpperCase() + pos.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Button Settings */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Button Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Button Label</label>
                  <input
                    value={current.button_label || ''}
                    onChange={e => updateField('button_label', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2 text-sm"
                    placeholder="Shop Now"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Button Link</label>
                  <input
                    value={current.button_link || ''}
                    onChange={e => updateField('button_link', e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2 text-sm"
                    placeholder="/products"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Button Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={current.button_bg_color || '#F97316'}
                        onChange={e => updateField('button_bg_color', e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <span className="text-xs text-gray-500">{current.button_bg_color || '#F97316'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Button Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={current.button_text_color || '#FFFFFF'}
                        onChange={e => updateField('button_text_color', e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <span className="text-xs text-gray-500">{current.button_text_color || '#FFFFFF'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay Opacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Overlay Opacity: {current.overlay_opacity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={current.overlay_opacity}
                onChange={e => updateField('overlay_opacity', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Active Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={current.active}
                onChange={e => updateField('active', e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">Active (show this hero section)</label>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye size={16} className="text-orange-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Live Preview</h3>
            </div>
            <div className="relative w-full h-96 bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
              {current.images?.[0] && (
                <Image
                  src={current.images[0]}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              )}
              {/* Overlay */}
              <div
                className="absolute inset-0 bg-black"
                style={{ opacity: (current.overlay_opacity || 50) / 100 }}
              />
              {/* Text Content */}
              <div className={`absolute inset-0 flex flex-col p-6 ${getAlignmentClasses(current.title_alignment, current.vertical_position)}`}>
                <h2
                  className={`${current.text_size} font-bold drop-shadow-lg text-center`}
                  style={{
                    color: current.title_color,
                    textAlign: current.title_alignment,
                  }}
                >
                  {current.title || 'Your Title Here'}
                </h2>
                {current.subtitle && (
                  <p
                    className="text-sm md:text-base mt-2 drop-shadow-md"
                    style={{
                      color: current.subtitle_color,
                      textAlign: current.subtitle_alignment,
                    }}
                  >
                    {current.subtitle}
                  </p>
                )}
                {current.button_label && (
                  <button
                    className="mt-4 px-5 py-2 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition"
                    style={{
                      backgroundColor: current.button_bg_color || '#F97316',
                      color: current.button_text_color || '#FFFFFF',
                    }}
                  >
                    {current.button_label}
                  </button>
                )}
              </div>
              {/* No Image Placeholder */}
              {(!current.images || current.images.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon size={48} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No image uploaded</p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
              Preview shows first image only. Carousel behavior works on the actual site.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
