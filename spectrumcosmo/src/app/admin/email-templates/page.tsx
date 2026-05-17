'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Pencil, Trash2, X, Eye } from 'lucide-react';

type EmailTemplate = {
  id: number;
  name: string;
  slug: string;
  description: string;
  status_id: number;
  category_id: number;
  subject: string;
  html_content: string;
  text_content: string;
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

const EMPTY_TEMPLATE = {
  name: '',
  slug: '',
  description: '',
  status_id: 0,
  category_id: 0,
  subject: '',
  html_content: '',
  text_content: '',
  is_active: true,
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState(EMPTY_TEMPLATE);
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesRes, statusesRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/email-templates'),
        fetch('/api/admin/order-statuses'),
        fetch('/api/admin/template-categories'),
      ]);
      setTemplates(await templatesRes.json());
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
    setForm(EMPTY_TEMPLATE);
    setShowModal(true);
  };

  const openEdit = (template: EmailTemplate) => {
    setEditing(template);
    setForm({
      name: template.name,
      slug: template.slug,
      description: template.description || '',
      status_id: template.status_id,
      category_id: template.category_id,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content || '',
      is_active: template.is_active,
    });
    setShowModal(true);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleSave = async () => {
    if (!form.name || !form.subject || !form.html_content) {
      setMessage({ type: 'error', text: 'Name, subject, and HTML content are required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const method = editing ? 'PATCH' : 'POST';
    const body = editing 
      ? { id: editing.id, ...form, slug: form.slug || generateSlug(form.name) }
      : { ...form, slug: generateSlug(form.name) };

    try {
      const res = await fetch('/api/admin/email-templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
        setMessage({ type: 'success', text: `Template ${editing ? 'updated' : 'added'} successfully!` });
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

  const deleteTemplate = async (id: number) => {
    if (!confirm('Delete this template?')) return;
    await fetch(`/api/admin/email-templates?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const getStatusName = (id: number) => {
    return statuses.find(s => s.id === id)?.name || 'All Statuses';
  };

  const getCategoryName = (id: number) => {
    return categories.find(c => c.id === id)?.name || 'General';
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
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage email templates sent to customers when order status changes.
          </p>
        </div>
        <button onClick={openAdd} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
          <Plus size={16} /> Add Template
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
                <th className="text-left px-6 py-3">Subject</th>
                <th className="text-left px-6 py-3">Active</th>
                <th className="text-right px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No email templates yet. Click "Add Template" to create one.
                   </td>
                </tr>
              ) : (
                templates.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm text-gray-800">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.slug}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                        {getStatusName(t.status_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{getCategoryName(t.category_id)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{t.subject}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {t.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setPreviewHtml(t.html_content)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => openEdit(t)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => deleteTemplate(t.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
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
      {previewHtml && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPreviewHtml(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg">Email Preview</h3>
              <button onClick={() => setPreviewHtml(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-4" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-[#111111]">{editing ? 'Edit Template' : 'Add Template'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Template Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input"
                    placeholder="e.g., Payment Approved"
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
                <label className="label">Subject *</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="input"
                  placeholder="e.g., Your order has been approved!"
                />
              </div>

              <div>
                <label className="label">HTML Content *</label>
                <textarea
                  value={form.html_content}
                  onChange={(e) => setForm({ ...form, html_content: e.target.value })}
                  rows={10}
                  className="input font-mono text-sm"
                  placeholder="<h1>Hello {{customer_name}}</h1><p>Your order #{{order_number}} is now approved.</p>"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Placeholders: {'{{customer_name}}'}, {'{{order_number}}'}, {'{{total_amount}}'}, {'{{delivery_address}}'}, {'{{estimated_delivery}}'}
                </p>
              </div>

              <div>
                <label className="label">Plain Text (fallback)</label>
                <textarea
                  value={form.text_content}
                  onChange={(e) => setForm({ ...form, text_content: e.target.value })}
                  rows={4}
                  className="input font-mono text-sm"
                  placeholder="Plain text version for email clients that don't support HTML..."
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded"
                  />
                  <span className="text-sm text-gray-600">Active (use this template)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-xl text-sm">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-500 text-white rounded-xl py-2 text-sm font-medium">
                  {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : (editing ? 'Save Changes' : 'Add Template')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
