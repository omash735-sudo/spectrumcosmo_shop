'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles, Shield, Truck } from 'lucide-react';
import Image from 'next/image';

type HeroData = {
  page: string;
  active: boolean;
  badge_text: string;
  badge_link: string;
  heading_prefix: string;
  highlighted_word: string;
  description: string;
  button1_text: string;
  button1_link: string;
  button2_text: string;
  button2_link: string;
  feature1: string;
  feature2: string;
  feature3: string;
  cat_image1_url: string;
  cat_image1_alt: string;
  cat_image2_url: string;
  cat_image2_alt: string;
  cat_image3_url: string;
  cat_image3_alt: string;
  cat_image4_url: string;
  cat_image4_alt: string;
};

export default function AdminHeroPage() {
  const [data, setData] = useState<HeroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/hero')
      .then(res => res.json())
      .then((items) => {
        const home = items.find((i: any) => i.page === 'home');
        if (home) setData(home);
        else setData(null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateField = (field: keyof HeroData, value: any) => {
    if (data) setData({ ...data, [field]: value });
  };

  const uploadImage = async (file: File, field: keyof HeroData) => {
    setUploading(true);
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
      const json = await res.json();
      if (json.secure_url) updateField(field, json.secure_url);
    } catch (err) {
      console.error('Upload failed');
    }
    setUploading(false);
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    await fetch('/api/admin/hero', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, active: true }),
    });
    setSaving(false);
    alert('Saved successfully!');
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;
  if (!data) return <div className="p-6">No data found for home page.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Home Page Hero Editor</h1>
      <p className="text-gray-500 mb-6">Edit the text and images of your main hero section. The layout remains unchanged.</p>

      <div className="space-y-6 bg-white p-6 rounded-xl border">
        {/* Badge */}
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="block font-medium mb-1">Badge Text</label><input value={data.badge_text || ''} onChange={e => updateField('badge_text', e.target.value)} className="w-full border rounded p-2" /></div>
          <div><label className="block font-medium mb-1">Badge Link</label><input value={data.badge_link || ''} onChange={e => updateField('badge_link', e.target.value)} className="w-full border rounded p-2" /></div>
        </div>

        {/* Heading */}
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="block font-medium mb-1">Heading Prefix (e.g., "Wear your")</label><input value={data.heading_prefix || ''} onChange={e => updateField('heading_prefix', e.target.value)} className="w-full border rounded p-2" /></div>
          <div><label className="block font-medium mb-1">Highlighted Word (e.g., "excitement")</label><input value={data.highlighted_word || ''} onChange={e => updateField('highlighted_word', e.target.value)} className="w-full border rounded p-2" /></div>
        </div>

        {/* Description */}
        <div><label className="block font-medium mb-1">Description</label><textarea value={data.description || ''} onChange={e => updateField('description', e.target.value)} rows={3} className="w-full border rounded p-2" /></div>

        {/* Buttons */}
        <div className="grid md:grid-cols-2 gap-4">
          <div><label>Button 1 Text</label><input value={data.button1_text || ''} onChange={e => updateField('button1_text', e.target.value)} className="w-full border rounded p-2" /></div>
          <div><label>Button 1 Link</label><input value={data.button1_link || ''} onChange={e => updateField('button1_link', e.target.value)} className="w-full border rounded p-2" /></div>
          <div><label>Button 2 Text</label><input value={data.button2_text || ''} onChange={e => updateField('button2_text', e.target.value)} className="w-full border rounded p-2" /></div>
          <div><label>Button 2 Link</label><input value={data.button2_link || ''} onChange={e => updateField('button2_link', e.target.value)} className="w-full border rounded p-2" /></div>
        </div>

        {/* Features (three) */}
        <div className="grid md:grid-cols-3 gap-4">
          <div><label>Feature 1</label><input value={data.feature1 || ''} onChange={e => updateField('feature1', e.target.value)} className="w-full border rounded p-2" /></div>
          <div><label>Feature 2</label><input value={data.feature2 || ''} onChange={e => updateField('feature2', e.target.value)} className="w-full border rounded p-2" /></div>
          <div><label>Feature 3</label><input value={data.feature3 || ''} onChange={e => updateField('feature3', e.target.value)} className="w-full border rounded p-2" /></div>
        </div>

        {/* Category Images (4) */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Category Images (Right Side Grid)</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[1,2,3,4].map(i => {
              const urlField = `cat_image${i}_url` as keyof HeroData;
              const altField = `cat_image${i}_alt` as keyof HeroData;
              return (
                <div key={i} className="space-y-2">
                  <div className="relative w-32 h-32 bg-gray-100 rounded overflow-hidden">
                    {data[urlField] ? (
                      <Image src={data[urlField] as string} alt={data[altField] as string || ''} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                    )}
                    {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
                  </div>
                  <input type="file" accept="image/*" onChange={async (e) => { if (e.target.files?.[0]) await uploadImage(e.target.files[0], urlField); }} className="text-sm" />
                  <input placeholder="Alt text" value={data[altField] || ''} onChange={e => updateField(altField, e.target.value)} className="w-full border rounded p-1 text-sm" />
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={save} disabled={saving} className="bg-orange-500 text-white px-6 py-2 rounded-lg w-full">{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>
    </div>
  );
}
