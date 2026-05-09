'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import Image from 'next/image';

export default function AdminContactPage() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'form' | 'grid' | 'details'>('hero');

  useEffect(() => {
    fetch('/api/admin/contact')
      .then(res => res.json())
      .then(data => {
        setContent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateField = (path: string[], value: any) => {
    setContent(prev => {
      const newContent = { ...prev };
      let cur = newContent;
      for (let i = 0; i < path.length - 1; i++) {
        if (!cur[path[i]]) cur[path[i]] = {};
        cur = cur[path[i]];
      }
      cur[path[path.length - 1]] = value;
      return newContent;
    });
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
  const updateGridItem = (idx: number, field: string, val: string) => {
    const grid = [...(content.feature_grid || [])];
    grid[idx][field] = val;
    updateField(['feature_grid'], grid);
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      alert('Saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Contact Page</h1>

      <div className="flex gap-2 mb-6 border-b">
        {['hero', 'form', 'grid', 'details'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium ${activeTab === tab ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'}`}
          >
            {tab === 'hero' ? 'Hero Section' : tab === 'form' ? 'Form Section' : tab === 'grid' ? 'Feature Grid' : 'Contact Details'}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl border">
        {/* Hero Tab */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            <div>
              <label className="block font-medium mb-2">Hero Mode</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" value="carousel" checked={content.hero?.mode === 'carousel'} onChange={() => updateField(['hero', 'mode'], 'carousel')} /> Carousel
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" value="single" checked={content.hero?.mode === 'single'} onChange={() => updateField(['hero', 'mode'], 'single')} /> Single Image
                </label>
              </div>
            </div>

            {content.hero?.mode === 'single' && (
              <div>
                <label className="block font-medium mb-2">Single Image</label>
                <div className="relative w-full max-w-md h-48 rounded-lg overflow-hidden border">
                  {content.hero?.single_image ? (
                    <Image src={content.hero.single_image} alt="Hero" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">No image</div>
                  )}
                  <button onClick={removeSingleImage} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"><X size={16} /></button>
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 mt-2 bg-gray-100 px-3 py-1 rounded">
                  <Upload size={14} /> {content.hero?.single_image ? 'Replace' : 'Upload'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleSingleUpload} />
                </label>
              </div>
            )}

            {content.hero?.mode === 'carousel' && (
              <div>
                <label className="block font-medium mb-2">Carousel Images</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {content.hero?.carousel_images?.map((url: string, idx: number) => (
                    <div key={idx} className="relative group border rounded-lg overflow-hidden">
                      <div className="relative h-32 w-full"><Image src={url} alt={`Slide ${idx+1}`} fill className="object-cover" /></div>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => moveCarouselImage(idx, 'up')} className="bg-black/50 p-1 rounded text-white">←</button>
                        <button onClick={() => moveCarouselImage(idx, 'down')} className="bg-black/50 p-1 rounded text-white">→</button>
                        <button onClick={() => removeCarouselImage(idx)} className="bg-red-600 p-1 rounded text-white">✕</button>
                      </div>
                    </div>
                  ))}
                  <label className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                    <Plus size={24} className="text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">Add Image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={addCarouselImage} disabled={uploadingImg} />
                  </label>
                </div>
                {uploadingImg && <Loader2 className="animate-spin mt-2" size={16} />}
              </div>
            )}

            <div><label>Hero Title</label><input value={content.hero?.title || ''} onChange={e => updateField(['hero', 'title'], e.target.value)} className="w-full border rounded p-2" /></div>
            <div><label>Hero Subtitle</label><input value={content.hero?.subtitle || ''} onChange={e => updateField(['hero', 'subtitle'], e.target.value)} className="w-full border rounded p-2" /></div>
            <div><label>Text Color</label><input type="color" value={content.hero?.text_color || '#F97316'} onChange={e => updateField(['hero', 'text_color'], e.target.value)} /></div>
          </div>
        )}

        {/* Form Tab */}
        {activeTab === 'form' && (
          <div className="space-y-4">
            <div><label>Form Title</label><input value={content.form_title || ''} onChange={e => updateField(['form_title'], e.target.value)} className="w-full border rounded p-2" /></div>
            <div><label>Form Subtitle</label><input value={content.form_subtitle || ''} onChange={e => updateField(['form_subtitle'], e.target.value)} className="w-full border rounded p-2" /></div>
          </div>
        )}

        {/* Feature Grid Tab */}
        {activeTab === 'grid' && (
          <div className="space-y-4">
            {content.feature_grid?.map((item: any, idx: number) => (
              <div key={idx} className="border rounded p-3 space-y-2">
                <input placeholder="Title" value={item.title} onChange={e => updateGridItem(idx, 'title', e.target.value)} className="w-full border rounded p-1" />
                <input placeholder="Description" value={item.description} onChange={e => updateGridItem(idx, 'description', e.target.value)} className="w-full border rounded p-1" />
                <input placeholder="Link URL" value={item.link} onChange={e => updateGridItem(idx, 'link', e.target.value)} className="w-full border rounded p-1" />
                <button onClick={() => removeGridItem(idx)} className="text-red-500 text-sm"><Trash2 size={16} /> Remove</button>
              </div>
            ))}
            <button onClick={addGridItem} className="text-orange-500 text-sm flex items-center gap-1"><Plus size={14} /> Add Feature</button>
          </div>
        )}

        {/* Contact Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div><label>Email</label><input value={content.contact_details?.email || ''} onChange={e => updateField(['contact_details', 'email'], e.target.value)} className="w-full border rounded p-2" /></div>
            <div><label>Phone</label><input value={content.contact_details?.phone || ''} onChange={e => updateField(['contact_details', 'phone'], e.target.value)} className="w-full border rounded p-2" /></div>
            <div><label>Address</label><input value={content.contact_details?.address || ''} onChange={e => updateField(['contact_details', 'address'], e.target.value)} className="w-full border rounded p-2" /></div>
            <div><label>WhatsApp Link (for community)</label><input value={content.contact_details?.whatsapp_link || ''} onChange={e => updateField(['contact_details', 'whatsapp_link'], e.target.value)} className="w-full border rounded p-2" /></div>
            <div><label>Instagram URL</label><input value={content.contact_details?.instagram || ''} onChange={e => updateField(['contact_details', 'instagram'], e.target.value)} className="w-full border rounded p-2" /></div>
            <div><label>Facebook URL</label><input value={content.contact_details?.facebook || ''} onChange={e => updateField(['contact_details', 'facebook'], e.target.value)} className="w-full border rounded p-2" /></div>
            <div><label>Twitter URL</label><input value={content.contact_details?.twitter || ''} onChange={e => updateField(['contact_details', 'twitter'], e.target.value)} className="w-full border rounded p-2" /></div>
            <div><label>Community Link (same as WhatsApp link)</label><input value={content.community_link || ''} onChange={e => updateField(['community_link'], e.target.value)} className="w-full border rounded p-2" /></div>
          </div>
        )}

        <button onClick={save} disabled={saving} className="mt-6 bg-orange-500 text-white px-6 py-2 rounded w-full disabled:opacity-50">
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
      }
