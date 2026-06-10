'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Edit, X, CheckCircle, XCircle, Truck, Zap, Clock, ExternalLink, Upload, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

type DeliveryMethod = {
  id: number;
  name: string;
  logo_url: string | null;
  price: number;
  type: 'standard' | 'express';
  estimated_days: string | null;
  is_active: boolean;
  sort_order: number;
};

export default function AdminDeliveryPage() {
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<DeliveryMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [form, setForm] = useState({
    name: '',
    logo_url: '',
    price: 0,
    type: 'standard' as 'standard' | 'express',
    estimated_days: '',
    is_active: true,
    sort_order: 0,
  });

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/delivery-methods');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch');
      }
      const data = await res.json();
      setMethods(data);
    } catch (err: any) {
      console.error('Fetch error:', err);
      toast.error(err.message || 'Failed to load delivery methods');
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
      type: 'standard',
      estimated_days: '',
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
        type: method.type,
        estimated_days: method.estimated_days || '',
        is_active: method.is_active,
        sort_order: method.sort_order,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  // Upload logo to Cloudinary
  const uploadLogo = async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Upload service not configured');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!data.secure_url) throw new Error('Upload failed');
    return data.secure_url;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, WEBP, and SVG files are allowed');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const url = await uploadLogo(file);
      setForm(prev => ({ ...prev, logo_url: url }));
      toast.success('Logo uploaded successfully');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, WEBP, and SVG files are allowed');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      setUploadingLogo(true);
      try {
        const url = await uploadLogo(file);
        setForm(prev => ({ ...prev, logo_url: url }));
        toast.success('Logo uploaded successfully');
      } catch (err) {
        toast.error('Failed to upload logo');
      } finally {
        setUploadingLogo(false);
      }
    }
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
        logo_url: form.logo_url || null,
        price: form.price,
        type: form.type,
        estimated_days: form.estimated_days || null,
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
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }
      toast.success('Delivery method deleted');
      fetchMethods();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/delivery-methods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update status');
      }
      toast.success(`Method ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchMethods();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === 'express') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          <Zap size={12} /> Express
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        <Truck size={12} /> Standard
      </span>
    );
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
          <p className="text-xs text-gray-400 mt-1">These methods appear on the checkout page in sort order</p>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500">Total Methods</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{methods.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{methods.filter(m => m.is_active).length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500">Standard</p>
          <p className="text-2xl font-bold text-blue-600">{methods.filter(m => m.type === 'standard').length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500">Express</p>
          <p className="text-2xl font-bold text-purple-600">{methods.filter(m => m.type === 'express').length}</p>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr className="text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-6 py-4">Method</th>
                <th className="text-left px-6 py-4">Type</th>
                <th className="text-left px-6 py-4">Price (MWK)</th>
                <th className="text-left px-6 py-4">Est. Days</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-left px-6 py-4">Sort</th>
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
                  <td className="px-6 py-4">{getTypeBadge(method.type)}</td>
                  <td className="px-6 py-4 font-medium text-orange-600 dark:text-orange-400">
                    MWK {method.price.toLocaleString()}
                   </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {method.estimated_days || '-'}
                    </span>
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
                  <td className="px-6 py-4 text-gray-500">{method.sort_order}</td>
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
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeBadge(method.type)}
                  </div>
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
              {method.estimated_days && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Est. Delivery</span>
                  <span className="text-gray-700">{method.estimated_days}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Sort Order</span>
                <span className="text-gray-700">{method.sort_order}</span>
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

      {/* Modal - Add/Edit with Logo Upload */}
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
                  placeholder="e.g., CTS Courier"
                />
              </div>

              {/* Logo Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Logo
                </label>
                
                {/* Current Logo Preview */}
                {form.logo_url && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                      <Image src={form.logo_url} alt="Logo preview" width={48} height={48} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Current logo</p>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, logo_url: '' })}
                        className="text-xs text-red-500 hover:text-red-600 mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition cursor-pointer
                    ${dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400 bg-gray-50'}`}
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  {uploadingLogo ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin text-orange-500" size={20} />
                      <span className="text-sm text-gray-500">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${dragActive ? 'text-orange-500' : 'text-gray-400'}`} />
                      <p className="text-sm text-gray-600">Click or drag & drop to upload logo</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP, SVG up to 2MB</p>
                    </>
                  )}
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as 'standard' | 'express' })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800"
                  >
                    <option value="standard">Standard</option>
                    <option value="express">Express</option>
                  </select>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estimated Days
                </label>
                <input
                  type="text"
                  value={form.estimated_days}
                  onChange={(e) => setForm({ ...form, estimated_days: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:bg-gray-800"
                  placeholder="2-3 business days"
                />
                <p className="text-xs text-gray-400 mt-1">Example: "2-3 business days" or "Same day"</p>
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
