// app/admin/products/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Plus, Trash2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

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

export default function AdminProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: 0,
    compare_price: null as number | null,
    image_url: '',
    category_id: '',
    status: 'in_stock',
    stock_quantity: 0,
    is_featured: false,
  });

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, variantsRes, categoriesRes] = await Promise.all([
          fetch(`/api/admin/products/${productId}`),
          fetch(`/api/admin/products/${productId}/variants`),
          fetch('/api/categories'),
        ]);
        
        if (productRes.ok) {
          const productData = await productRes.json();
          setProduct(productData);
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
        console.error('Failed to fetch data:', err);
        toast.error('Failed to load product data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [productId]);

  const handleSaveProduct = async () => {
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
      toast.error('Failed to update variant');
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Delete this variant?')) return;
    
    try {
      const res = await fetch(`/api/admin/products/${productId}/variants?variantId=${variantId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setVariants(variants.filter(v => v.id !== variantId));
        toast.success('Variant deleted');
      } else {
        toast.error('Failed to delete variant');
      }
    } catch (err) {
      toast.error('Failed to delete variant');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-500 text-sm mt-1">Manage product details and variants</p>
      </div>

      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Product Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={4}
              value={product.description}
              onChange={(e) => setProduct({ ...product, description: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price (MWK) *</label>
              <input
                type="number"
                value={product.price}
                onChange={(e) => setProduct({ ...product, price: parseFloat(e.target.value) })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Compare Price (MWK)</label>
              <input
                type="number"
                value={product.compare_price || ''}
                onChange={(e) => setProduct({ ...product, compare_price: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <input
              type="text"
              value={product.image_url}
              onChange={(e) => setProduct({ ...product, image_url: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
            {product.image_url && (
              <div className="mt-2 w-32 h-32 relative rounded-lg overflow-hidden">
                <Image src={product.image_url} alt="Preview" fill className="object-cover" />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={product.category_id}
                onChange={(e) => setProduct({ ...product, category_id: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={product.status}
                onChange={(e) => setProduct({ ...product, status: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="coming_soon">Coming Soon</option>
                <option value="pre_order">Pre-Order</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={product.is_featured}
                onChange={(e) => setProduct({ ...product, is_featured: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Featured Product</span>
            </label>
          </div>
        </div>
      </div>

      {/* Variants Section */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Product Variants</h2>
          <button
            onClick={() => {
              setEditingVariant(null);
              setShowVariantModal(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
          >
            <Plus size={16} /> Add Variant
          </button>
        </div>
        
        {variants.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No variants yet. Add size/color options.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Size</th>
                  <th className="px-3 py-2 text-left">Color</th>
                  <th className="px-3 py-2 text-left">Price</th>
                  <th className="px-3 py-2 text-left">Stock</th>
                  <th className="px-3 py-2 text-left">SKU</th>
                  <th className="px-3 py-2 text-center">Active</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {variants.map((variant) => (
                  <tr key={variant.id}>
                    <td className="px-3 py-2">{variant.size || '-'}</td>
                    <td className="px-3 py-2">{variant.color || '-'}</td>
                    <td className="px-3 py-2">{variant.price_override ? `MWK ${variant.price_override}` : 'Default'}</td>
                    <td className="px-3 py-2">{variant.stock_quantity}</td>
                    <td className="px-3 py-2">{variant.sku || '-'}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${variant.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingVariant(variant);
                            setShowVariantModal(true);
                          }}
                          className="text-blue-500 hover:text-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteVariant(variant.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          Delete
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

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleSaveProduct}
          disabled={saving}
          className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Product'}
        </button>
        <button
          onClick={() => router.push('/admin/products')}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
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

function VariantModal({ 
  variant, 
  onSave, 
  onClose 
}: { 
  variant: Variant | null; 
  onSave: (data: any) => void; 
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    size: variant?.size || '',
    color: variant?.color || '',
    price_override: variant?.price_override || '',
    compare_price_override: variant?.compare_price_override || '',
    stock_quantity: variant?.stock_quantity || 0,
    sku: variant?.sku || '',
    image_url: variant?.image_url || '',
    is_active: variant?.is_active !== false,
    display_order: variant?.display_order || 0,
  });

  const handleSubmit = () => {
    const data: any = {};
    if (formData.size) data.size = formData.size;
    if (formData.color) data.color = formData.color;
    if (formData.price_override) data.price_override = parseFloat(formData.price_override);
    if (formData.compare_price_override) data.compare_price_override = parseFloat(formData.compare_price_override);
    data.stock_quantity = formData.stock_quantity;
    if (formData.sku) data.sku = formData.sku;
    if (formData.image_url) data.image_url = formData.image_url;
    data.is_active = formData.is_active;
    data.display_order = formData.display_order;
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{variant ? 'Edit Variant' : 'Add Variant'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Size</label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="S, M, L, XL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="Black, White, Red"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Price Override</label>
              <input
                type="number"
                value={formData.price_override}
                onChange={(e) => setFormData({ ...formData, price_override: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="Leave empty for default"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Compare Price</label>
              <input
                type="number"
                value={formData.compare_price_override}
                onChange={(e) => setFormData({ ...formData, compare_price_override: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Stock Quantity</label>
              <input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Variant Image URL</label>
            <input
              type="text"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">Active</span>
          </label>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleSubmit} className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600">
            {variant ? 'Update Variant' : 'Add Variant'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
