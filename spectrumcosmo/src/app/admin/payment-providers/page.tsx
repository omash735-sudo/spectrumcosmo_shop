'use client';

import { useState, useEffect } from 'react';
import { 
  Loader2, Plus, Pencil, Trash2, X, CheckCircle, XCircle,
  Wallet, Building2, CreditCard, Coins, AlertCircle,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

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

const categoryIcons: Record<string, any> = {
  mobile_money: Wallet,
  bank: Building2,
  card: CreditCard,
};

const categoryLabels: Record<string, string> = {
  mobile_money: 'Mobile Money',
  bank: 'Bank Transfer',
  card: 'Card Payment',
};

// ===== SKELETON =====
function PaymentProvidersSkeleton() {
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
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProviders(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load payment providers');
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
    if (!form.name.trim()) {
      setError('Name is required');
      toast.error('Name is required');
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
        toast.success(editing ? 'Provider updated successfully' : 'Provider added successfully');
        setShowModal(false);
        fetchProviders();
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to save');
        toast.error(err.error || 'Failed to save');
      }
    } catch (err) {
      setError('Failed to save');
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const deleteProvider = async (id: number) => {
    if (!confirm('Delete this payment provider? This may affect existing orders.')) return;
    try {
      const res = await fetch(`/api/admin/payment-providers?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Provider deleted');
        fetchProviders();
      } else {
        toast.error('Failed to delete');
      }
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const toggleEnabled = async (provider: PaymentProvider) => {
    try {
      const res = await fetch('/api/admin/payment-providers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: provider.id, is_enabled: !provider.is_enabled }),
      });
      if (res.ok) {
        toast.success(`Provider ${!provider.is_enabled ? 'enabled' : 'disabled'}`);
        fetchProviders();
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
          <PaymentProvidersSkeleton />
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
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Payment Providers</h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
              Manage payment methods available at checkout (manual and automatic).
            </p>
          </div>
          <button 
            onClick={openAdd} 
            className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-medium transition shadow-sm text-sm sm:text-base min-h-[44px]"
          >
            <Plus size={16} /> Add Provider
          </button>
        </div>

        {/* Providers Table */}
        <div className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
          {providers.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard size={24} className="sm:w-7 sm:h-7 text-[var(--foreground-muted)] opacity-50" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-[var(--foreground)] mb-1">No payment providers</h3>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                Add your first payment provider to start accepting payments.
              </p>
              <button
                onClick={openAdd}
                className="mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium"
              >
                Add your first provider →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-[var(--background-secondary)] border-b border-[var(--border)]">
                  <tr className="text-[10px] sm:text-xs text-[var(--foreground-muted)] uppercase tracking-wider">
                    <th className="text-left px-4 sm:px-6 py-2 sm:py-3 font-medium">Name</th>
                    <th className="text-left px-4 sm:px-6 py-2 sm:py-3 font-medium hidden sm:table-cell">Type</th>
                    <th className="text-left px-4 sm:px-6 py-2 sm:py-3 font-medium hidden md:table-cell">Category</th>
                    <th className="text-left px-4 sm:px-6 py-2 sm:py-3 font-medium">Status</th>
                    <th className="text-left px-4 sm:px-6 py-2 sm:py-3 font-medium hidden lg:table-cell">Order</th>
                    <th className="text-right px-4 sm:px-6 py-2 sm:py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {providers.map((p) => {
                    const CategoryIcon = categoryIcons[p.category] || CreditCard;
                    return (
                      <tr key={p.id} className="hover:bg-[var(--background-secondary)] transition">
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            {p.logo_url ? (
                              <Image 
                                src={p.logo_url} 
                                alt={p.name} 
                                width={24} 
                                height={24} 
                                className="w-6 h-6 sm:w-7 sm:h-7 object-contain flex-shrink-0" 
                              />
                            ) : (
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center flex-shrink-0">
                                <CategoryIcon size={12} className="sm:w-3.5 sm:h-3.5 text-[var(--primary)]" />
                              </div>
                            )}
                            <span className="text-xs sm:text-sm font-medium text-[var(--foreground)] truncate">
                              {p.name}
                            </span>
                          </div>
                          {p.account_number && (
                            <p className="text-[10px] text-[var(--foreground-muted)] mt-0.5 font-mono truncate max-w-[120px] sm:max-w-[200px]">
                              {p.account_number}
                            </p>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                            p.type === 'automatic' 
                              ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' 
                              : 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
                          }`}>
                            {p.type}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-[var(--foreground-muted)] hidden md:table-cell">
                          {categoryLabels[p.category] || p.category}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <button 
                            onClick={() => toggleEnabled(p)} 
                            className="flex items-center gap-1 transition min-h-[32px]"
                          >
                            {p.is_enabled ? (
                              <span className="flex items-center gap-1 text-[10px] sm:text-xs bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                                <CheckCircle size={10} className="sm:w-3 sm:h-3" /> Enabled
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                                <XCircle size={10} className="sm:w-3 sm:h-3" /> Disabled
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-[var(--foreground-muted)] hidden lg:table-cell">
                          {p.display_order}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <button 
                              onClick={() => openEdit(p)} 
                              className="p-1.5 sm:p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                              title="Edit provider"
                            >
                              <Pencil size={14} className="sm:w-4 sm:h-4" />
                            </button>
                            <button 
                              onClick={() => deleteProvider(p.id)} 
                              className="p-1.5 sm:p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                              title="Delete provider"
                            >
                              <Trash2 size={14} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {providers.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
              Showing {providers.length} provider{providers.length !== 1 ? 's' : ''}
            </p>
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] opacity-70">
              Manual providers require admin verification; Automatic providers use API integration
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[var(--background-card)] rounded-2xl w-full max-w-lg shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--background-card)] flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--primary)]" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)]">
                  {editing ? 'Edit Provider' : 'Add Provider'}
                </h2>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-1.5 hover:bg-[var(--background-secondary)] rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X size={18} className="text-[var(--foreground-muted)]" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                  placeholder="e.g., Airtel Money, National Bank"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)]"
                  >
                    <option value="manual">Manual (Upload Proof)</option>
                    <option value="automatic">Automatic (API)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)]"
                  >
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="card">Card Payment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Display Order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Logo URL</label>
                  <input
                    value={form.logo_url}
                    onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-3 sm:pt-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2 sm:mb-3">Payment Details</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Account Name</label>
                    <input
                      value={form.account_name}
                      onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                      placeholder="SpectrumCosmo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Account Number / Phone</label>
                    <input
                      value={form.account_number}
                      onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                      placeholder="0981 234 567"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Branch (for banks)</label>
                    <input
                      value={form.branch}
                      onChange={(e) => setForm({ ...form, branch: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                      placeholder="Ginnery Corner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Instructions (HTML supported)</label>
                    <textarea
                      value={form.instructions}
                      onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                      rows={3}
                      className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] resize-none"
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
                    className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)] rounded"
                  />
                  <span className="text-xs sm:text-sm text-[var(--foreground)]">Enabled (show at checkout)</span>
                </label>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2.5 border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition min-h-[44px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={saving} 
                  className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl py-2.5 text-sm font-medium transition disabled:opacity-50 min-h-[44px] flex items-center justify-center"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : (editing ? 'Save Changes' : 'Add Provider')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
