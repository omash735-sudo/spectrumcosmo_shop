'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Pencil, Trash2, X } from 'lucide-react';

type OrderStatus = {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  display_order: number;
  is_active: boolean;
};

const COLOR_OPTIONS = [
  'gray', 'red', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink', 'orange'
];

const ICON_OPTIONS = [
  'Clock', 'CheckCircle', 'Truck', 'Package', 'AlertCircle', 'XCircle', 'HelpCircle'
];

export default function OrderStatusesPage() {
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<OrderStatus | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: 'gray',
    icon: 'Clock',
    display_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/order-statuses');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setStatuses(data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load statuses' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      color: 'gray',
      icon: 'Clock',
      display_order: statuses.length + 10,
      is_active: true,
    });
    setShowModal(true);
  };

  const openEdit = (status: OrderStatus) => {
    setEditing(status);
    setForm({
      name: status.name,
      slug: status.slug,
      description: status.description || '',
      color: status.color || 'gray',
      icon: status.icon || 'Clock',
      display_order: status.display_order,
      is_active: status.is_active,
    });
    setShowModal(true);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleSave = async () => {
    if (!form.name) {
      setMessage({ type: 'error', text: 'Status name is required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const method = editing ? 'PATCH' : 'POST';
    const body = editing 
      ? { id: editing.id, ...form, slug: form.slug || generateSlug(form.name) }
      : { ...form, slug: generateSlug(form.name) };

    try {
      const res = await fetch('/api/admin/order-statuses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowModal(false);
        fetchStatuses();
        setMessage({ type: 'success', text: `Status ${editing ? 'updated' : 'added'} successfully!` });
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to save' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: number, currentActive: boolean) => {
    try {
      await fetch('/api/admin/order-statuses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentActive }),
      });
      fetchStatuses();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteStatus = async (id: number) => {
    if (!confirm('Delete this status? This may affect existing orders.')) return;
    try {
      await fetch(`/api/admin/order-statuses?id=${id}`, { method: 'DELETE' });
      fetchStatuses();
    } catch (err) {
      console.error(err);
    }
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-700',
      red: 'bg-red-100 text-red-700',
      yellow: 'bg-yellow-100 text-yellow-700',
      green: 'bg-green-100 text-green-700',
      blue: 'bg-blue-100 text-blue-700',
      indigo: 'bg-indigo-100 text-indigo-700',
      purple: 'bg-purple-100 text-purple-700',
      pink: 'bg-pink-100 text-pink-700',
      orange: 'bg-orange-100 text-orange-700',
    };
    return colors[color] || colors.gray;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Statuses</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage order statuses. These are used across the entire system.
          </p>
        </div>
        <button onClick={openAdd} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
          <Plus size={16} /> Add Status
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Slug</th>
                <th className="text-left px-6 py-3">Display Order</th>
                <th className="text-left px-6 py-3">Active</th>
                <th className="text-right px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {statuses.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorClass(s.color)}`}>
                        {s.name}
                      </span>
                    </div>
                    {s.description && <p className="text-xs text-gray-400 mt-1">{s.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{s.slug}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.display_order}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(s.id, s.is_active)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {s.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => deleteStatus(s.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-[#111111]">{editing ? 'Edit Status' : 'Add Status'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Status Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Refund Requested"
                />
              </div>
              <div>
                <label className="label">Slug (URL friendly)</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
                  className="input"
                  placeholder="refund-requested"
                />
                <p className="text-xs text-gray-400 mt-1">Leave empty to auto-generate from name.</p>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="input"
                  placeholder="Internal description of this status..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Color</label>
                  <select
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="input"
                  >
                    {COLOR_OPTIONS.map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Icon</label>
                  <select
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="input"
                  >
                    {ICON_OPTIONS.map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Display Order</label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                  className="input"
                />
                <p className="text-xs text-gray-400 mt-1">Lower numbers appear first.</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded"
                  />
                  <span className="text-sm text-gray-600">Active</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-xl text-sm">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-500 text-white rounded-xl py-2 text-sm font-medium">
                  {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : (editing ? 'Save Changes' : 'Add Status')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
