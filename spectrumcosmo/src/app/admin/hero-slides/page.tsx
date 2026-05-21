'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Edit, Trash2, GripVertical, Eye, EyeOff, Upload } from 'lucide-react';
import Image from 'next/image';
import HeroSlideModal from '@/components/admin/HeroSlideModal';

interface HeroSlide {
  id: string;
  image_url: string;
  title: string;
  description: string;
  button_text: string;
  button_link: string;
  display_order: number;
  is_active: boolean;
  autoplay_delay: number;
}

export default function AdminHeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const fetchSlides = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/hero-slides');
    const data = await res.json();
    setSlides(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const newSlides = [...slides];
    const [moved] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, moved);
    setSlides(newSlides);

    const orderedIds = newSlides.map(s => s.id);
    await fetch('/api/admin/hero-slides', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    });
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await fetch('/api/admin/hero-slides', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !currentActive }),
    });
    fetchSlides();
  };

  const deleteSlide = async (id: string) => {
    if (!confirm('Delete this slide?')) return;
    await fetch(`/api/admin/hero-slides?id=${id}`, { method: 'DELETE' });
    fetchSlides();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" size={32} /></div>;

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hero Slides</h1>
          <p className="text-gray-500 text-sm mt-1">Manage homepage carousel slides</p>
        </div>
        <button
          onClick={() => { setEditingSlide(null); setModalOpen(true); }}
          className="bg-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <Plus size={16} /> Add Slide
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Button</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {slides.map((slide, idx) => (
                <tr key={slide.id} className="hover:bg-gray-50" draggable onDragStart={() => setDraggedIndex(idx)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (draggedIndex !== null) handleReorder(draggedIndex, idx); }}>
                  <td className="px-4 py-3"><GripVertical size={16} className="text-gray-400 cursor-grab" /></td>
                  <td className="px-4 py-3">
                    <div className="relative w-16 h-12 rounded overflow-hidden bg-gray-100">
                      <Image src={slide.image_url} alt={slide.title || 'Slide'} fill className="object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{slide.title || '—'}</td>
                  <td className="px-4 py-3 text-sm">{slide.button_text || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(slide.id, slide.is_active)} className={`px-2 py-1 rounded-full text-xs font-medium ${slide.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {slide.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => { setEditingSlide(slide); setModalOpen(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                    <button onClick={() => deleteSlide(slide.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {slides.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No slides yet. Click "Add Slide" to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <HeroSlideModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingSlide(null); }}
        onSaved={fetchSlides}
        initialSlide={editingSlide}
      />
    </div>
  );
}
