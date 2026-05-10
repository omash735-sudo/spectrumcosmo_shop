'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Edit, X } from 'lucide-react';

type DeliveryMethod = {
  id: number;
  name: string;
  logo_url: string;
  price: number;
  is_active: boolean;
  sort_order: number;
};

export default function AdminDeliveryPage() {
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<DeliveryMethod | null>(null);
  const [form, setForm] = useState({
    name: '',
    logo_url: '',
    price: 0,
    is_active: true,
    sort_order: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchMethods = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/delivery-methods');
    const data = await res.json();
    setMethods(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', logo_url: '', price: 0, is_active: true, sort_order: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const url = editing
      ? `/api/admin/delivery-methods/${editing.id}`
      : '/api/admin/delivery-methods';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      await fetchMethods();
      resetForm();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to save');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this delivery method?')) return;
    await fetch(`/api/admin/delivery-methods/${id}`, { method: 'DELETE' });
    fetchMethods();
  };

  const startEdit = (method: DeliveryMethod) => {
    setEditing(method);
    setForm({
      name: method.name,
      logo_url: method.logo_url || '',
      price: method.price,
      is_active: method.is_active,
      sort_order: method.sort_order,
    });
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Methods</h1>
          <p className="text-gray-500 text-sm">Manage shipping options shown at checkout</p>
        </div>
        <button onClick={resetForm} className="bg-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2">
          <Plus size={16} /> Add New
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border p-6 mb-8">
        <h2 className="font-bold text-lg mb-4">{editing ? 'Edit' : 'Add'} Delivery Method</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl px-3 py-2" placeholder="e.g., Standard Delivery" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price (MWK) *</label>
              <input type="number" required value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="w-full border rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Logo URL (optional)</label>
              <input value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} className="w-full border rounded-xl px-3 py-2" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sort Order (lower = higher in list)</label>
              <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="w-full border rounded-xl px-3 py-2" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              <label htmlFor="is_active" className="text-sm">Active (show at checkout)</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="bg-orange-500 text-white px-6 py-2 rounded-xl disabled:opacity-50">
              {submitting ? 'Saving...' : (editing ? 'Update' : 'Create')}
            </button>
            {editing && <button type="button" onClick={resetForm} className="border px-6 py-2 rounded-xl">Cancel</button>}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs text-gray-400 uppercase">
            <tr>
              <th className="text-left px-6 py-3">Name</th>
              <th className="text-left px-6 py-3">Price (MWK)</th>
              <th className="text-left px-6 py-3">Status</th>
              <th className="text-left px-6 py-3">Sort Order</th>
              <th className="text-right px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {methods.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{m.name}</td>
                <td className="px-6 py-4">{m.price.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {m.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">{m.sort_order}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => startEdit(m)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {methods.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No delivery methods.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
              }
