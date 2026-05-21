'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Edit, Trash2, GripVertical, Eye, EyeOff, Upload } from 'lucide-react';
import Image from 'next/image';
import InspirationImageModal from '@/components/admin/InspirationImageModal';

interface InspirationImage {
  id: string;
  image_url: string;
  title: string;
  description: string;
  display_order: number;
  is_active: boolean;
  like_count: number;
}

export default function AdminInspirationPage() {
  const [images, setImages] = useState<InspirationImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<InspirationImage | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const fetchImages = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/inspiration-images');
    const data = await res.json();
    setImages(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    setImages(newImages);

    const orderedIds = newImages.map(img => img.id);
    await fetch('/api/admin/inspiration-images', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    });
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await fetch('/api/admin/inspiration-images', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !currentActive }),
    });
    fetchImages();
  };

  const deleteImage = async (id: string) => {
    if (!confirm('Delete this image?')) return;
    await fetch(`/api/admin/inspiration-images?id=${id}`, { method: 'DELETE' });
    fetchImages();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" size={32} /></div>;

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspiration Gallery</h1>
          <p className="text-gray-500 text-sm mt-1">Manage inspiration images for the gallery block</p>
        </div>
        <button
          onClick={() => { setEditingImage(null); setModalOpen(true); }}
          className="bg-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <Plus size={16} /> Add Image
        </button>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Image</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Likes</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {images.map((img, idx) => (
                <tr key={img.id} className="hover:bg-gray-50" draggable onDragStart={() => setDraggedIndex(idx)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (draggedIndex !== null) handleReorder(draggedIndex, idx); }}>
                  <td className="px-4 py-3"><GripVertical size={16} className="text-gray-400 cursor-grab" /></td>
                  <td className="px-4 py-3">
                    <div className="relative w-16 h-12 rounded overflow-hidden bg-gray-100">
                      <Image src={img.image_url} alt={img.title || 'Inspiration'} fill className="object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{img.title || '—'}</td>
                  <td className="px-4 py-3 text-sm">{img.like_count}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(img.id, img.is_active)} className={`px-2 py-1 rounded-full text-xs font-medium ${img.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {img.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => { setEditingImage(img); setModalOpen(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                    <button onClick={() => deleteImage(img.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {images.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No images yet. Click "Add Image" to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InspirationImageModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingImage(null); }}
        onSaved={fetchImages}
        initialImage={editingImage}
      />
    </div>
  );
}
