'use client';

import { useEffect, useState } from 'react';
import { 
  Loader2, Plus, Edit, Trash2, GripVertical, Eye, EyeOff, Upload,
  AlertCircle, Image as ImageIcon, Heart, Sparkles, ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
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

// ===== SKELETON =====
function InspirationSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-64 mt-1" />
        </div>
        <div className="h-10 bg-[var(--background-secondary)] rounded w-32" />
      </div>
      <div className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-6 h-6 bg-[var(--background-secondary)] rounded" />
              <div className="w-16 h-12 bg-[var(--background-secondary)] rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--background-secondary)] rounded w-1/4" />
                <div className="h-3 bg-[var(--background-secondary)] rounded w-1/3" />
              </div>
              <div className="h-6 bg-[var(--background-secondary)] rounded w-16" />
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-[var(--background-secondary)] rounded" />
                <div className="h-8 w-8 bg-[var(--background-secondary)] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminInspirationPage() {
  const [images, setImages] = useState<InspirationImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<InspirationImage | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/inspiration-images');
      if (!res.ok) throw new Error('Failed to fetch images');
      const data = await res.json();
      setImages(data);
    } catch (err) {
      console.error('Failed to fetch images:', err);
      setError(err instanceof Error ? err.message : 'Failed to load images');
      toast.error('Failed to load inspiration images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newImages = [...images];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    setImages(newImages);

    try {
      const orderedIds = newImages.map(img => img.id);
      const res = await fetch('/api/admin/inspiration-images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error('Failed to reorder');
      toast.success('Images reordered successfully');
    } catch (err) {
      console.error('Failed to reorder:', err);
      toast.error('Failed to reorder images');
      await fetchImages();
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/inspiration-images', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentActive }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(`Image ${!currentActive ? 'activated' : 'deactivated'}`);
      await fetchImages();
    } catch (err) {
      console.error('Failed to toggle active:', err);
      toast.error('Failed to update image status');
    }
  };

  const deleteImage = async (id: string) => {
    if (!confirm('Delete this image? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/inspiration-images?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Image deleted');
      await fetchImages();
    } catch (err) {
      console.error('Failed to delete image:', err);
      toast.error('Failed to delete image');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
          <InspirationSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Inspiration Gallery</h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
              Manage inspiration images for the gallery block
            </p>
          </div>
          <button
            onClick={() => { setEditingImage(null); setModalOpen(true); }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-medium transition shadow-sm text-sm sm:text-base min-h-[44px]"
          >
            <Plus size={16} /> Add Image
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4 sm:mb-6">
            <div className="flex flex-wrap items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">Error: {error}</span>
              <button 
                onClick={fetchImages} 
                className="ml-auto text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Images Table */}
        <div className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
          {images.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon size={24} className="sm:w-7 sm:h-7 text-[var(--foreground-muted)] opacity-50" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-[var(--foreground)] mb-1">No images yet</h3>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                Add inspiration images to showcase your gallery.
              </p>
              <button
                onClick={() => { setEditingImage(null); setModalOpen(true); }}
                className="mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium"
              >
                Add your first image →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-[var(--background-secondary)] border-b border-[var(--border)]">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 w-8 sm:w-10"></th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Image</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider hidden sm:table-cell">Title</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider hidden md:table-cell">Likes</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {images.map((img, idx) => (
                    <tr 
                      key={img.id} 
                      className="hover:bg-[var(--background-secondary)] transition group"
                      draggable 
                      onDragStart={() => setDraggedIndex(idx)} 
                      onDragOver={(e) => e.preventDefault()} 
                      onDrop={() => { if (draggedIndex !== null) handleReorder(draggedIndex, idx); }}
                    >
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <GripVertical size={14} className="sm:w-4 sm:h-4 text-[var(--foreground-muted)] opacity-40 cursor-grab group-hover:opacity-100 transition" />
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <div className="relative w-14 h-10 sm:w-16 sm:h-12 rounded-lg overflow-hidden bg-[var(--background-secondary)] border border-[var(--border)]">
                          {img.image_url ? (
                            <Image src={img.image_url} alt={img.title || 'Inspiration'} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon size={14} className="sm:w-4 sm:h-4 text-[var(--foreground-muted)] opacity-30" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                        <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] truncate block max-w-[120px] sm:max-w-[200px]">
                          {img.title || '—'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 text-xs sm:text-sm text-[var(--foreground-muted)]">
                          <Heart size={12} className="text-red-400" /> {img.like_count || 0}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <button 
                          onClick={() => toggleActive(img.id, img.is_active)} 
                          className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium transition min-h-[28px] ${
                            img.is_active 
                              ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {img.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => { setEditingImage(img); setModalOpen(true); }} 
                            className="p-1.5 sm:p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="Edit image"
                          >
                            <Edit size={14} className="sm:w-4 sm:h-4" />
                          </button>
                          <button 
                            onClick={() => deleteImage(img.id)} 
                            className="p-1.5 sm:p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="Delete image"
                          >
                            <Trash2 size={14} className="sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {images.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
              Showing {images.length} image{images.length !== 1 ? 's' : ''}
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] opacity-70">
              Drag the grip icon to reorder images
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      <InspirationImageModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingImage(null); }}
        onSaved={fetchImages}
        initialImage={editingImage}
      />
    </div>
  );
}
