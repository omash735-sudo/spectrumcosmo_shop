'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Pencil, Trash2, X, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

type PaymentProvider = {
  id: number;
  name: string;
  type: string;
  category: string;
  is_enabled: boolean;
  display_order: number;
  logo_url: string | null;
  account_name: string | null;
  account_number: string | null;
  branch: string | null;
  instructions: string | null;
};

const EMPTY_PROVIDER = {
  name: '',
  type: 'manual',
  category: 'mobile_money',
  is_enabled: true,
  display_order: 0,
  logo_url: '',
  account_name: '',
  account_number: '',
  branch: '',
  instructions: '',
};

export default function PaymentProvidersPage() {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PaymentProvider | null>(null);
  const [form, setForm] = useState(EMPTY_PROVIDER);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payment-providers');
      const data = await res.json();
      setProviders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_PROVIDER);
    setError('');
    setShowModal(true);
  };

  const openEdit = (provider: PaymentProvider) => {
    setEditing(provider);
    setForm({
      name: provider.name,
      type: provider.type,
      category: provider.category,
      is_enabled: provider.is_enabled,
      display_order: provider.display_order,
      logo_url: provider.logo_url || '',
      account_name: provider.account_name || '',
      account_number: provider.account_number || '',
      branch: provider.branch || '',
      instructions: provider.instructions || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError('');

    const method = editing ? 'PATCH' : 'POST';
    const body = editing ? { id: editing.id, ...form } : form;

    try {
      const res = await fetch('/api/admin/payment-providers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowModal(false);
        fetchProviders();
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to save');
      }
    } catch (err) {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const deleteProvider = async (id: number) => {
    if (!confirm('Delete this payment provider? This may affect existing orders.')) return;
    await fetch(`/api/admin/payment-providers?id=${id}`, { method: 'DELETE' });
    fetchProviders();
  };

  const toggleEnabled = async (provider: PaymentProvider) => {
    await fetch('/api/admin/payment-providers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: provider.id, is_enabled: !provider.is_enabled }),
    });
    fetchProviders();
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
          <h1 className="text-2xl font-bold text-gray-900">Payment Providers</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage payment methods available at checkout (manual and automatic).
          </p>
        </div>
        <button onClick={openAdd} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
          <Plus size={16} /> Add Provider
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-6 py-3">Type</th>
                <th className="text-left px-6 py-3">Category</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Order</th>
                <th className="text-right px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {providers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No payment providers added yet.
                  </td>
                </tr>
              ) : (
                providers.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {p.logo_url && (
                          <Image src={p.logo_url} alt={p.name} width={24} height={24} className="w-6 h-6 object-contain" />
                        )}
                        <span className="font-medium text-gray-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.type === 'automatic' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.category}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleEnabled(p)} className="flex items-center gap-1">
                        {p.is_enabled ? (
                          <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            <CheckCircle size={12} /> Enabled
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                            <XCircle size={12} /> Disabled
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.display_order}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => deleteProvider(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-[#111111]">{editing ? 'Edit Provider' : 'Add Provider'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Airtel Money, National Bank"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="input"
                  >
                    <option value="manual">Manual (Upload Proof)</option>
                    <option value="automatic">Automatic (API)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input"
                  >
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="card">Card Payment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Display Order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                    className="input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="label">Logo URL (optional)</label>
                  <input
                    value={form.logo_url}
                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                    className="input"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-3">Payment Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="label">Account Name</label>
                    <input
                      value={form.account_name}
                      onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                      className="input"
                      placeholder="SpectrumCosmo"
                    />
                  </div>
                  <div>
                    <label className="label">Account Number / Phone</label>
                    <input
                      value={form.account_number}
                      onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                      className="input"
                      placeholder="0981 234 567"
                    />
                  </div>
                  <div>
                    <label className="label">Branch (for banks)</label>
                    <input
                      value={form.branch}
                      onChange={(e) => setForm({ ...form, branch: e.target.value })}
                      className="input"
                      placeholder="Ginnery Corner"
                    />
                  </div>
                  <div>
                    <label className="label">Instructions (HTML supported)</label>
                    <textarea
                      value={form.instructions}
                      onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                      rows={3}
                      className="input"
                      placeholder="Send exact amount to the account above..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_enabled}
                    onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded"
                  />
                  <span className="text-sm text-gray-600">Enabled (show at checkout)</span>
                </label>
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-xl text-sm">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-500 text-white rounded-xl py-2 text-sm font-medium">
                  {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : (editing ? 'Save Changes' : 'Add Provider')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
