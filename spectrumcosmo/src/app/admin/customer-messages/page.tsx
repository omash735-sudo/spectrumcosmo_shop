'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Pencil, Trash2, X, Eye } from 'lucide-react';

type CustomerMessage = {
  id: number;
  name: string;
  slug: string;
  status_id: number;
  category_id: number;
  title: string;
  message: string;
  instructions: string;
  button_text: string;
  button_link: string;
  html_content: string;
  progress_step: number;
  is_active: boolean;
  status_name?: string;
  category_name?: string;
};

type Status = {
  id: number;
  name: string;
};

type Category = {
  id: number;
  name: string;
};

const EMPTY_MESSAGE = {
  name: '',
  slug: '',
  status_id: 0,
  category_id: 0,
  title: '',
  message: '',
  instructions: '',
  button_text: '',
  button_link: '',
  html_content: '',
  progress_step: 0,
  is_active: true,
};

export default function CustomerMessagesPage() {
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CustomerMessage | null>(null);
  const [form, setForm] = useState(EMPTY_MESSAGE);
  const [saving, setSaving] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [messagesRes, statusesRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/customer-messages'),
        fetch('/api/admin/order-statuses'),
        fetch('/api/admin/template-categories'),
      ]);
      setMessages(await messagesRes.json());
      setStatuses(await statusesRes.json());
      setCategories(await categoriesRes.json());
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_MESSAGE);
    setShowModal(true);
  };

  const openEdit = (msg: CustomerMessage) => {
    setEditing(msg);
    setForm({
      name: msg.name,
      slug: msg.slug,
      status_id: msg.status_id,
      category_id: msg.category_id,
      title: msg.title || '',
      message: msg.message,
      instructions: msg.instructions || '',
      button_text: msg.button_text || '',
      button_link: msg.button_link || '',
      html_content: msg.html_content || '',
      progress_step: msg.progress_step || 0,
      is_active: msg.is_active,
    });
    setShowModal(true);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleSave = async () => {
    if (!form.name || !form.message) {
      setMessage({ type: 'error', text: 'Name and message are required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const method = editing ? 'PATCH' : 'POST';
    const body = editing 
      ? { id: editing.id, ...form, slug: form.slug || generateSlug(form.name) }
      : { ...form, slug: generateSlug(form.name) };

    try {
      const res = await fetch('/api/admin/customer-messages', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
        setMessage({ type: 'success', text: `Message ${editing ? 'updated' : 'added'} successfully!` });
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

  const deleteMessage = async (id: number) => {
    if (!confirm('Delete this message?')) return;
    await fetch(`/api/admin/customer-messages?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const getStatusName = (id: number) => {
    const found = statuses.find(s => s.id === id);
    return found ? found.name : 'All Statuses';
  };

  const getCategoryName = (id: number) => {
    const found = categories.find(c => c.id === id);
    return found ? found.name : 'General';
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
          <h1 className="text-2xl font-bold text-gray-900">Customer Messages</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage messages shown to customers on their order page based on order status.
          </p>
        </div>
        <button onClick={openAdd} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
          <Plus size={16} /> Add Message
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
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Category</th>
                <th className="text-left px-6 py-3">Message Preview</th>
                <th className="text-left px-6 py-3">Active</th>
                <th className="text-right px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No customer messages yet. Click "Add Message" to create one.
                   </td>
                </tr>
              ) : (
                messages.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm text-gray-800">{m.name}</p>
                      <p className="text-xs text-gray-400">{m.slug}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                        {getStatusName(m.status_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{getCategoryName(m.category_id)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">{m.message}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {m.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setPreviewMessage(m.message)} 
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          onClick={() => openEdit(m)} 
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                        >
                          <Pencil size={15} />
                        </button>
                        <button 
                          onClick={() => deleteMessage(m.id)} 
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                        >
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

      {/* Preview Modal */}
      {previewMessage && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPreviewMessage(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Message Preview</h3>
              <button onClick={() => setPreviewMessage(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-gray-700 whitespace-pre-wrap">{previewMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-[#111111]">{editing ? 'Edit Message' : 'Add Message'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Message Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input"
                    placeholder="e.g., Payment Approved Message"
                  />
                </div>
                <div>
                  <label className="label">Slug</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
                    className="input"
                    placeholder="payment-approved"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Order Status</label>
                  <select
                    value={form.status_id}
                    onChange={(e) => setForm({ ...form, status_id: parseInt(e.target.value) })}
                    className="input"
                  >
                    <option value={0}>All Statuses</option>
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Category</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: parseInt(e.target.value) })}
                    className="input"
                  >
                    <option value={0}>General</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Title (optional)</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input"
                  placeholder="e.g., Payment Approved!"
                />
              </div>

              <div>
                <label className="label">Message Content *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4}
                  className="input"
                  placeholder="Your payment has been approved. Your order is now being processed."
                />
              </div>

              <div>
                <label className="label">Instructions (optional)</label>
                <textarea
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  rows={2}
                  className="input"
                  placeholder="Upload proof of payment here if not already done..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Button Text (optional)</label>
                  <input
                    value={form.button_text}
                    onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                    className="input"
                    placeholder="e.g., Upload Proof"
                  />
                </div>
                <div>
                  <label className="label">Button Link (optional)</label>
                  <input
                    value={form.button_link}
                    onChange={(e) => setForm({ ...form, button_link: e.target.value })}
                    className="input"
                    placeholder="/account/orders/upload"
                  />
                </div>
              </div>

              <div>
                <label className="label">HTML Content (optional)</label>
                <textarea
                  value={form.html_content}
                  onChange={(e) => setForm({ ...form, html_content: e.target.value })}
                  rows={4}
                  className="input font-mono text-sm"
                  placeholder='<div class="alert">Custom HTML block</div>'
                />
              </div>

              <div>
                <label className="label">Progress Step (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.progress_step}
                  onChange={(e) => setForm({ ...form, progress_step: parseInt(e.target.value) || 0 })}
                  className="input"
                />
                <p className="text-xs text-gray-400 mt-1">Used for progress bar on order tracking page.</p>
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
                  {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : (editing ? 'Save Changes' : 'Add Message')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
