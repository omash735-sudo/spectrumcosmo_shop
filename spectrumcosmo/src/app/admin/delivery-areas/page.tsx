'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface DeliveryArea {
  id: number;
  area_name: string;
  city: string;
  delivery_fee: number;
  estimated_days: string | null;
  is_active: boolean;
}

export default function AdminDeliveryAreasPage() {
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState<DeliveryArea | null>(null);
  const [form, setForm] = useState({
    area_name: '',
    city: '',
    delivery_fee: '',
    estimated_days: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchAreas = async () => {
    try {
      const res = await fetch('/api/admin/delivery-areas');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setAreas(data);
    } catch (err) {
      toast.error('Failed to load delivery areas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        delivery_fee: parseFloat(form.delivery_fee),
      };

      const url = editingArea
        ? `/api/admin/delivery-areas`
        : '/api/admin/delivery-areas';
      
      const method = editingArea ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingArea ? { ...payload, id: editingArea.id } : payload),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast.success(editingArea ? 'Area updated' : 'Area created');
      setShowModal(false);
      setEditingArea(null);
      setForm({ area_name: '', city: '', delivery_fee: '', estimated_days: '', is_active: true });
      fetchAreas();
    } catch (err) {
      toast.error('Failed to save delivery area');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this delivery area?')) return;
    
    try {
      const res = await fetch(`/api/admin/delivery-areas?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Area deleted');
      fetchAreas();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (area: DeliveryArea) => {
    setEditingArea(area);
    setForm({
      area_name: area.area_name,
      city: area.city,
      delivery_fee: area.delivery_fee.toString(),
      estimated_days: area.estimated_days || '',
      is_active: area.is_active,
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Areas</h1>
          <p className="text-gray-500 text-sm mt-1">Manage serviceable locations and delivery fees</p>
        </div>
        <button
          onClick={() => {
            setEditingArea(null);
            setForm({ area_name: '', city: '', delivery_fee: '', estimated_days: '', is_active: true });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition"
        >
          <Plus size={18} />
          Add Area
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Fee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Days</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {areas.map((area) => (
              <tr key={area.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{area.area_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{area.city}</td>
                <td className="px-6 py-4 text-sm font-medium text-orange-600 dark:text-orange-400">
                  MWK {area.delivery_fee.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{area.estimated_days || '-'}</td>
                <td className="px-6 py-4">
                  {area.is_active ? (
                    <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                      <CheckCircle size={12} /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-gray-400 text-xs">
                      <XCircle size={12} /> Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(area)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <Edit2 size={16} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(area.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full">
            <div className="p-6 border-b dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingArea ? 'Edit Delivery Area' : 'Add Delivery Area'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area Name</label>
                <input
                  type="text"
                  required
                  value={form.area_name}
                  onChange={(e) => setForm({ ...form, area_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800"
                  placeholder="Area 1-10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800"
                  placeholder="Lilongwe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Fee (MWK)</label>
                <input
                  type="number"
                  required
                  value={form.delivery_fee}
                  onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800"
                  placeholder="2500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Days</label>
                <input
                  type="text"
                  value={form.estimated_days}
                  onChange={(e) => setForm({ ...form, estimated_days: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800"
                  placeholder="1-2 business days"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  id="is_active"
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin mx-auto" size={18} /> : (editingArea ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
