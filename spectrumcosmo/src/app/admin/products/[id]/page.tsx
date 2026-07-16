// app/admin/products/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Plus, Trash2, Save, X, Edit, ChevronDown, Package, Tag, Layers, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Types
interface Variant {
  id: string;
  size: string | null;
  color: string | null;
  price_override: number | null;
  compare_price_override: number | null;
  stock_quantity: number;
  sku: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
}

interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  compare_price: number | null;
  image_url: string;
  category_id: string;
  status: 'in_stock' | 'out_of_stock' | 'coming_soon' | 'pre_order';
  stock_quantity: number;
  is_featured: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface VariantFormData {
  size: string;
  color: string;
  price_override: string;
  compare_price_override: string;
  stock_quantity: number;
  sku: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
}

// Helper function to safely parse number from string or number
function safeParseFloat(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: 'MWK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const statusOptions = [
  { value: 'in_stock', label: 'In Stock', color: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' },
  { value: 'out_of_stock', label: 'Out of Stock', color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' },
  { value: 'coming_soon', label: 'Coming Soon', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' },
  { value: 'pre_order', label: 'Pre-Order', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400' },
];

export default function AdminProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [deletingVariantId, setDeletingVariantId] = useState<string | null>(null);
  
  const [product, setProduct] = useState<Product>({
    name: '',
    description: '',
    price: 0,
    compare_price: null,
    image_url: '',
    category_id: '',
    status: 'in_stock',
    stock_quantity: 0,
    is_featured: false,
  });

  const [categories, setCategories] = useState<Category[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [productRes, variantsRes, categoriesRes] = await Promise.all([
        fetch(`/api/admin/products/${productId}`),
        fetch(`/api/admin/products/${productId}/variants`),
        fetch('/api/categories'),
      ]);
      
      if (productRes.ok) {
        const productData = await productRes.json();
        setProduct(productData);
      } else {
        toast.error('Failed to load product');
      }
      
      if (variantsRes.ok) {
        const variantsData = await variantsRes.json();
        setVariants(variantsData);
      }
      
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch data:', errorMessage);
      toast.error('Failed to load product data');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveProduct = async () => {
    if (!product.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (product.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, ...product }),
      });
      
      if (res.ok) {
        toast.success('Product saved successfully');
        router.push('/admin/products');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save product');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Save error:', errorMessage);
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVariant = async (variantData: Omit<Variant, 'id'>) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(variantData),
      });
      
      if (res.ok) {
        const newVariant = await res.json();
        setVariants([...variants, newVariant]);
        toast.success('Variant added');
        setShowVariantModal(false);
        setEditingVariant(null);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to add variant');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Add variant error:', errorMessage);
      toast.error('Failed to add variant');
    }
  };

  const handleUpdateVariant = async (variantId: string, variantData: Partial<Variant>) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, ...variantData }),
      });
      
      if (res.ok) {
        const updatedVariant = await res.json();
        setVariants(variants.map(v => v.id === variantId ? updatedVariant : v));
        toast.success('Variant updated');
        setShowVariantModal(false);
        setEditingVariant(null);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update variant');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Update variant error:', errorMessage);
      toast.error('Failed to update variant');
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    const confirmed = window.confirm('Delete this variant? This action cannot be undone.');
    if (!confirmed) return;
    
    setDeletingVariantId(variantId);
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants?variantId=${variantId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setVariants(variants.filter(v => v.id !== variantId));
        toast.success('Variant deleted');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete variant');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Delete variant error:', errorMessage);
      toast.error('Failed to delete variant');
    } finally {
      setDeletingVariantId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[var(--primary)] w-8 h-8 mx-auto mb-3" />
          <p className="text-[var(--foreground-muted)]">Loading product...</p>
        </div>
      </div>
    );
  }

  const currentStatus = statusOptions.find(s => s.value === product.status) || statusOptions[0];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background-card)] border-b border-[var(--border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Edit Product</h1>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
                Manage product details, pricing, and inventory
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => router.push('/admin/products')}
                className="px-4 py-2 border border-[var(--border)] rounded-lg text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition min-h-[44px] text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition disabled:opacity-50 shadow-sm min-h-[44px] text-sm"
              >
                {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                  <h2 className="text-sm sm:text-base font-semibold text-[var(--foreground)]">Basic Information</h2>
                </div>
              </div>
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm"
                    placeholder="Enter product name"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={product.description}
                    onChange={(e) => setProduct({ ...product, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm resize-none"
                    placeholder="Product description..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] text-xs">MWK</span>
                      <input
                        type="number"
                        value={product.price}
                        onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-12 pr-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm"
                        step="100"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Compare at Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] text-xs">MWK</span>
                      <input
                        type="number"
                        value={product.compare_price || ''}
                        onChange={(e) => setProduct({ ...product, compare_price: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full pl-12 pr-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm"
                        step="100"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Category
                    </label>
                    <select
                      value={product.category_id}
                      onChange={(e) => setProduct({ ...product, category_id: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Status
                    </label>
                    <select
                      value={product.status}
                      onChange={(e) => setProduct({ ...product, status: e.target.value as Product['status'] })}
                      className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    Product Image URL
                  </label>
                  <input
                    type="text"
                    value={product.image_url}
                    onChange={(e) => setProduct({ ...product, image_url: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm"
                    placeholder="https://..."
                  />
                  {product.image_url && (
                    <div className="mt-3 w-24 h-24 sm:w-32 sm:h-32 relative rounded-lg overflow-hidden border border-[var(--border)]">
                      <Image src={product.image_url} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.is_featured}
                    onChange={(e) => setProduct({ ...product, is_featured: e.target.checked })}
                    className="w-4 h-4 text-[var(--primary)] rounded focus:ring-[var(--primary)]"
                  />
                  <span className="text-xs sm:text-sm text-[var(--foreground)]">Featured Product</span>
                </label>
              </div>
            </div>

            {/* Variants Section */}
            <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                  <h2 className="text-sm sm:text-base font-semibold text-[var(--foreground)]">Product Variants</h2>
                  <span className="text-xs text-[var(--foreground-muted)] bg-[var(--background-secondary)] px-2 py-0.5 rounded-full">
                    {variants.length}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setEditingVariant(null);
                    setShowVariantModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg text-sm font-medium transition min-h-[36px]"
                >
                  <Plus size={14} /> Add Variant
                </button>
              </div>
              
              {variants.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <Package className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--foreground-muted)] opacity-30 mx-auto mb-3" />
                  <p className="text-sm text-[var(--foreground-muted)]">No variants yet</p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-1">Add size, color, or other variations</p>
                  <button
                    onClick={() => {
                      setEditingVariant(null);
                      setShowVariantModal(true);
                    }}
                    className="mt-4 inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition"
                  >
                    <Plus size={14} /> Add First Variant
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm">
                    <thead className="bg-[var(--background-secondary)]">
                      <tr className="text-left text-[var(--foreground-muted)]">
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium">Size</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium">Color</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium">Price</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium">Stock</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium hidden sm:table-cell">SKU</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium text-center hidden md:table-cell">Status</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-xs font-medium text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {variants.map((variant) => (
                        <tr key={variant.id} className="hover:bg-[var(--background-secondary)] transition">
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-[var(--foreground)]">{variant.size || '-'}</td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-[var(--foreground)]">{variant.color || '-'}</td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
                            {variant.price_override ? (
                              <span className="text-[var(--primary)] font-medium text-sm">
                                {formatCurrency(variant.price_override)}
                              </span>
                            ) : (
                              <span className="text-[var(--foreground-muted)] text-xs">Default</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3">
                            <span className={`inline-flex items-center gap-1 text-sm ${variant.stock_quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              {variant.stock_quantity}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 font-mono text-xs text-[var(--foreground-muted)] hidden sm:table-cell">
                            {variant.sku || '-'}
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-center hidden md:table-cell">
                            <span className={`inline-block w-2 h-2 rounded-full ${variant.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          </td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 text-center">
                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                              <button
                                onClick={() => {
                                  setEditingVariant(variant);
                                  setShowVariantModal(true);
                                }}
                                className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition min-h-[32px] min-w-[32px]"
                                title="Edit variant"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteVariant(variant.id)}
                                disabled={deletingVariantId === variant.id}
                                className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition disabled:opacity-50 min-h-[32px] min-w-[32px]"
                                title="Delete variant"
                              >
                                {deletingVariantId === variant.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Product Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--foreground-muted)]">Current Status</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${currentStatus.color}`}>
                    {currentStatus.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--foreground-muted)]">Base Price</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{formatCurrency(product.price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--foreground-muted)]">Total Variants</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{variants.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--foreground-muted)]">Total Stock</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {variants.reduce((sum, v) => sum + v.stock_quantity, 0) + product.stock_quantity}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>Note:</strong> Variant prices override the base product price when selected. Leave price override empty to use the base price.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Variant Modal */}
      {showVariantModal && (
        <VariantModal
          variant={editingVariant}
          onSave={(data) => {
            if (editingVariant) {
              handleUpdateVariant(editingVariant.id, data);
            } else {
              handleAddVariant(data as Omit<Variant, 'id'>);
            }
          }}
          onClose={() => {
            setShowVariantModal(false);
            setEditingVariant(null);
          }}
        />
      )}
    </div>
  );
}

// Variant Modal Component
function VariantModal({ 
  variant, 
  onSave, 
  onClose 
}: { 
  variant: Variant | null; 
  onSave: (data: Partial<Variant>) => void; 
  onClose: () => void;
}) {
  const getVariantValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  const [formData, setFormData] = useState<VariantFormData>({
    size: variant?.size || '',
    color: variant?.color || '',
    price_override: getVariantValue(variant?.price_override),
    compare_price_override: getVariantValue(variant?.compare_price_override),
    stock_quantity: variant?.stock_quantity || 0,
    sku: variant?.sku || '',
    image_url: variant?.image_url || '',
    is_active: variant?.is_active !== false,
    display_order: variant?.display_order || 0,
  });

  const handleSubmit = () => {
    const data: Partial<Variant> = {};
    
    if (formData.size) data.size = formData.size;
    if (formData.color) data.color = formData.color;
    
    const priceOverride = safeParseFloat(formData.price_override);
    if (priceOverride !== null) data.price_override = priceOverride;
    
    const comparePriceOverride = safeParseFloat(formData.compare_price_override);
    if (comparePriceOverride !== null) data.compare_price_override = comparePriceOverride;
    
    data.stock_quantity = formData.stock_quantity;
    if (formData.sku) data.sku = formData.sku;
    if (formData.image_url) data.image_url = formData.image_url;
    data.is_active = formData.is_active;
    data.display_order = formData.display_order;
    
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[var(--background-card)] rounded-xl max-w-md w-full shadow-xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-[var(--border)] sticky top-0 bg-[var(--background-card)] z-10">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">
            {variant ? 'Edit Variant' : 'Add Variant'}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-[var(--background-secondary)] rounded-lg transition min-h-[36px] min-w-[36px]"
          >
            <X size={18} className="text-[var(--foreground-muted)]" />
          </button>
        </div>
        
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                Size
              </label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm"
                placeholder="S, M, L, XL"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                Color
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm"
                placeholder="Black, White, Red"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                Price Override
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] text-xs">MWK</span>
                <input
                  type="number"
                  value={formData.price_override}
                  onChange={(e) => setFormData({ ...formData, price_override: e.target.value })}
                  className="w-full pl-12 pr-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm"
                  placeholder="Leave empty for default"
                  step="100"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                Compare Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] text-xs">MWK</span>
                <input
                  type="number"
                  value={formData.compare_price_override}
                  onChange={(e) => setFormData({ ...formData, compare_price_override: e.target.value })}
                  className="w-full pl-12 pr-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm"
                  step="100"
                  min="0"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                Stock Quantity
              </label>
              <input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                SKU
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm"
                placeholder="Unique identifier"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
              Variant Image URL
            </label>
            <input
              type="text"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm"
              placeholder="https://..."
            />
            {formData.image_url && (
              <div className="mt-2 w-16 h-16 sm:w-20 sm:h-20 relative rounded-lg overflow-hidden border border-[var(--border)]">
                <Image src={formData.image_url} alt="Variant preview" fill className="object-cover" />
              </div>
            )}
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-[var(--primary)] rounded focus:ring-[var(--primary)]"
            />
            <span className="text-xs sm:text-sm text-[var(--foreground)]">Active (available for purchase)</span>
          </label>
        </div>
        
        <div className="flex gap-3 p-4 sm:p-5 border-t border-[var(--border)] sticky bottom-0 bg-[var(--background-card)]">
          <button 
            onClick={onClose} 
            className="flex-1 px-4 py-2.5 border border-[var(--border)] rounded-lg text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition min-h-[44px] text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-2.5 rounded-lg font-medium transition min-h-[44px] text-sm"
          >
            {variant ? 'Update Variant' : 'Add Variant'}
          </button>
        </div>
      </div>
    </div>
  );
}
