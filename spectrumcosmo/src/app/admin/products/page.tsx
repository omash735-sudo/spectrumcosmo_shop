'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, X, Loader2, Package, Star, Upload } from 'lucide-react';
import { formatCurrencyAmount } from '@/lib/currency';
import { useCurrency } from '@/components/storefront/CurrencyProvider';

const CATEGORIES = ['T-Shirts', 'Hoodies', 'Pendants', 'Bracelets'];
const EMPTY = {
  name: '',
  description: '',
  price_mwk: '',
  image_url: '',
  category: 'T-Shirts',
  is_featured: false,
};

export default function AdminProductsPage() {
  const { currency, rates } = useCurrency();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setImagePreview('');
    setError('');
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      price_mwk: String(p.price),
      image_url: p.image_url || '',
      category: p.category,
      is_featured: p.is_featured || false,
    });
    setImagePreview(p.image_url || '');
    setError('');
    setShowModal(true);
  };

  const uploadToCloudinary = async (file: File) => {
    setUploadingImage(true);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setError('Cloudinary not configured.');
      setUploadingImage(false);
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setImagePreview(data.secure_url);
        setForm((p) => ({ ...p, image_url: data.secure_url }));
        return data.secure_url;
      }
      throw new Error('Upload failed');
    } catch (err) {
      setError('Image upload failed. Please try again.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadToCloudinary(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const method = editing ? 'PATCH' : 'POST';
    const body = editing ? { id: editing.id, ...form } : form;

    const res = await fetch('/api/products', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setShowModal(false);
      fetchProducts();
    } else {
      const d = await res.json();
      setError(d.error || 'Failed to save product');
    }
    setSaving(false);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    fetchProducts();
  };

  // Display price in MWK (admin sees MWK directly from DB)
  const displayPrice = (price: number) => {
    return `MWK ${price.toLocaleString()}`;
  };

  return (
    <div className="pt-16 lg:pt-0">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Products</h1>
          <p className="text-gray-500 text-sm mt-1">
            {products.length} products in your store • Prices are in MWK (Malawi Kwacha)
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#F97316]" size={32} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No products yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                  <th className="text-left px-6 py-3">Product</th>
                  <th className="text-left px-6 py-3">Category</th>
                  <th className="text-left px-6 py-3">Price (MWK)</th>
                  <th className="text-left px-6 py-3">Featured</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          {p.image_url ? (
                            <Image
                              src={p.image_url}
                              alt={p.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={18} className="text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-[#111111]">{p.name}</p>
                          {p.description && (
                            <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">
                              {p.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge bg-orange-50 text-orange-700">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#F97316]">
                      {displayPrice(Number(p.price ?? 0))}
                    </td>
                    <td className="px-6 py-4">
                      {p.is_featured ? (
                        <span className="flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full w-fit">
                          <Star size={12} fill="currentColor" /> Featured
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-bold text-[#111111]">
                {editing ? 'Edit Product' : 'Add Product'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="label">Product Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  className="input"
                  placeholder="e.g., Anime Mug"
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="input resize-none"
                  placeholder="Product description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Price (MWK) *</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={form.price_mwk}
                    onChange={(e) => setForm((p) => ({ ...p, price_mwk: e.target.value }))}
                    required
                    className="input"
                    placeholder="e.g., 25000"
                  />
                  <p className="text-xs text-gray-400 mt-1">Enter price in Malawi Kwacha (MWK)</p>
                </div>
                <div>
                  <label className="label">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className="input"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <Star size={14} /> Featured Product
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
                    className="w-4 h-4 text-[#F97316] rounded border-gray-300 focus:ring-[#F97316]"
                  />
                  <span className="text-sm text-gray-600">
                    Mark as featured (appears in featured section)
                  </span>
                </label>
              </div>

              {/* Image Upload */}
              <div>
                <label className="label">Product Image</label>
                <div className="space-y-3">
                  {imagePreview && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                        <Upload size={16} />
                        <span className="text-sm">Upload from device</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={form.image_url}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, image_url: e.target.value }));
                        setImagePreview(e.target.value);
                      }}
                      className="flex-1 input text-sm"
                      placeholder="Or paste image URL"
                    />
                  </div>
                  {uploadingImage && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="animate-spin" size={16} />
                      Uploading to Cloudinary...
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-primary justify-center text-sm py-2.5"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : editing ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
