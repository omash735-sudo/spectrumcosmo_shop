'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Edit, X, CheckCircle, XCircle, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

type DeliveryMethod = {
  id: number;
  name: string;
  logo_url: string | null;
  price: number;
  is_active: boolean;
  sort_order: number;
};

export default function AdminDeliveryPage() {
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<DeliveryMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    logo_url: '',
    price: 0,
    is_active: true,
    sort_order: 0,
  });

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/delivery-methods');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      // Handle both response formats (array directly or { delivery: [...] })
      const methodsArray = Array.isArray(data) ? data : (data.delivery || data.methods || []);
      setMethods(methodsArray);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load delivery methods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const resetForm = () => {
    setEditingMethod(null);
    setForm({
      name: '',
      logo_url: '',
      price: 0,
      is_active: true,
      sort_order: methods.length,
    });
  };

  const handleOpenModal = (method?: DeliveryMethod) => {
    if (method) {
      setEditingMethod(method);
      setForm({
        name: method.name,
        logo_url: method.logo_url || '',
        price: method.price,
        is_active: method.is_active,
        sort_order: method.sort_order || 0,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingMethod
        ? `/api/admin/delivery-methods/${editingMethod.id}`
        : '/api/admin/delivery-methods';
      const method = editingMethod ? 'PUT' : 'POST';

      const payload = {
        name: form.name,
        price: form.price,
        logo_url: form.logo_url || null,
        is_active: form.is_active,
        sort_order: form.sort_order,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      toast.success(editingMethod ? 'Delivery method updated' : 'Delivery method created');
      setShowModal(false);
      resetForm();
      fetchMethods();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/delivery-methods/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Delivery method deleted');
      fetchMethods();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/delivery-methods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success(`Method ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchMethods();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="animate-spin text-orange-500 w-8 h-8 mx-auto mb-3" />
          <p className="text-gray-500">Loading delivery methods...</p>
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
            <Truck className="w-7 h-7 text-orange-500" />
            Delivery Methods
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage shipping options shown at checkout</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition shadow-sm"
        >
          <Plus size={18} />
          Add Delivery Method
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500">Total Methods</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{methods.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{methods.filter(m => m.is_active).length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500">Inactive</p>
          <p className="text-2xl font-bold text-gray-400">{methods.filter(m => !m.is_active).length}</p>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr className="text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-6 py-4">Method</th>
                <th className="text-left px-6 py-4">Price (MWK)</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-left px-6 py-4">Sort Order</th>
                <th className="text-right px-6 py-4">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {methods.map((method) => (
                <tr key={method.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {method.logo_url ? (
                        <div className="w-8 h-8 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={method.logo_url} alt={method.name} width={32} height={32} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Truck size={16} className="text-orange-500" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">{method.name}</span>
                    </div>
                   </td>
                  <td className="px-6 py-4 font-medium text-orange-600 dark:text-orange-400">
                    MWK {method.price.toLocaleString()}
                   </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(method.id, method.is_active)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition ${
                        method.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {method.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {method.is_active ? 'Active' : 'Inactive'}
                    </button>
                   </td>
                  <td className="px-6 py-4 text-gray-500">{method.sort_order || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(method)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        title="Edit"
                      >
                        <Edit size={16} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(method.id, method.name)}
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
        {methods.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No delivery methods found</p>
            <button onClick={() => handleOpenModal()} className="mt-3 text-orange-500 hover:underline">
              Add your first delivery method
            </button>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {methods.map((method) => (
          <div key={method.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {method.logo_url ? (
                  <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={method.logo_url} alt={method.name} width={40} height={40} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Truck size={20} className="text-orange-500" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{method.name}</h3>
                </div>
              </div>
              <button
                onClick={() => handleToggleStatus(method.id, method.is_active)}
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  method.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {method.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Price</span>
                <span className="font-semibold text-orange-600">MWK {method.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sort Order</span>
                <span className="text-gray-700">{method.sort_order || '-'}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => handleOpenModal(method)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition"
              >
                <Edit size={14} /> Edit
              </button>
              <button
                onClick={() => handleDelete(method.id, method.name)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 rounded-lg text-sm text-red-600 hover:bg-red-100 transition"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
        {methods.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No delivery methods found</p>
            <button onClick={() => handleOpenModal()} className="mt-3 text-orange-500 hover:underline">
              Add your first delivery method
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 py-4 border-b dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingMethod ? 'Edit Delivery Method' : 'Add Delivery Method'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Method Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Standard Delivery"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price (MWK) *
                </label>
                <input
                  type="number"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800"
                  placeholder="2500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Logo URL (Optional)
                </label>
                <input
                  type="url"
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800"
                  placeholder="https://..."
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
                <p className="text-xs text-gray-400 mt-1">Lower numbers appear first at checkout</p>
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
                  Active (show at checkout)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : (editingMethod ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
