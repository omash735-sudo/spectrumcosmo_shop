'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import HeroCarousel from '@/components/storefront/HeroCarousel';

type HeroSection = {
  page: string;
  type: 'single' | 'carousel';
  images: string[];
  title: string;
  subtitle: string;
  text_color: string;
  text_size: string;
  text_alignment: 'left' | 'center' | 'right';
  vertical_position: 'top' | 'middle' | 'bottom';
  button_label: string;
  button_link: string;
  button_placement: 'left' | 'center' | 'right';
  overlay_opacity: number;
  active: boolean;
};

const pageNames: Record<string, string> = {
  home: 'Home Page',
  products: 'Products Page',
  reviews: 'Reviews Page',
  about: 'About Page',
  contact: 'Contact Page',
};

const textSizeOptions = [
  { label: 'Small', class: 'text-3xl' },
  { label: 'Medium', class: 'text-4xl' },
  { label: 'Large', class: 'text-5xl' },
  { label: 'Extra Large', class: 'text-6xl' },
];

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
    text_color: '#FFFFFF',
    text_size: 'text-5xl',
    text_alignment: 'center',
    vertical_position: 'bottom',
    button_label: '',
    button_link: '',
    button_placement: 'center',
    overlay_opacity: 50,
    active: true,
  };

  const updateField = (field: string, value: any) => {
    setSections(prev => ({
      ...prev,
      [selectedPage]: { ...prev[selectedPage], [field]: value }
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'spectrumcosmo';
    const newUrls = [...current.images];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) newUrls.push(data.secure_url);
    }
    updateField('images', newUrls);
    setUploading(false);
  };

  const removeImage = (index: number) => {
    const newImages = [...current.images];
    newImages.splice(index, 1);
    updateField('images', newImages);
  };

  const save = async () => {
    setSaving(true);
    await fetch('/api/admin/hero', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(current),
    });
    setSaving(false);
    alert('Saved!');
  };

  // Preview component
  const Preview = () => {
    const slides = current.images.map((url, idx) => ({
      id: idx,
      image: url,
      title: current.title || 'Preview Title',
      subtitle: current.subtitle || 'Preview subtitle',
    }));

    if (current.type === 'carousel' && slides.length > 1) {
      return <HeroCarousel slides={slides} textColor={current.text_color} autoplayDelay={5000} />;
    }
    const img = current.images[0];
    if (!img) return <div className="bg-gray-200 h-64 flex items-center justify-center rounded-xl">No image selected</div>;
    return (
      <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-xl">
        <Image src={img} alt="Preview" fill className="object-cover" />
        <div className="absolute inset-0 bg-black" style={{ opacity: current.overlay_opacity / 100 }} />
        <div className={`absolute inset-0 flex flex-col items-${current.button_placement} justify-${current.vertical_position} p-6`}>
          <h2 className={`${current.text_size} font-bold drop-shadow-lg`} style={{ color: current.text_color, textAlign: current.text_alignment }}>
            {current.title || 'Title'}
          </h2>
          {current.subtitle && <p className="text-white text-lg mt-2">{current.subtitle}</p>}
          {current.button_label && (
            <button className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-full">{current.button_label}</button>
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Hero Section Editor</h1>

      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        {Object.keys(pageNames).map(page => (
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
            <label className="block font-medium mb-1">Type</label>
            <select value={current.type} onChange={e => updateField('type', e.target.value)} className="border rounded p-1 w-full">
              <option value="single">Single Image</option>
              <option value="carousel">Carousel (Multiple Images)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Images</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {current.images.map((url, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded overflow-hidden border">
                  <Image src={url} alt="preview" fill className="object-cover" />
                  <button onClick={() => removeImage(idx)} className="absolute top-0 right-0 bg-black/50 text-white rounded-bl p-0.5"><X size={12} /></button>
                </div>
              ))}
              <label className="w-16 h-16 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-gray-50">
                <Plus size={20} />
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            {uploading && <Loader2 className="animate-spin mt-1" size={16} />}
          </div>

          <div><label className="block font-medium">Title</label><input value={current.title || ''} onChange={e => updateField('title', e.target.value)} className="w-full border rounded p-1" /></div>
          <div><label className="block font-medium">Subtitle</label><input value={current.subtitle || ''} onChange={e => updateField('subtitle', e.target.value)} className="w-full border rounded p-1" /></div>
          <div><label className="block font-medium">Text Color</label><input type="color" value={current.text_color} onChange={e => updateField('text_color', e.target.value)} /></div>
          <div><label className="block font-medium">Text Size</label><select value={current.text_size} onChange={e => updateField('text_size', e.target.value)} className="border rounded p-1 w-full">{textSizeOptions.map(opt => <option key={opt.class} value={opt.class}>{opt.label}</option>)}</select></div>
          <div><label className="block font-medium">Text Alignment</label><select value={current.text_alignment} onChange={e => updateField('text_alignment', e.target.value)} className="border rounded p-1 w-full"><option>left</option><option>center</option><option>right</option></select></div>
          <div><label className="block font-medium">Vertical Position</label><select value={current.vertical_position} onChange={e => updateField('vertical_position', e.target.value)} className="border rounded p-1 w-full"><option>top</option><option>middle</option><option>bottom</option></select></div>
          <div><label className="block font-medium">Button Label</label><input value={current.button_label || ''} onChange={e => updateField('button_label', e.target.value)} className="w-full border rounded p-1" /></div>
          <div><label className="block font-medium">Button Link</label><input value={current.button_link || ''} onChange={e => updateField('button_link', e.target.value)} className="w-full border rounded p-1" /></div>
          <div><label className="block font-medium">Button Placement</label><select value={current.button_placement} onChange={e => updateField('button_placement', e.target.value)} className="border rounded p-1 w-full"><option>left</option><option>center</option><option>right</option></select></div>
          <div><label className="block font-medium">Overlay Opacity ({current.overlay_opacity}%)</label><input type="range" min="0" max="100" value={current.overlay_opacity} onChange={e => updateField('overlay_opacity', parseInt(e.target.value))} className="w-full" /></div>
          <div><label className="flex items-center gap-2"><input type="checkbox" checked={current.active} onChange={e => updateField('active', e.target.checked)} /> Active</label></div>

          <button onClick={save} disabled={saving} className="bg-orange-500 text-white px-4 py-2 rounded w-full">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>

        {/* Live Preview */}
        <div>
          <h3 className="font-semibold mb-2">Live Preview</h3>
          <Preview />
        </div>
      </div>
    </div>
  );
}
