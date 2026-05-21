'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Edit, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import ContentBlockModal from '@/components/admin/ContentBlockModal';

interface ContentBlock {
  id: string;
  type: string;
  title: string;
  description: string;
  content: any;
  display_order: number;
  is_active: boolean;
}

export default function AdminContentBlocksPage() {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const fetchBlocks = async () => {
    const res = await fetch('/api/admin/content-blocks');
    const data = await res.json();
    setBlocks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, moved);
    setBlocks(newBlocks);

    const orderedIds = newBlocks.map(b => b.id);
    await fetch('/api/admin/content-blocks/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    });
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await fetch(`/api/admin/content-blocks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !currentActive }),
    });
    fetchBlocks();
  };

  const deleteBlock = async (id: string) => {
    if (!confirm('Delete this block?')) return;
    await fetch(`/api/admin/content-blocks/${id}`, { method: 'DELETE' });
    fetchBlocks();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" size={32} /></div>;

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Blocks</h1>
          <p className="text-gray-500 text-sm mt-1">Manage newsletter and homepage content blocks</p>
        </div>
        <button
          onClick={() => { setEditingBlock(null); setModalOpen(true); }}
          className="bg-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <Plus size={16} /> Add Block
        </button>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {blocks.map((block, idx) => (
                <tr key={block.id} className="hover:bg-gray-50" draggable onDragStart={() => setDraggedIndex(idx)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (draggedIndex !== null) handleReorder(draggedIndex, idx); }}>
                  <td className="px-4 py-3"><GripVertical size={16} className="text-gray-400 cursor-grab" /></td>
                  <td className="px-4 py-3 capitalize">{block.type.replace('_', ' ')}</td>
                  <td className="px-4 py-3 font-medium">{block.title}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(block.id, block.is_active)} className={`px-2 py-1 rounded-full text-xs font-medium ${block.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {block.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => { setEditingBlock(block); setModalOpen(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                    <button onClick={() => deleteBlock(block.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ContentBlockModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingBlock(null); }}
        onSaved={fetchBlocks}
        initialBlock={editingBlock}
      />
    </div>
  );
}
