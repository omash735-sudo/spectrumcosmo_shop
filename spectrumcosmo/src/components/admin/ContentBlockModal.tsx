'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import Image from 'next/image';

interface ContentBlockModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialBlock: any;
}

const blockTypes = [
  { value: 'product_carousel', label: 'Product Carousel' },
  { value: 'static_card', label: 'Static Card' },
  { value: 'image_text', label: 'Image + Text' },
  { value: 'announcement', label: 'Announcement Banner' },
  { value: 'trending_requests', label: 'Trending Requests' },
];

export default function ContentBlockModal({ open, onClose, onSaved, initialBlock }: ContentBlockModalProps) {
  const [type, setType] = useState('static_card');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initialBlock) {
      setType(initialBlock.type);
      setTitle(initialBlock.title);
      setDescription(initialBlock.description || '');
      setContent(initialBlock.content || {});
    } else {
      setType('static_card');
      setTitle('');
      setDescription('');
      setContent({});
    }
  }, [initialBlock, open]);

  const uploadImage = async (file: File, field: string) => {
    setUploading(true);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'spectrumcosmo';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.secure_url) setContent(prev => ({ ...prev, [field]: data.secure_url }));
    setUploading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const url = initialBlock ? `/api/admin/content-blocks/${initialBlock.id}` : '/api/admin/content-blocks';
    const method = initialBlock ? 'PATCH' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, title, description, content, is_active: true }),
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
          <h2 className="text-xl font-bold">{initialBlock ? 'Edit' : 'Add'} Content Block</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Block Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border rounded-xl px-4 py-2">
              {blockTypes.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded-xl px-4 py-2" required /></div>
          <div><label className="block text-sm font-medium mb-1">Description (optional)</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full border rounded-xl px-4 py-2" /></div>

          {type === 'static_card' && (
            <>
              <div><label className="block text-sm font-medium mb-1">Image URL</label><input value={content.image_url || ''} onChange={(e) => setContent({ ...content, image_url: e.target.value })} className="w-full border rounded-xl px-4 py-2" placeholder="https://..." /></div>
              <div><label className="block text-sm font-medium mb-1">Button Text</label><input value={content.button_text || ''} onChange={(e) => setContent({ ...content, button_text: e.target.value })} className="w-full border rounded-xl px-4 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Button Link</label><input value={content.button_link || ''} onChange={(e) => setContent({ ...content, button_link: e.target.value })} className="w-full border rounded-xl px-4 py-2" placeholder="/products" /></div>
            </>
          )}

          {type === 'image_text' && (
            <>
              <div><label className="block text-sm font-medium mb-1">Image URL</label><input value={content.image_url || ''} onChange={(e) => setContent({ ...content, image_url: e.target.value })} className="w-full border rounded-xl px-4 py-2" /></div>
              <div><label>Image Position</label><select value={content.image_position || 'left'} onChange={(e) => setContent({ ...content, image_position: e.target.value })} className="w-full border rounded-xl px-4 py-2"><option>left</option><option>right</option></select></div>
              <div><label>Text Alignment</label><select value={content.text_alignment || 'center'} onChange={(e) => setContent({ ...content, text_alignment: e.target.value })} className="w-full border rounded-xl px-4 py-2"><option>left</option><option>center</option><option>right</option></select></div>
              <div><label>Button Text</label><input value={content.button_text || ''} onChange={(e) => setContent({ ...content, button_text: e.target.value })} className="w-full border rounded-xl px-4 py-2" /></div>
              <div><label>Button Link</label><input value={content.button_link || ''} onChange={(e) => setContent({ ...content, button_link: e.target.value })} className="w-full border rounded-xl px-4 py-2" /></div>
            </>
          )}

          {type === 'announcement' && (
            <>
              <div><label>Badge Text</label><input value={content.badge_text || ''} onChange={(e) => setContent({ ...content, badge_text: e.target.value })} className="w-full border rounded-xl px-4 py-2" /></div>
              <div><label>Icon</label><select value={content.icon || 'Bell'} onChange={(e) => setContent({ ...content, icon: e.target.value })} className="w-full border rounded-xl px-4 py-2"><option>Bell</option><option>Tag</option><option>Zap</option><option>Star</option></select></div>
            </>
          )}

          {type === 'product_carousel' && (
            <>
              <div><label>Product IDs (comma separated, optional)</label><input value={content.product_ids?.join(',') || ''} onChange={(e) => setContent({ ...content, product_ids: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full border rounded-xl px-4 py-2" placeholder="id1, id2, id3" /></div>
              <div><label className="flex items-center gap-2"><input type="checkbox" checked={content.autoplay !== false} onChange={(e) => setContent({ ...content, autoplay: e.target.checked })} /> Enable Autoplay</label></div>
            </>
          )}

          <button onClick={handleSubmit} disabled={loading} className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50">
            {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : (initialBlock ? 'Update Block' : 'Create Block')}
          </button>
        </div>
      </div>
    </div>
  );
}
