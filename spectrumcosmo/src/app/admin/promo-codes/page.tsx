// app/admin/promo-codes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Copy, RefreshCw, X, Check, 
  AlertCircle, Tag, Percent, Calendar, Users,
  ArrowRight, Search, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PromoCode {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  per_user_limit: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

// ===== SKELETON =====
function PromoCodesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-64 mt-1" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-[var(--background-secondary)] rounded w-32" />
          <div className="h-10 bg-[var(--background-secondary)] rounded w-28" />
        </div>
      </div>
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--background-secondary)] rounded w-1/4" />
                <div className="h-3 bg-[var(--background-secondary)] rounded w-1/3" />
              </div>
              <div className="h-6 bg-[var(--background-secondary)] rounded w-16" />
              <div className="h-8 w-8 bg-[var(--background-secondary)] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 0,
    maxUses: '',
    perUserLimit: 1,
    expiresAt: '',
  });

  const [generateData, setGenerateData] = useState({
    count: 10,
    prefix: '',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 0,
    maxUses: '',
    perUserLimit: 1,
    expiresAt: '',
  });

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promo-codes');
      const data = await res.json();
      if (data.success) {
        setPromoCodes(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch promo codes:', err);
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveStatus = async (id: number, isActive: boolean) => {
    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !isActive }),
      });
      if (res.ok) {
        toast.success(`Promo code ${!isActive ? 'activated' : 'deactivated'}`);
        await fetchPromoCodes();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Failed to update promo code:', err);
      toast.error('Failed to update promo code');
    }
  };

  const deletePromoCode = async (id: number) => {
    if (!confirm('Delete this promo code?')) return;
    try {
      const res = await fetch(`/api/admin/promo-codes?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Promo code deleted');
        await fetchPromoCodes();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete');
      }
    } catch (err) {
      console.error('Failed to delete promo code:', err);
      toast.error('Failed to delete promo code');
    }
  };

  const createPromoCode = async () => {
    if (!formData.code.trim()) {
      toast.error('Please enter a promo code');
      return;
    }
    if (formData.discountValue <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          code: formData.code,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          minOrderAmount: formData.minOrderAmount,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          perUserLimit: formData.perUserLimit,
          expiresAt: formData.expiresAt || null,
        }),
      });
      if (res.ok) {
        toast.success('Promo code created');
        await fetchPromoCodes();
        setShowCreateModal(false);
        setFormData({
          code: '',
          discountType: 'percentage',
          discountValue: 10,
          minOrderAmount: 0,
          maxUses: '',
          perUserLimit: 1,
          expiresAt: '',
        });
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to create');
      }
    } catch (err) {
      console.error('Failed to create promo code:', err);
      toast.error('Failed to create promo code');
    }
  };

  const generateBatchCodes = async () => {
    if (generateData.count < 1 || generateData.count > 50) {
      toast.error('Please enter a count between 1 and 50');
      return;
    }
    if (generateData.discountValue <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_batch',
          count: generateData.count,
          prefix: generateData.prefix,
          discountType: generateData.discountType,
          discountValue: generateData.discountValue,
          minOrderAmount: generateData.minOrderAmount,
          maxUses: generateData.maxUses ? parseInt(generateData.maxUses) : null,
          perUserLimit: generateData.perUserLimit,
          expiresAt: generateData.expiresAt || null,
        }),
      });
      if (res.ok) {
        toast.success(`${generateData.count} promo codes generated`);
        await fetchPromoCodes();
        setShowGenerateModal(false);
        setGenerateData({
          count: 10,
          prefix: '',
          discountType: 'percentage',
          discountValue: 10,
          minOrderAmount: 0,
          maxUses: '',
          perUserLimit: 1,
          expiresAt: '',
        });
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to generate');
      }
    } catch (err) {
      console.error('Failed to generate codes:', err);
      toast.error('Failed to generate codes');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const filteredCodes = promoCodes.filter(promo => {
    const matchesSearch = promo.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && promo.is_active) ||
      (filterStatus === 'inactive' && !promo.is_active);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: promoCodes.length,
    active: promoCodes.filter(p => p.is_active).length,
    totalUses: promoCodes.reduce((sum, p) => sum + p.uses_count, 0),
    totalDiscount: promoCodes.reduce((sum, p) => sum + p.discount_value, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
          <PromoCodesSkeleton />
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
                <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Promo Codes</h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
              Create and manage discount codes for your store
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--background-secondary)] hover:bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--foreground)] transition min-h-[44px]"
            >
              <RefreshCw size={16} />
              <span className="hidden sm:inline">Generate Batch</span>
              <span className="sm:hidden">Batch</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition shadow-sm text-sm sm:text-base min-h-[44px]"
            >
              <Plus size={16} />
              Create Single
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">{stats.total}</p>
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Total Codes</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800 p-3 sm:p-4 shadow-sm">
            <p className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-400">{stats.active}</p>
            <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-500">Active</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-3 sm:p-4 shadow-sm">
            <p className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.totalUses}</p>
            <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-500">Total Uses</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-800 p-3 sm:p-4 shadow-sm">
            <p className="text-lg sm:text-2xl font-bold text-[var(--primary)]">{stats.totalDiscount}</p>
            <p className="text-[10px] sm:text-xs text-orange-600 dark:text-orange-500">Avg Discount</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input
              type="text"
              placeholder="Search promo codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[40px]"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition min-h-[40px] ${
                  filterStatus === status
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Promo Codes Table */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
          {filteredCodes.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Tag size={24} className="sm:w-7 sm:h-7 text-[var(--foreground-muted)] opacity-50" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-[var(--foreground)] mb-1">No promo codes found</h3>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter.'
                  : 'Create your first promo code to get started.'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium"
                >
                  Create your first promo code →
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-[var(--background-secondary)] border-b border-[var(--border)]">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Code</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Discount</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider hidden sm:table-cell">Uses</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider hidden md:table-cell">Min Order</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider hidden lg:table-cell">Expires</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredCodes.map((promo) => (
                    <tr key={promo.id} className="hover:bg-[var(--background-secondary)] transition">
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <code className="px-2 py-1 bg-[var(--background-secondary)] rounded text-xs sm:text-sm font-mono text-[var(--foreground)]">
                            {promo.code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(promo.code)}
                            className="p-1 hover:bg-[var(--background)] rounded transition min-h-[28px] min-w-[28px] flex items-center justify-center"
                            title="Copy code"
                          >
                            {copiedCode === promo.code ? (
                              <Check size={14} className="text-green-500" />
                            ) : (
                              <Copy size={14} className="text-[var(--foreground-muted)]" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <span className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                          {promo.discount_type === 'percentage' 
                            ? `${promo.discount_value}%` 
                            : `MWK ${promo.discount_value.toLocaleString()}`}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-[var(--foreground-muted)] hidden sm:table-cell">
                        {promo.uses_count}{promo.max_uses ? ` / ${promo.max_uses}` : ''}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-[var(--foreground-muted)] hidden md:table-cell">
                        {promo.min_order_amount > 0 ? `MWK ${promo.min_order_amount.toLocaleString()}` : 'None'}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-[var(--foreground-muted)] hidden lg:table-cell">
                        {promo.expires_at ? new Date(promo.expires_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <button
                          onClick={() => toggleActiveStatus(promo.id, promo.is_active)}
                          className={`px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium transition min-h-[28px] ${
                            promo.is_active 
                              ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {promo.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">
                        <button
                          onClick={() => deletePromoCode(promo.id)}
                          className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                          title="Delete promo code"
                        >
                          <Trash2 size={14} className="sm:w-4 sm:h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {filteredCodes.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
              Showing {filteredCodes.length} of {promoCodes.length} promo codes
            </p>
            {(searchTerm || filterStatus !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                className="text-[10px] sm:text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] transition"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Single Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[var(--background-card)] rounded-xl p-4 sm:p-6 w-full max-w-md shadow-xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                  <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--primary)]" />
                </div>
                <h2 className="text-base sm:text-xl font-semibold text-[var(--foreground)]">Create Promo Code</h2>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="p-1.5 hover:bg-[var(--background-secondary)] rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X size={18} className="text-[var(--foreground-muted)]" />
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full p-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                  placeholder="SUMMER20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full p-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (MWK)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Value</label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                    className="w-full p-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Min Order Amount (MWK)</label>
                <input
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) })}
                  className="w-full p-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Max Uses</label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    className="w-full p-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Per User Limit</label>
                  <input
                    type="number"
                    value={formData.perUserLimit}
                    onChange={(e) => setFormData({ ...formData, perUserLimit: parseInt(e.target.value) })}
                    className="w-full p-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Expires At</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full p-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)]"
                />
              </div>
              <button
                onClick={createPromoCode}
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-2 rounded-lg font-medium transition min-h-[44px] text-sm"
              >
                Create Promo Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Batch Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[var(--background-card)] rounded-xl p-4 sm:p-6 w-full max-w-md shadow-xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--primary)]" />
                </div>
                <h2 className="text-base sm:text-xl font-semibold text-[var(--foreground)]">Generate Batch Codes</h2>
              </div>
              <button 
                onClick={() => setShowGenerateModal(false)} 
                className="p-1.5 hover:bg-[var(--background-secondary)] rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X size={18} className="text-[var(--foreground-muted)]" />
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Count</label>
                  <input
                    type="number"
                    value={generateData.count}
                    onChange={(e) => setGenerateData({ ...generateData, count: parseInt(e.target.value) })}
                    className="w-full p-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)]"
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Prefix</label>
                  <input
                    type="text"
                    value={generateData.prefix}
                    onChange={(e) => setGenerateData({ ...generateData, prefix: e.target.value.toUpperCase() })}
                    className="w-full p-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                    placeholder="SUMMER"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Type</label>
                  <select
                    value={generateData.discountType}
                    onChange={(e) => setGenerateData({ ...generateData, discountType: e.target.value })}
                    className="w-full p-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (MWK)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Value</label>
                  <input
                    type="number"
                    value={generateData.discountValue}
                    onChange={(e) => setGenerateData({ ...generateData, discountValue: parseFloat(e.target.value) })}
                    className="w-full p-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Min Order Amount (MWK)</label>
                <input
                  type="number"
                  value={generateData.minOrderAmount}
                  onChange={(e) => setGenerateData({ ...generateData, minOrderAmount: parseFloat(e.target.value) })}
                  className="w-full p-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Max Uses per Code</label>
                  <input
                    type="number"
                    value={generateData.maxUses}
                    onChange={(e) => setGenerateData({ ...generateData, maxUses: e.target.value })}
                    className="w-full p-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)]"
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Per User Limit</label>
                  <input
                    type="number"
                    value={generateData.perUserLimit}
                    onChange={(e) => setGenerateData({ ...generateData, perUserLimit: parseInt(e.target.value) })}
                    className="w-full p-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Expires At</label>
                <input
                  type="datetime-local"
                  value={generateData.expiresAt}
                  onChange={(e) => setGenerateData({ ...generateData, expiresAt: e.target.value })}
                  className="w-full p-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)]"
                />
              </div>
              <button
                onClick={generateBatchCodes}
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-2 rounded-lg font-medium transition min-h-[44px] text-sm"
              >
                Generate {generateData.count} Codes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
