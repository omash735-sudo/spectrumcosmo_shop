'use client';

import { useEffect, useState } from 'react';
import { 
  Loader2, Plus, Edit, Trash2, GripVertical, Eye, EyeOff,
  AlertCircle, ChevronRight, Layout, Layers
} from 'lucide-react';
import ContentBlockModal from '@/components/admin/ContentBlockModal';
import toast from 'react-hot-toast';

interface ContentBlock {
  id: string;
  type: string;
  title: string;
  description: string;
  content: any;
  display_order: number;
  is_active: boolean;
}

// ===== SKELETON =====
function ContentBlocksSkeleton() {
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
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--background-secondary)] rounded w-1/4" />
                <div className="h-3 bg-[var(--background-secondary)] rounded w-1/2" />
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

export default function AdminContentBlocksPage() {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBlocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/content-blocks');
      if (!res.ok) throw new Error('Failed to fetch blocks');
      const data = await res.json();
      setBlocks(data);
    } catch (err) {
      console.error('Failed to fetch blocks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load blocks');
      toast.error('Failed to load content blocks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, moved);
    setBlocks(newBlocks);

    try {
      const orderedIds = newBlocks.map(b => b.id);
      const res = await fetch('/api/admin/content-blocks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error('Failed to reorder');
      toast.success('Blocks reordered successfully');
    } catch (err) {
      console.error('Failed to reorder:', err);
      toast.error('Failed to reorder blocks');
      await fetchBlocks(); // Revert on error
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/content-blocks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(`Block ${!currentActive ? 'activated' : 'deactivated'}`);
      await fetchBlocks();
    } catch (err) {
      console.error('Failed to toggle active:', err);
      toast.error('Failed to update block status');
    }
  };

  const deleteBlock = async (id: string) => {
    if (!confirm('Delete this block? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/content-blocks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Block deleted');
      await fetchBlocks();
    } catch (err) {
      console.error('Failed to delete block:', err);
      toast.error('Failed to delete block');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      newsletter: 'Newsletter',
      homepage_banner: 'Homepage Banner',
      featured_products: 'Featured Products',
      promo_banner: 'Promo Banner',
    };
    return labels[type] || type.replace(/_/g, ' ');
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      newsletter: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
      homepage_banner: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
      featured_products: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400',
      promo_banner: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
    };
    return colors[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
          <ContentBlocksSkeleton />
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
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Content Blocks</h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
              Manage newsletter and homepage content blocks
            </p>
          </div>
          <button
            onClick={() => { setEditingBlock(null); setModalOpen(true); }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-medium transition shadow-sm text-sm sm:text-base min-h-[44px]"
          >
            <Plus size={16} /> Add Block
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4 sm:mb-6">
            <div className="flex flex-wrap items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">Error: {error}</span>
              <button 
                onClick={fetchBlocks} 
                className="ml-auto text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Blocks Table */}
        <div className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
          {blocks.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Layout size={24} className="sm:w-7 sm:h-7 text-[var(--foreground-muted)] opacity-50" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-[var(--foreground)] mb-1">No content blocks</h3>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                Create your first content block to get started.
              </p>
              <button
                onClick={() => { setEditingBlock(null); setModalOpen(true); }}
                className="mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium"
              >
                Add your first block →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-[var(--background-secondary)] border-b border-[var(--border)]">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 w-8 sm:w-10"></th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Type</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Title</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider hidden sm:table-cell">Description</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {blocks.map((block, idx) => (
                    <tr 
                      key={block.id} 
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
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${getTypeColor(block.type)}`}>
                          {getTypeLabel(block.type)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <span className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                          {block.title}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                        <p className="text-xs text-[var(--foreground-muted)] line-clamp-1 max-w-[200px]">
                          {block.description || '—'}
                        </p>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <button 
                          onClick={() => toggleActive(block.id, block.is_active)} 
                          className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium transition min-h-[28px] ${
                            block.is_active 
                              ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {block.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => { setEditingBlock(block); setModalOpen(true); }} 
                            className="p-1.5 sm:p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="Edit block"
                          >
                            <Edit size={14} className="sm:w-4 sm:h-4" />
                          </button>
                          <button 
                            onClick={() => deleteBlock(block.id)} 
                            className="p-1.5 sm:p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="Delete block"
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
        {blocks.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
              Showing {blocks.length} block{blocks.length !== 1 ? 's' : ''}
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] opacity-70">
              Drag the grip icon to reorder blocks
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      <ContentBlockModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingBlock(null); }}
        onSaved={fetchBlocks}
        initialBlock={editingBlock}
      />
    </div>
  );
}
