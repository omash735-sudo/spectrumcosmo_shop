'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import Image from 'next/image';

interface HeroSlideModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialSlide: any;
}

export default function HeroSlideModal({ open, onClose, onSaved, initialSlide }: HeroSlideModalProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [autoplayDelay, setAutoplayDelay] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initialSlide) {
      setImageUrl(initialSlide.image_url || '');
      setTitle(initialSlide.title || '');
      setDescription(initialSlide.description || '');
      setButtonText(initialSlide.button_text || '');
      setButtonLink(initialSlide.button_link || '');
      setIsActive(initialSlide.is_active ?? true);
      setAutoplayDelay(initialSlide.autoplay_delay || 5000);
    } else {
      setImageUrl('');
      setTitle('');
      setDescription('');
      setButtonText('');
      setButtonLink('');
      setIsActive(true);
      setAutoplayDelay(5000);
    }
  }, [initialSlide, open]);

  const uploadImage = async (file: File) => {
    setUploading(true);
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
    if (data.secure_url) setImageUrl(data.secure_url);
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      alert('Please upload an image');
      return;
    }

    setLoading(true);
    const url = initialSlide ? `/api/admin/hero-slides` : '/api/admin/hero-slides';
    const method = initialSlide ? 'PATCH' : 'POST';
    const body = initialSlide
      ? { id: initialSlide.id, image_url: imageUrl, title, description, button_text: buttonText, button_link: buttonLink, is_active: isActive, autoplay_delay: autoplayDelay }
      : { image_url: imageUrl, title, description, button_text: buttonText, button_link: buttonLink, is_active: isActive, autoplay_delay: autoplayDelay };

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);
    onSaved();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{initialSlide ? 'Edit' : 'Add'} Hero Slide</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Image *</label>
            <div className="flex gap-4 items-start">
              {imageUrl && (
                <div className="relative w-32 h-24 rounded-lg overflow-hidden border">
                  <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                </div>
              )}
              <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition">
                <Upload size={16} />
                {imageUrl ? 'Replace Image' : 'Upload Image'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadImage(e.target.files[0]); }} />
              </label>
              {uploading && <Loader2 className="animate-spin text-orange-500" size={20} />}
            </div>
          </div>

          <div><label className="block text-sm font-medium mb-1">Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded-xl px-4 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full border rounded-xl px-4 py-2" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Button Text</label><input value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="w-full border rounded-xl px-4 py-2" placeholder="Shop Now" /></div>
            <div><label className="block text-sm font-medium mb-1">Button Link</label><input value={buttonLink} onChange={(e) => setButtonLink(e.target.value)} className="w-full border rounded-xl px-4 py-2" placeholder="/products" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Autoplay Delay (ms)</label><input type="number" value={autoplayDelay} onChange={(e) => setAutoplayDelay(parseInt(e.target.value))} className="w-full border rounded-xl px-4 py-2" /></div>
            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4" />
                <span className="text-sm">Active</span>
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading || uploading} className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50">
            {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : (initialSlide ? 'Update Slide' : 'Create Slide')}
          </button>
        </form>
      </div>
    </div>
  );
}
