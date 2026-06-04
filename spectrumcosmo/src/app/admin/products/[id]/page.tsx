// app/admin/products/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } next/navigation';
import Image from 'next/image';
import { Loader2, Plus, Trash2, Save, X, Edit, ChevronDown, Package, Tag, Layers } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-orange-500 w-8 h-8 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  const currentStatus = statusOptions.find(s => s.value === product.status) || statusOptions[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Shopify-style Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Product</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage product details, pricing, and inventory
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin/products')}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition disabled:opacity-50 shadow-sm"
              >
                {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Product Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Basic Information</h2>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter product name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={5}
                    value={product.description}
                    onChange={(e) => setProduct({ ...product, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Product description..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">MWK</span>
                      <input
                        type="number"
                        value={product.price}
                        onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-12 pr-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500"
                        step="100"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Compare at Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">MWK</span>
                      <input
                        type="number"
                        value={product.compare_price || ''}
                        onChange={(e) => setProduct({ ...product, compare_price: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full pl-12 pr-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500"
                        step="100"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={product.category_id}
                      onChange={(e) => setProduct({ ...product, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={product.status}
                      onChange={(e) => setProduct({ ...product, status: e.target.value as Product['status'] })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Product Image URL
                  </label>
                  <input
                    type="text"
                    value={product.image_url}
                    onChange={(e) => setProduct({ ...product, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="https://..."
                  />
                  {product.image_url && (
                    <div className="mt-3 w-32 h-32 relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <Image src={product.image_url} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={product.is_featured}
                    onChange={(e) => setProduct({ ...product, is_featured: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Featured Product</span>
                </label>
              </div>
            </div>

            {/* Variants Section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-500" />
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Product Variants</h2>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{variants.length} variants</span>
                </div>
                <button
                  onClick={() => {
                    setEditingVariant(null);
                    setShowVariantModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition"
                >
                  <Plus size={14} /> Add Variant
                </button>
              </div>
              
              {variants.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No variants yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add size, color, or other variations</p>
                  <button
                    onClick={() => {
                      setEditingVariant(null);
                      setShowVariantModal(true);
                    }}
                    className="mt-4 inline-flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm"
                  >
                    <Plus size={14} /> Add First Variant
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr className="text-left text-gray-500 dark:text-gray-400">
                        <th className="px-4 py-3">Size</th>
                        <th className="px-4 py-3">Color</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </table>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {variants.map((variant) => (
                        <tr key={variant.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                          <td className="px-4 py-3 text-gray-900 dark:text-white">{variant.size || '-'}</td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white">{variant.color || '-'}</td>
                          <td className="px-4 py-3">
                            {variant.price_override ? (
                              <span className="text-orange-600 dark:text-orange-400 font-medium">
                                {formatCurrency(variant.price_override)}
                              </span>
                            ) : (
                              <span className="text-gray-400">Default</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 ${variant.stock_quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {variant.stock_quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">{variant.sku || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block w-2 h-2 rounded-full ${variant.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingVariant(variant);
                                  setShowVariantModal(true);
                                }}
                                className="p-1 text-blue-500 hover:text-blue-600 transition"
                                title="Edit variant"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteVariant(variant.id)}
                                disabled={deletingVariantId === variant.id}
                                className="p-1 text-red-500 hover:text-red-600 transition disabled:opacity-50"
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

          {/* Sidebar - Status Summary */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Product Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Current Status</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${currentStatus.color}`}>
                    {currentStatus.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Base Price</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(product.price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Variants</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{variants.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Stock</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {variants.reduce((sum, v) => sum + v.stock_quantity, 0) + product.stock_quantity}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Note:</strong> Variant prices override the base product price when selected. Leave price override empty to use the base price.
              </p>
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
  // Helper to safely get variant value
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
    
    // Safely parse price values
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {variant ? 'Edit Variant' : 'Add Variant'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Size
              </label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="S, M, L, XL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Black, White, Red"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price Override
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">MWK</span>
                <input
                  type="number"
                  value={formData.price_override}
                  onChange={(e) => setFormData({ ...formData, price_override: e.target.value })}
                  className="w-full pl-12 pr-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Leave empty for default"
                  step="100"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Compare Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">MWK</span>
                <input
                  type="number"
                  value={formData.compare_price_override}
                  onChange={(e) => setFormData({ ...formData, compare_price_override: e.target.value })}
                  className="w-full pl-12 pr-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500"
                  step="100"
                  min="0"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SKU
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Unique identifier"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Variant Image URL
            </label>
            <input
              type="text"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="https://..."
            />
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Active (available for purchase)</span>
          </label>
        </div>
        
        <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-800">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Cancel
          </button>
          <button onClick={handleSubmit} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium transition">
            {variant ? 'Update Variant' : 'Add Variant'}
          </button>
        </div>
      </div>
    </div>
  );
}
