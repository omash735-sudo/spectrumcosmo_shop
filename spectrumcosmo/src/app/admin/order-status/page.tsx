'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Pencil, Trash2, X, Save, Eye } from 'lucide-react';

type OrderStatus = {
  id: number;
  status: string;
  customer_message: string;
  admin_instructions: string;
  email_subject: string;
  email_template: string;
  estimated_days: number;
  display_order: number;
  is_active: boolean;
};

const EMPTY_STATUS = {
  status: '',
  customer_message: '',
  admin_instructions: '',
  email_subject: '',
  email_template: '',
  estimated_days: 0,
  display_order: 0,
  is_active: true,
};

export default function OrderStatusPage() {
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<OrderStatus | null>(null);
  const [form, setForm] = useState(EMPTY_STATUS);
  const [saving, setSaving] = useState(false);
  const [previewStatus, setPreviewStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/order-status');
      const data = await res.json();
      setStatuses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_STATUS);
    setShowModal(true);
  };

  const openEdit = (status: OrderStatus) => {
    setEditing(status);
    setForm({
      status: status.status,
      customer_message: status.customer_message,
      admin_instructions: status.admin_instructions || '',
      email_subject: status.email_subject || '',
      email_template: status.email_template || '',
      estimated_days: status.estimated_days,
      display_order: status.display_order,
      is_active: status.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.status || !form.customer_message) {
      setMessage({ type: 'error', text: 'Status name and customer message are required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const method = editing ? 'PATCH' : 'POST';
    const body = editing ? { id: editing.id, ...form } : form;

    try {
      const res = await fetch('/api/admin/order-status', {
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

  const deleteStatus = async (id: number) => {
    if (!confirm('Delete this status? This may affect existing orders.')) return;
    const res = await fetch(`/api/admin/order-status?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchStatuses();
    }
  };

  const toggleActive = async (id: number, currentActive: boolean) => {
    await fetch('/api/admin/order-status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !currentActive }),
    });
    fetchStatuses();
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
          <h1 className="text-2xl font-bold text-gray-900">Order Status Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Customize what customers see at each order stage. Messages support HTML.
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
                <th className="text-left px-6 py-3">Customer Message</th>
                <th className="text-left px-6 py-3">Est. Days</th>
                <th className="text-left px-6 py-3">Active</th>
                <th className="text-right px-6 py-3">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {statuses.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-800 capitalize">{s.status.replace(/_/g, ' ')}</span>
                   </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                    <p className="truncate">{s.customer_message}</p>
                   </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.estimated_days} days</td>
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
                      <button onClick={() => setPreviewStatus(s.customer_message)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                        <Eye size={15} />
                      </button>
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

      {/* Preview Modal */}
      {previewStatus && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPreviewStatus(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Preview Customer Message</h3>
              <button onClick={() => setPreviewStatus(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-gray-700 whitespace-pre-wrap">{previewStatus}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-[#111111]">{editing ? 'Edit Status' : 'Add Status'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Status Key *</label>
                  <input
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="input"
                    placeholder="e.g., awaiting_verification"
                    disabled={!!editing}
                  />
                  <p className="text-xs text-gray-400 mt-1">Lowercase with underscores (e.g., shipped, delivered)</p>
                </div>
                <div>
                  <label className="label">Display Order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Estimated Days (for delivery)</label>
                <input
                  type="number"
                  value={form.estimated_days}
                  onChange={(e) => setForm({ ...form, estimated_days: parseInt(e.target.value) || 0 })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Customer Message *</label>
                <textarea
                  value={form.customer_message}
                  onChange={(e) => setForm({ ...form, customer_message: e.target.value })}
                  rows={3}
                  className="input"
                  placeholder="What customers see when order status changes to this..."
                />
                <p className="text-xs text-gray-400 mt-1">Supports HTML (e.g., <strong>bold</strong>, &lt;a href=""&gt;links&lt;/a&gt;)</p>
              </div>

              <div>
                <label className="label">Admin Instructions</label>
                <textarea
                  value={form.admin_instructions}
                  onChange={(e) => setForm({ ...form, admin_instructions: e.target.value })}
                  rows={2}
                  className="input"
                  placeholder="Internal notes for admin when this status is applied..."
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-3">Email Settings (Optional)</h3>
                <div>
                  <label className="label">Email Subject</label>
                  <input
                    value={form.email_subject}
                    onChange={(e) => setForm({ ...form, email_subject: e.target.value })}
                    className="input"
                    placeholder="e.g., Your order has been shipped!"
                  />
                </div>
                <div className="mt-3">
                  <label className="label">Email Template</label>
                  <textarea
                    value={form.email_template}
                    onChange={(e) => setForm({ ...form, email_template: e.target.value })}
                    rows={5}
                    className="input font-mono text-sm"
                    placeholder="Use placeholders: {{customer_name}}, {{order_number}}, {{total_amount}}, {{delivery_address}}"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Available placeholders: <code className="bg-gray-100 px-1">{"{{customer_name}}"}</code>, <code className="bg-gray-100 px-1">{"{{order_number}}"}</code>, <code className="bg-gray-100 px-1">{"{{total_amount}}"}</code>, <code className="bg-gray-100 px-1">{"{{delivery_address}}"}</code>, <code className="bg-gray-100 px-1">{"{{estimated_delivery}}"}</code>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded"
                  />
                  <span className="text-sm text-gray-600">Active (show in order status options)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-xl text-sm">Cancel</button>
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
