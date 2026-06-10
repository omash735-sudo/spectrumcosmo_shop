'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Trash2, CheckCircle, XCircle, MapPin, Building, Zap, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface DeliveryArea {
  id: number;
  area_name: string;
  city: string;
  base_fee: number;
  express_multiplier: number;
  estimated_days_standard: string | null;
  estimated_days_express: string | null;
  is_active: boolean;
  sort_order: number;
}

export default function AdminDeliveryAreasPage() {
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArea, setEditingArea] = useState<DeliveryArea | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    area_name: '',
    city: '',
    base_fee: '',
    express_multiplier: '1.5',
    estimated_days_standard: '',
    estimated_days_express: '',
    is_active: true,
    sort_order: 0,
  });

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/delivery-areas');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch');
      }
      const data = await res.json();
      setAreas(data);
    } catch (err: any) {
      console.error('Fetch error:', err);
      toast.error(err.message || 'Failed to load delivery areas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const resetForm = () => {
    setEditingArea(null);
    setForm({
      area_name: '',
      city: '',
      base_fee: '',
      express_multiplier: '1.5',
      estimated_days_standard: '',
      estimated_days_express: '',
      is_active: true,
      sort_order: areas.length,
    });
  };

  const handleOpenModal = (area?: DeliveryArea) => {
    if (area) {
      setEditingArea(area);
      setForm({
        area_name: area.area_name,
        city: area.city,
        base_fee: area.base_fee.toString(),
        express_multiplier: area.express_multiplier.toString(),
        estimated_days_standard: area.estimated_days_standard || '',
        estimated_days_express: area.estimated_days_express || '',
        is_active: area.is_active,
        sort_order: area.sort_order,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        area_name: form.area_name,
        city: form.city,
        base_fee: parseFloat(form.base_fee),
        express_multiplier: parseFloat(form.express_multiplier),
        estimated_days_standard: form.estimated_days_standard || null,
        estimated_days_express: form.estimated_days_express || null,
        is_active: form.is_active,
        sort_order: parseInt(form.sort_order.toString()),
      };

      const url = '/api/admin/delivery-areas';
      const method = editingArea ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingArea ? { ...payload, id: editingArea.id } : payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      toast.success(editingArea ? 'Area updated' : 'Area created');
      setShowModal(false);
      resetForm();
      fetchAreas();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save delivery area');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This will remove this delivery area.`)) return;
    
    try {
      const res = await fetch(`/api/admin/delivery-areas?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }
      toast.success('Area deleted');
      fetchAreas();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const getCityIcon = (city: string) => {
    const cityLower = city.toLowerCase();
    if (cityLower.includes('lilongwe')) return <Building size={14} className="text-blue-500" />;
    if (cityLower.includes('blantyre')) return <Building size={14} className="text-green-500" />;
    if (cityLower.includes('mzuzu')) return <Building size={14} className="text-purple-500" />;
    return <MapPin size={14} className="text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="animate-spin text-orange-500 w-8 h-8 mx-auto mb-3" />
          <p className="text-gray-500">Loading delivery areas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-7 h-7 text-orange-500" />
            Delivery Areas
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage location-based delivery fees and express pricing</p>
          <p className="text-xs text-gray-400 mt-1">These determine delivery fees based on customer location</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition shadow-sm"
        >
          <Plus size={18} />
          Add Area
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500">Total Areas</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{areas.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{areas.filter(a => a.is_active).length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500">Cities</p>
          <p className="text-2xl font-bold text-blue-600">{new Set(areas.map(a => a.city)).size}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500">Avg Base Fee</p>
          <p className="text-2xl font-bold text-orange-600">
            MWK {Math.round(areas.reduce((sum, a) => sum + a.base_fee, 0) / (areas.length || 1)).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr className="text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-6 py-4">Area</th>
                <th className="text-left px-6 py-4">City</th>
                <th className="text-left px-6 py-4">Base Fee</th>
                <th className="text-left px-6 py-4">Express (x)</th>
                <th className="text-left px-6 py-4">Est. Days</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-right px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {areas.map((area) => (
                <tr key={area.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getCityIcon(area.city)}
                      <span className="font-medium text-gray-900 dark:text-white">{area.area_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{area.city}</td>
                  <td className="px-6 py-4 text-sm font-medium text-orange-600 dark:text-orange-400">
                    MWK {area.base_fee.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Zap size={12} className="text-purple-500" />
                      {area.express_multiplier}x
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs">
                      <div>S: {area.estimated_days_standard || '-'}</div>
                      <div className="text-purple-600">E: {area.estimated_days_express || '-'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      area.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {area.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {area.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(area)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        title="Edit"
                      >
                        <Edit2 size={16} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(area.id, area.area_name)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                        title="Delete"
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
        {areas.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No delivery areas found</p>
            <button onClick={() => handleOpenModal()} className="mt-3 text-orange-500 hover:underline">
              Add your first delivery area
            </button>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {areas.map((area) => (
          <div key={area.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getCityIcon(area.city)}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{area.area_name}</h3>
                  <p className="text-xs text-gray-500">{area.city}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                area.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {area.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Base Fee</span>
                <span className="font-semibold text-orange-600">MWK {area.base_fee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Express Fee</span>
                <span className="font-semibold text-purple-600">MWK {Math.round(area.base_fee * area.express_multiplier).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Standard Delivery</span>
                <span className="text-gray-700">{area.estimated_days_standard || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Express Delivery</span>
                <span className="text-gray-700">{area.estimated_days_express || '-'}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => handleOpenModal(area)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition"
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                onClick={() => handleDelete(area.id, area.area_name)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 rounded-lg text-sm text-red-600 hover:bg-red-100 transition"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
        {areas.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No delivery areas found</p>
            <button onClick={() => handleOpenModal()} className="mt-3 text-orange-500 hover:underline">
              Add your first delivery area
            </button>
          </div>
        )}
      </div>

      {/* Modal - Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 py-4 border-b dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingArea ? 'Edit Delivery Area' : 'Add Delivery Area'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Area Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.area_name}
                  onChange={(e) => setForm({ ...form, area_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-orange-500"
                  placeholder="Area 1-10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800"
                  placeholder="Lilongwe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Base Fee (MWK) *
                  </label>
                  <input
                    type="number"
                    required
                    value={form.base_fee}
                    onChange={(e) => setForm({ ...form, base_fee: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800"
                    placeholder="2500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Express Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.express_multiplier}
                    onChange={(e) => setForm({ ...form, express_multiplier: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800"
                    placeholder="1.5"
                  />
                  <p className="text-xs text-gray-400 mt-1">Express fee = Base × Multiplier</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Standard Estimated Days
                </label>
                <input
                  type="text"
                  value={form.estimated_days_standard}
                  onChange={(e) => setForm({ ...form, estimated_days_standard: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800"
                  placeholder="2-3 business days"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Express Estimated Days
                </label>
                <input
                  type="text"
                  value={form.estimated_days_express}
                  onChange={(e) => setForm({ ...form, estimated_days_express: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800"
                  placeholder="Same day"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800"
                  placeholder="0"
                />
                <p className="text-xs text-gray-400 mt-1">Lower numbers appear first</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                  Active (available for delivery)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : (editingArea ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
