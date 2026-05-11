'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  Plus, Pencil, Trash2, X, Loader2, Package, Star, Upload,
  CheckCircle, Clock, AlertCircle, Ban
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'in_stock', label: 'In Stock', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  { value: 'out_of_stock', label: 'Out of Stock', color: 'text-red-600 bg-red-50', icon: Ban },
  { value: 'coming_soon', label: 'Coming Soon', color: 'text-yellow-600 bg-yellow-50', icon: Clock },
  { value: 'pre_order', label: 'Pre-Order', color: 'text-blue-600 bg-blue-50', icon: AlertCircle },
];

const EMPTY = {
  name: '',
  description: '',
  price_mwk: '',
  image_url: '',
  category_id: '',
  status: 'in_stock',
  stock_quantity: 0,
  is_featured: false,
  // Promo badge fields
  promo_badge_text: '',
  promo_badge_color: '#F97316',
  promo_badge_text_color: '#FFFFFF',
  promo_badge_font_size: 'text-xs',
  promo_badge_position: 'top-left',
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ]);
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      category_id: String(p.category_id || ''),
      status: p.status || 'in_stock',
      stock_quantity: p.stock_quantity || 0,
      is_featured: p.is_featured || false,
      promo_badge_text: p.promo_badge_text || '',
      promo_badge_color: p.promo_badge_color || '#F97316',
      promo_badge_text_color: p.promo_badge_text_color || '#FFFFFF',
      promo_badge_font_size: p.promo_badge_font_size || 'text-xs',
      promo_badge_position: p.promo_badge_position || 'top-left',
    });
    setImagePreview(p.image_url || '');
    setError('');
    setShowModal(true);
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategory }),
    });
    if (res.ok) {
      const category = await res.json();
      setCategories([...categories, category]);
      setForm(p => ({ ...p, category_id: String(category.id) }));
      setNewCategory('');
      setShowCategoryModal(false);
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const uploadToCloudinary = async (file: File) => {
    setUploadingImage(true);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setError('Cloudinary not configured');
      setUploadingImage(false);
      return;
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
        setForm(p => ({ ...p, image_url: data.secure_url }));
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setError('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadToCloudinary(file);
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
      fetchData();
    } else {
      const d = await res.json();
      setError(d.error || 'Failed to save product');
    }
    setSaving(false);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    if (!option) return null;
    const Icon = option.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${option.color}`}>
        <Icon size={12} /> {option.label}
      </span>
    );
  };

  const displayPrice = (price: number) => `MWK ${price.toLocaleString()}`;

  return (
    <div className="pt-16 lg:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]">Products</h1>
          <p className="text-gray-500 text-sm mt-1">
            {products.length} products • Manage inventory and categories
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
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Stock</th>
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
                            <Image src={p.image_url} alt={p.name} width={48} height={48} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={18} className="text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-[#111111]">{p.name}</p>
                          {p.description && (
                            <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">{p.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge bg-orange-50 text-orange-700">{p.category_name || p.category}</span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(p.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.stock_quantity ?? '-'}</td>
                    <td className="px-6 py-4 font-semibold text-[#F97316]">{displayPrice(Number(p.price ?? 0))}</td>
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
                        <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => deleteProduct(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
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

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-[#111111]">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="label">Product Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="input"
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
                    onChange={e => setForm(p => ({ ...p, price_mwk: e.target.value }))}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock_quantity}
                    onChange={e => setForm(p => ({ ...p, stock_quantity: parseInt(e.target.value) || 0 }))}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <div className="flex gap-2">
                    <select
                      value={form.category_id}
                      onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
                      className="input flex-1"
                    >
                      <option value="">Select category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="px-3 border rounded-xl hover:bg-gray-50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="input"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                    onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))}
                    className="w-4 h-4 text-[#F97316] rounded"
                  />
                  <span className="text-sm text-gray-600">Mark as featured</span>
                </label>
              </div>

              {/* Promo Badge Section */}
              <div className="border-t pt-4 mt-2">
                <label className="label text-sm font-medium">Promo Badge (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., -20%, Flash Sale, BOGO"
                  value={form.promo_badge_text}
                  onChange={e => setForm(p => ({ ...p, promo_badge_text: e.target.value }))}
                  className="input mb-2"
                />
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs">Badge Color</label>
                    <input
                      type="color"
                      value={form.promo_badge_color}
                      onChange={e => setForm(p => ({ ...p, promo_badge_color: e.target.value }))}
                      className="w-full h-8 border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs">Text Color</label>
                    <input
                      type="color"
                      value={form.promo_badge_text_color}
                      onChange={e => setForm(p => ({ ...p, promo_badge_text_color: e.target.value }))}
                      className="w-full h-8 border rounded"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs">Font Size</label>
                    <select
                      value={form.promo_badge_font_size}
                      onChange={e => setForm(p => ({ ...p, promo_badge_font_size: e.target.value }))}
                      className="input text-sm"
                    >
                      <option value="text-xs">Small</option>
                      <option value="text-sm">Medium</option>
                      <option value="text-base">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs">Position</label>
                    <select
                      value={form.promo_badge_position}
                      onChange={e => setForm(p => ({ ...p, promo_badge_position: e.target.value }))}
                      className="input text-sm"
                    >
                      <option value="top-left">Top Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Product Image</label>
                <div className="space-y-3">
                  {imagePreview && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 px-4 py-2 border rounded-xl hover:bg-gray-50">
                        <Upload size={16} />
                        <span className="text-sm">Upload</span>
                      </div>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                    <input
                      type="text"
                      value={form.image_url}
                      onChange={e => {
                        setForm(p => ({ ...p, image_url: e.target.value }));
                        setImagePreview(e.target.value);
                      }}
                      className="flex-1 input text-sm"
                      placeholder="Or paste image URL"
                    />
                  </div>
                  {uploadingImage && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="animate-spin" size={16} /> Uploading...
                    </div>
                  )}
                </div>
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-xl text-sm text-gray-600 hover:bg-gray-50"
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

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-lg mb-4">Add New Category</h2>
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="Category name"
              className="input mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCategoryModal(false)} className="flex-1 px-4 py-2 border rounded-xl">
                Cancel
              </button>
              <button onClick={addCategory} className="flex-1 btn-primary">
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
