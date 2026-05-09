'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, X, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import Image from 'next/image';

type HeroSection = {
  page: string;
  type: 'single' | 'carousel';
  images: string[];
  title: string;
  subtitle: string;
  text_color: string;        // legacy, we'll split into title_color and subtitle_color
  title_color?: string;
  subtitle_color?: string;
  text_size?: string;
  title_alignment?: string;   // 'left' | 'center' | 'right'
  subtitle_alignment?: string;
  vertical_position?: string; // 'top' | 'center' | 'bottom'
  button_label: string;
  button_link: string;
  button_placement?: string;
  button_bg_color?: string;
  button_text_color?: string;
  overlay_opacity?: number;
  active: boolean;
};

const pageOptions = ['home', 'products', 'reviews', 'about', 'contact'];
const pageNames: Record<string, string> = {
  home: 'Home Page',
  products: 'Products Page',
  reviews: 'Reviews Page',
  about: 'About Page',
  contact: 'Contact Page',
};

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
        data.forEach((s: HeroSection) => { map[s.page] = s; });
        setSections(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const current = sections[selectedPage] || {
    page: selectedPage,
    type: 'single',
    images: [],
    title: '',
    subtitle: '',
    title_color: '#FFFFFF',
    subtitle_color: '#FFFFFF',
    text_size: 'text-5xl',
    title_alignment: 'center',
    subtitle_alignment: 'center',
    vertical_position: 'bottom',
    button_label: '',
    button_link: '',
    button_bg_color: '#F97316',
    button_text_color: '#FFFFFF',
    overlay_opacity: 50,
    active: true,
  };

  const updateField = (field: keyof HeroSection, value: any) => {
    setSections(prev => ({
      ...prev,
      [selectedPage]: { ...prev[selectedPage], [field]: value }
    }));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'spectrumcosmo';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      return data.secure_url || null;
    } catch (err) {
      console.error('Upload failed', err);
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
    await fetch('/api/admin/hero', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(current),
    });
    setSaving(false);
    alert('Saved successfully!');
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Hero Section Editor</h1>

      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        {pageOptions.map(page => (
          <button
            key={page}
            onClick={() => setSelectedPage(page)}
            className={`px-4 py-2 rounded-full ${selectedPage === page ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}
          >
            {pageNames[page]}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-4 bg-white p-4 rounded-xl border">
          <div>
            <label className="block font-medium mb-1">Hero Mode</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2"><input type="radio" value="single" checked={current.type === 'single'} onChange={() => updateField('type', 'single')} /> Single Image</label>
              <label className="flex items-center gap-2"><input type="radio" value="carousel" checked={current.type === 'carousel'} onChange={() => updateField('type', 'carousel')} /> Carousel</label>
            </div>
          </div>

          <div>
            <label className="block font-medium mb-2">Images</label>
            <div className="flex flex-wrap gap-2">
              {current.images?.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded overflow-hidden border group">
                  <Image src={url} alt={`Slide ${idx+1}`} fill className="object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/50 p-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => moveImage(idx, 'up')} className="text-white text-xs">←</button>
                    <button onClick={() => moveImage(idx, 'down')} className="text-white text-xs">→</button>
                    <button onClick={() => removeImage(idx)} className="text-red-400 text-xs">✕</button>
                  </div>
                </div>
              ))}
              <label className="w-20 h-20 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-xs">
                <Plus size={16} /> Add
                <input type="file" accept="image/*" className="hidden" onChange={current.type === 'single' ? handleSingleUpload : addCarouselImage} />
              </label>
            </div>
            {uploading && <Loader2 className="animate-spin mt-1" size={16} />}
          </div>

          <div><label>Title</label><input value={current.title || ''} onChange={e => updateField('title', e.target.value)} className="w-full border rounded p-1" /></div>
          <div><label>Subtitle</label><input value={current.subtitle || ''} onChange={e => updateField('subtitle', e.target.value)} className="w-full border rounded p-1" /></div>

          <div className="grid grid-cols-2 gap-2">
            <div><label>Title Color</label><input type="color" value={current.title_color || '#FFFFFF'} onChange={e => updateField('title_color', e.target.value)} /></div>
            <div><label>Subtitle Color</label><input type="color" value={current.subtitle_color || '#FFFFFF'} onChange={e => updateField('subtitle_color', e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label>Title Alignment</label>
              <select value={current.title_alignment} onChange={e => updateField('title_alignment', e.target.value)} className="border rounded p-1 w-full">
                <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
              </select>
            </div>
            <div>
              <label>Subtitle Alignment</label>
              <select value={current.subtitle_alignment} onChange={e => updateField('subtitle_alignment', e.target.value)} className="border rounded p-1 w-full">
                <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
              </select>
            </div>
          </div>

          <div>
            <label>Vertical Position</label>
            <select value={current.vertical_position} onChange={e => updateField('vertical_position', e.target.value)} className="border rounded p-1 w-full">
              <option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option>
            </select>
          </div>

          <div><label>Button Label</label><input value={current.button_label || ''} onChange={e => updateField('button_label', e.target.value)} className="w-full border rounded p-1" /></div>
          <div><label>Button Link</label><input value={current.button_link || ''} onChange={e => updateField('button_link', e.target.value)} className="w-full border rounded p-1" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label>Button Background</label><input type="color" value={current.button_bg_color || '#F97316'} onChange={e => updateField('button_bg_color', e.target.value)} /></div>
            <div><label>Button Text Color</label><input type="color" value={current.button_text_color || '#FFFFFF'} onChange={e => updateField('button_text_color', e.target.value)} /></div>
          </div>
          <div><label>Overlay Opacity ({current.overlay_opacity}%)</label><input type="range" min="0" max="100" value={current.overlay_opacity} onChange={e => updateField('overlay_opacity', parseInt(e.target.value))} /></div>
          <div><label><input type="checkbox" checked={current.active} onChange={e => updateField('active', e.target.checked)} /> Active</label></div>

          <button onClick={save} disabled={saving} className="bg-orange-500 text-white px-4 py-2 rounded w-full">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>

        {/* Live Preview */}
        <div>
          <h3 className="font-semibold mb-2">Live Preview</h3>
          <div className="relative w-full h-64 bg-gray-200 rounded overflow-hidden">
            {current.images?.[0] && (
              <Image src={current.images[0]} alt="Preview" fill className="object-cover" />
            )}
            <div className="absolute inset-0 bg-black" style={{ opacity: (current.overlay_opacity || 50) / 100 }} />
            <div className={`absolute inset-0 flex flex-col items-${current.title_alignment} justify-${current.vertical_position} p-4`}>
              <h2 className={`${current.text_size} font-bold drop-shadow-lg`} style={{ color: current.title_color, textAlign: current.title_alignment }}>
                {current.title || 'Title'}
              </h2>
              {current.subtitle && <p style={{ color: current.subtitle_color, textAlign: current.subtitle_alignment }}>{current.subtitle}</p>}
              {current.button_label && (
                <button className="mt-2 px-3 py-1 rounded-full text-sm" style={{ backgroundColor: current.button_bg_color, color: current.button_text_color }}>
                  {current.button_label}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  }
