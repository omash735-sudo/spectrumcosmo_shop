// app/admin/promo-codes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, RefreshCw, X, Check } from 'lucide-react';

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

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
        await fetchPromoCodes();
      }
    } catch (err) {
      console.error('Failed to update promo code:', err);
    }
  };

  const deletePromoCode = async (id: number) => {
    if (!confirm('Delete this promo code?')) return;
    try {
      const res = await fetch(`/api/admin/promo-codes?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchPromoCodes();
      }
    } catch (err) {
      console.error('Failed to delete promo code:', err);
    }
  };

  const createPromoCode = async () => {
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
        alert(error.error);
      }
    } catch (err) {
      console.error('Failed to create promo code:', err);
    }
  };

  const generateBatchCodes = async () => {
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
      }
    } catch (err) {
      console.error('Failed to generate codes:', err);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Promo Codes</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            <RefreshCw size={16} />
            Generate Batch (10 codes)
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            <Plus size={16} />
            Create Single
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : promoCodes.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          No promo codes created yet. Click "Create Single" or "Generate Batch" to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Code</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Discount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Uses</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Min Order</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Expires</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promoCodes.map((promo) => (
                <tr key={promo.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{promo.code}</code>
                      <button
                        onClick={() => copyToClipboard(promo.code)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Copy code"
                      >
                        {copiedCode === promo.code ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `MWK ${promo.discount_value.toLocaleString()}`}
                  </td>
                  <td className="px-4 py-3">
                    {promo.uses_count}{promo.max_uses ? ` / ${promo.max_uses}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    {promo.min_order_amount > 0 ? `MWK ${promo.min_order_amount.toLocaleString()}` : 'None'}
                  </td>
                  <td className="px-4 py-3">
                    {promo.expires_at ? new Date(promo.expires_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActiveStatus(promo.id, promo.is_active)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        promo.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {promo.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deletePromoCode(promo.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Single Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create Promo Code</h2>
              <button onClick={() => setShowCreateModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full p-2 border rounded"
                  placeholder="SUMMER20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (MWK)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Value</label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Order Amount (MWK)</label>
                <input
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Max Uses</label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Per User Limit</label>
                  <input
                    type="number"
                    value={formData.perUserLimit}
                    onChange={(e) => setFormData({ ...formData, perUserLimit: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expires At</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <button
                onClick={createPromoCode}
                className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Batch Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Generate Batch Codes</h2>
              <button onClick={() => setShowGenerateModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Number of Codes</label>
                  <input
                    type="number"
                    value={generateData.count}
                    onChange={(e) => setGenerateData({ ...generateData, count: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded"
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prefix (Optional)</label>
                  <input
                    type="text"
                    value={generateData.prefix}
                    onChange={(e) => setGenerateData({ ...generateData, prefix: e.target.value.toUpperCase() })}
                    className="w-full p-2 border rounded"
                    placeholder="SUMMER"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Type</label>
                  <select
                    value={generateData.discountType}
                    onChange={(e) => setGenerateData({ ...generateData, discountType: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (MWK)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Value</label>
                  <input
                    type="number"
                    value={generateData.discountValue}
                    onChange={(e) => setGenerateData({ ...generateData, discountValue: parseFloat(e.target.value) })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Order Amount (MWK)</label>
                <input
                  type="number"
                  value={generateData.minOrderAmount}
                  onChange={(e) => setGenerateData({ ...generateData, minOrderAmount: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Max Uses per Code</label>
                  <input
                    type="number"
                    value={generateData.maxUses}
                    onChange={(e) => setGenerateData({ ...generateData, maxUses: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Per User Limit</label>
                  <input
                    type="number"
                    value={generateData.perUserLimit}
                    onChange={(e) => setGenerateData({ ...generateData, perUserLimit: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expires At</label>
                <input
                  type="datetime-local"
                  value={generateData.expiresAt}
                  onChange={(e) => setGenerateData({ ...generateData, expiresAt: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <button
                onClick={generateBatchCodes}
                className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600"
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
