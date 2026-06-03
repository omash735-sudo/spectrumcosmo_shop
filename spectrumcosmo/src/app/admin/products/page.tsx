'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Plus, Pencil, Trash2, X, Loader2, Package, Star, Upload,
  CheckCircle, Clock, AlertCircle, Ban, TrendingUp, Copy,
  Grid3X3, List, ChevronDown, Eye, MoreVertical, 
  ExternalLink, Archive, Copy as Duplicate, Tag,
  ShoppingBag, AlertTriangle, ArrowUp, ArrowDown
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'in_stock', label: 'In Stock', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  { value: 'out_of_stock', label: 'Out of Stock', color: 'bg-red-100 text-red-700', icon: Ban },
  { value: 'coming_soon', label: 'Coming Soon', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  { value: 'pre_order', label: 'Pre-Order', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
];

const EMPTY = {
  name: '',
  description: '',
  price_mwk: '',
  compare_price_mwk: '',
  image_url: '',
  category_id: '',
  status: 'in_stock',
  stock_quantity: 0,
  is_featured: false,
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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFeatured, setFilterFeatured] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/categories'),
      ]);
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error('Failed to fetch data', err);
      setProducts([]);
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
      name: p.name || '',
      description: p.description || '',
      price_mwk: String(p.price || ''),
      compare_price_mwk: p.compare_price ? String(p.compare_price) : '',
      image_url: p.image_url || '',
      category_id: String(p.category_id || ''),
      status: p.status || 'in_stock',
      stock_quantity: p.stock_quantity || 0,
      is_featured: p.is_featured || false,
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

    const payload = {
      ...form,
      price_mwk: parseFloat(form.price_mwk),
      compare_price_mwk: form.compare_price_mwk ? parseFloat(form.compare_price_mwk) : null,
      stock_quantity: parseInt(String(form.stock_quantity)) || 0,
    };

    const method = editing ? 'PATCH' : 'POST';
    const body = editing ? { id: editing.id, ...payload } : payload;

    const res = await fetch('/api/admin/products', {
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
    if (!confirm('Delete this product? This will also delete all its variants.')) return;
    await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    await fetch(`/api/admin/products`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_featured: !currentStatus }),
    });
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    if (!option) return null;
    const Icon = option.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${option.color}`}>
        <Icon size={12} /> {option.label}
      </span>
    );
  };

  const getStockBadge = (stock: number, status: string) => {
    if (status === 'out_of_stock' || stock === 0) {
      return <span className="inline-flex items-center gap-1 text-xs text-red-600"><Ban size={12} /> Out of Stock</span>;
    }
    if (stock <= 5) {
      return <span className="inline-flex items-center gap-1 text-xs text-orange-600"><AlertTriangle size={12} /> Low Stock ({stock})</span>;
    }
    return <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle size={12} /> In Stock ({stock})</span>;
  };

  const displayPrice = (price: number) => `MWK ${price?.toLocaleString() || 0}`;

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc': return (a.price || 0) - (b.price || 0);
      case 'price_desc': return (b.price || 0) - (a.price || 0);
      case 'stock_asc': return (a.stock_quantity || 0) - (b.stock_quantity || 0);
      case 'stock_desc': return (b.stock_quantity || 0) - (a.stock_quantity || 0);
      case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const filteredProducts = sortedProducts.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.category_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesFeatured = filterFeatured === 'all' || 
                           (filterFeatured === 'featured' && p.is_featured) ||
                           (filterFeatured === 'not_featured' && !p.is_featured);
    return matchesSearch && matchesStatus && matchesFeatured;
  });

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleSelectProduct = (id: string) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(p => p !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedProducts.length} products?`)) return;
    for (const id of selectedProducts) {
      await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
    }
    setSelectedProducts([]);
    fetchData();
  };

  const bulkFeature = async (featured: boolean) => {
    for (const id of selectedProducts) {
      await fetch(`/api/admin/products`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_featured: featured }),
      });
    }
    setSelectedProducts([]);
    fetchData();
  };

  const stats = {
    total: products.length,
    inStock: products.filter(p => p.status === 'in_stock' && (p.stock_quantity || 0) > 0).length,
    lowStock: products.filter(p => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 5).length,
    outOfStock: products.filter(p => p.status === 'out_of_stock' || (p.stock_quantity || 0) === 0).length,
    featured: products.filter(p => p.is_featured).length,
    totalValue: products.reduce((sum, p) => sum + (p.price || 0) * (p.stock_quantity || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-8">
        <div className="max-w-[1400px] mx-auto">
          
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-500 text-sm mt-1">Manage your product catalog, inventory, and variants</p>
            </div>
            <button 
              onClick={openAdd} 
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-sm shadow-orange-200"
            >
              <Plus size={16} /> Add Product
            </button>
          </div>

          {/* Stats Cards - Premium */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500">Total Products</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Package size={18} className="text-gray-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
                  <p className="text-xs text-gray-500">In Stock</p>
                </div>
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle size={18} className="text-green-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.lowStock}</p>
                  <p className="text-xs text-gray-500">Low Stock</p>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                  <AlertTriangle size={18} className="text-orange-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                  <p className="text-xs text-gray-500">Out of Stock</p>
                </div>
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                  <Ban size={18} className="text-red-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.featured}</p>
                  <p className="text-xs text-gray-500">Featured</p>
                </div>
                <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
                  <Star size={18} className="text-yellow-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalValue.toLocaleString()} MWK</p>
                  <p className="text-xs text-gray-500">Inventory Value</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <TrendingUp size={18} className="text-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters Bar - Premium */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Status</option>
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="coming_soon">Coming Soon</option>
                  <option value="pre_order">Pre-Order</option>
                </select>
                <select
                  value={filterFeatured}
                  onChange={(e) => setFilterFeatured(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Products</option>
                  <option value="featured">Featured Only</option>
                  <option value="not_featured">Non-Featured</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="stock_asc">Stock: Low to High</option>
                  <option value="stock_desc">Stock: High to Low</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-white">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded transition ${viewMode === 'table' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Grid3X3 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedProducts.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === filteredProducts.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-orange-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-orange-800">{selectedProducts.length} selected</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => bulkFeature(true)} className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition">
                  Mark Featured
                </button>
                <button onClick={() => bulkFeature(false)} className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                  Remove Featured
                </button>
                <button onClick={bulkDelete} className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition">
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Products Display */}
          {loading ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-2xl border">
              <Loader2 className="animate-spin text-orange-500" size={40} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border">
              <Package size={48} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No products found.</p>
              <button onClick={openAdd} className="mt-4 text-orange-500 hover:text-orange-600 text-sm">
                Add your first product →
              </button>
            </div>
          ) : viewMode === 'table' ? (
            /* Premium Table View */
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 sticky top-0">
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Featured</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Variants</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition group">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(p.id)}
                            onChange={() => handleSelectProduct(p.id)}
                            className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative group/image">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                {p.image_url ? (
                                  <Image src={p.image_url} alt={p.name} width={48} height={48} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package size={18} className="text-gray-300" />
                                  </div>
                                )}
                              </div>
                              <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover/image:opacity-100 transition flex items-center justify-center">
                                <Eye size={14} className="text-white" />
                              </div>
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-900 line-clamp-1">{p.name}</p>
                              {p.description && (
                                <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">{p.description.substring(0, 60)}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-orange-50 text-orange-700">
                            <Tag size={10} /> {p.category_name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-orange-600 text-sm">{displayPrice(p.price)}</span>
                            {p.compare_price && (
                              <span className="text-xs text-gray-400 line-through">{displayPrice(p.compare_price)}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getStockBadge(p.stock_quantity || 0, p.status)}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(p.status)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleFeatured(p.id, p.is_featured)}
                            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all duration-200 ${
                              p.is_featured 
                                ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' 
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            <Star size={12} fill={p.is_featured ? 'currentColor' : 'none'} />
                            {p.is_featured ? 'Featured' : 'Mark'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/products/${p.id}/variants`}
                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition"
                          >
                            <Grid3X3 size={12} /> {p.variant_count || 0} variants
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative flex justify-end">
                            <button
                              onClick={() => setActionMenuOpen(actionMenuOpen === p.id ? null : p.id)}
                              className="p-2 rounded-lg hover:bg-gray-100 transition"
                            >
                              <MoreVertical size={16} className="text-gray-500" />
                            </button>
                            {actionMenuOpen === p.id && (
                              <div className="absolute right-0 top-8 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 animate-slide-down">
                                <Link href={`/products/${p.id}`} target="_blank" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                  <ExternalLink size={14} /> View on Store
                                </Link>
                                <Link href={`/admin/products/${p.id}/variants`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                  <Grid3X3 size={14} /> Manage Variants
                                </Link>
                                <button onClick={() => { openEdit(p); setActionMenuOpen(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                  <Pencil size={14} /> Edit Product
                                </button>
                                <div className="border-t my-1"></div>
                                <button onClick={() => deleteProduct(p.id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Premium Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map((p) => (
                <div key={p.id} className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                    {p.image_url ? (
                      <Image src={p.image_url} alt={p.name} fill className="object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={40} className="text-gray-300" />
                      </div>
                    )}
                    {p.is_featured && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <Star size={10} fill="white" /> Featured
                      </div>
                    )}
                    {p.status === 'out_of_stock' && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-white text-gray-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-base line-clamp-1 group-hover:text-orange-500 transition">
                      {p.name}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className="text-orange-600 font-bold text-lg">{displayPrice(p.price)}</span>
                        {p.compare_price && (
                          <span className="text-xs text-gray-400 line-through ml-2">{displayPrice(p.compare_price)}</span>
                        )}
                      </div>
                      {getStatusBadge(p.status)}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      {getStockBadge(p.stock_quantity || 0, p.status)}
                      <span className="text-xs text-gray-400">SKU: {p.sku || `PROD-${p.id.slice(0, 6)}`}</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => openEdit(p)} className="flex-1 text-center text-sm bg-gray-100 hover:bg-orange-500 hover:text-white py-2 rounded-lg transition-all duration-200 font-medium">
                        Edit
                      </button>
                      <button onClick={() => deleteProduct(p.id)} className="flex-1 text-center text-sm bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg transition font-medium">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-gray-900 text-lg">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  placeholder="e.g., Anime Hoodie - Gojo Edition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  placeholder="Product description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (MWK) *</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={form.price_mwk}
                    onChange={e => setForm(p => ({ ...p, price_mwk: e.target.value }))}
                    required
                    className="w-full p-2.5 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compare Price (optional)</label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={form.compare_price_mwk}
                    onChange={e => setForm(p => ({ ...p, compare_price_mwk: e.target.value }))}
                    className="w-full p-2.5 border border-gray-200 rounded-xl"
                    placeholder="Original price"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock_quantity}
                    onChange={e => setForm(p => ({ ...p, stock_quantity: parseInt(e.target.value) || 0 }))}
                    className="w-full p-2.5 border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full p-2.5 border border-gray-200 rounded-xl"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <div className="flex gap-2">
                    <select
                      value={form.category_id}
                      onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
                      className="flex-1 p-2.5 border border-gray-200 rounded-xl"
                    >
                      <option value="">Select category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="px-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))}
                      className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 flex items-center gap-1">
                      <Star size={14} /> Mark as featured
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                <div className="space-y-3">
                  {imagePreview && (
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                        <Upload size={16} />
                        <span className="text-sm">Upload Image</span>
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
                      className="flex-1 p-2.5 border border-gray-200 rounded-xl text-sm"
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
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm py-2.5 hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
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
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="font-bold text-lg mb-4">Add New Category</h2>
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="Category name"
              className="w-full p-2.5 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCategoryModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={addCategory} className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 hover:bg-orange-600 transition">
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
