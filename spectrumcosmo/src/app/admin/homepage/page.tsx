'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, ArrowUp, ArrowDown, Upload, Trash2, Plus, ShoppingBag, Clock, CheckCircle, X } from 'lucide-react';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminHomepage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [popup, setPopup] = useState({
    enabled: false,
    title: '',
    message: '',
    image_url: '',
    button_text: '',
    button_link: '',
  });
  
  const [features, setFeatures] = useState({
    recentlyViewed: {
      enabled: true,
      maxItems: 6,
      title: 'Recently Viewed',
      showClearButton: true,
    },
    continueShopping: {
      enabled: true,
      position: 'bottom-right',
      expiryDays: 7,
      buttonText: 'Continue',
    },
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCatImage, setUploadingCatImage] = useState<number | null>(null);
  const [savedCategoryId, setSavedCategoryId] = useState<number | null>(null); // NEW: Show "Saved" badge
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    fetchData();
    fetchFeatures();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, popupRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/homepage/popup'),
      ]);
      
      if (!productsRes.ok || !categoriesRes.ok || !popupRes.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      const popupData = await popupRes.json();
      
      setProducts(productsData);
      setCategories(categoriesData);
      setPopup(popupData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load homepage data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatures = async () => {
    try {
      const res = await fetch('/api/homepage/features');
      if (res.ok) {
        const data = await res.json();
        setFeatures(data);
      }
    } catch (err) {
      console.error('Failed to load features:', err);
    }
  };

  const saveFeatures = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/homepage/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features),
      });
      
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Features saved successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save features');
    } finally {
      setSaving(false);
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return null;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return null;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset) {
      toast.error('Cloudinary not configured');
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
      if (!res.ok) throw new Error(data.error?.message || 'Upload failed');
      return data.secure_url;
    } catch (err) {
      toast.error('Image upload failed');
      return null;
    }
  };

  const handlePopupImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const url = await uploadToCloudinary(file);
    if (url) {
      setPopup({ ...popup, image_url: url });
      toast.success('Popup image uploaded');
    }
    setUploadingImage(false);
  };

  const handleCategoryImageUpload = async (catId: number, file: File) => {
    setUploadingCatImage(catId);
    setSavedCategoryId(null);
    
    const url = await uploadToCloudinary(file);
    if (!url) {
      setUploadingCatImage(null);
      return;
    }

    // Optimistic update
    const optimisticCategories = categories.map(c => 
      c.id === catId ? { ...c, image_url: url } : c
    );
    setCategories(optimisticCategories);

    try {
      const res = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: catId, image_url: url }),
      });
      
      if (!res.ok) throw new Error('Failed to save');
      
      // Show success badge
      setSavedCategoryId(catId);
      toast.success('Category image saved successfully');
      
      // Hide success badge after 2 seconds
      setTimeout(() => setSavedCategoryId(null), 2000);
      
      // Refetch to ensure consistency
      await fetchData();
    } catch (err) {
      // Rollback optimistic update
      setCategories(categories);
      toast.error('Failed to save category image');
    } finally {
      setUploadingCatImage(null);
    }
  };

  const toggleFeatured = async (productId: string, current: boolean) => {
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, is_featured: !current }),
      });
      
      if (!res.ok) throw new Error('Failed to update');
      toast.success('Featured status updated');
      await fetchData();
    } catch (err) {
      toast.error('Failed to update featured status');
    }
  };

  const updateCategoryOrder = async (id: string, direction: 'up' | 'down') => {
    const index = categories.findIndex(c => c.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === categories.length - 1)) return;
    
    const newCategories = [...categories];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newCategories[index], newCategories[swapIndex]] = [newCategories[swapIndex], newCategories[index]];
    setCategories(newCategories);
    
    try {
      await fetch('/api/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: newCategories.map((c, idx) => ({ id: c.id, sort_order: idx })) }),
      });
      toast.success('Category order updated');
    } catch {
      toast.error('Failed to update order');
      await fetchData(); // revert
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Products will lose this category.')) return;
    try {
      await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      toast.success('Category deleted');
      await fetchData();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }
    
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      });
      
      if (!res.ok) throw new Error('Failed to add');
      
      setNewCategoryName('');
      toast.success('Category added successfully');
      await fetchData();
    } catch {
      toast.error('Failed to add category');
    }
  };

  const savePopup = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/homepage/popup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(popup),
      });
      
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Popup settings saved');
    } catch {
      toast.error('Failed to save popup settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="animate-spin mx-auto mb-4" size={48} />
        <p className="text-gray-600">Loading homepage editor...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Homepage Editor</h1>
          <p className="text-gray-600 mt-1">Manage categories, featured products, popups, and smart features</p>
        </div>

        {/* Categories Manager */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">📂 Categories</h2>
                <p className="text-sm text-gray-500 mt-1">Manage homepage categories – upload images, reorder, or delete</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  onKeyPress={e => e.key === 'Enter' && addCategory()}
                />
                <button 
                  onClick={addCategory} 
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition"
                >
                  <Plus size={16} /> Add Category
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Image Upload Area */}
                    <div className="relative">
                      <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
                        {cat.image_url ? (
                          <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs bg-gray-100">
                            No img
                          </div>
                        )}
                        
                        {/* Upload Overlay */}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 cursor-pointer transition-all">
                          <Upload size={16} className="text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleCategoryImageUpload(cat.id, file);
                            }}
                          />
                        </label>
                        
                        {/* Loading Spinner */}
                        {uploadingCatImage === cat.id && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <Loader2 className="animate-spin text-white" size={20} />
                          </div>
                        )}
                      </div>
                      
                      {/* Saved Badge */}
                      {savedCategoryId === cat.id && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-lg animate-bounce">
                          <CheckCircle size={14} />
                        </div>
                      )}
                    </div>
                    
                    {/* Category Info */}
                    <div className="flex-1">
                      <span className="font-semibold text-gray-900">{cat.name}</span>
                      {cat.image_url && (
                        <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                          <CheckCircle size={10} /> Image saved
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-1">
                    <button 
                      onClick={() => updateCategoryOrder(cat.id, 'up')} 
                      className="p-2 hover:bg-gray-200 rounded-lg transition"
                      title="Move up"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button 
                      onClick={() => updateCategoryOrder(cat.id, 'down')} 
                      className="p-2 hover:bg-gray-200 rounded-lg transition"
                      title="Move down"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button 
                      onClick={() => deleteCategory(cat.id)} 
                      className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p>No categories yet. Add your first category above.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Featured Products Manager */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
            <h2 className="text-xl font-semibold text-gray-900">⭐ Featured Products</h2>
            <p className="text-sm text-gray-500 mt-1">Toggle which products appear in the "Featured Products" section on the homepage</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:shadow-md transition">
                  <div className="w-12 h-12 relative bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {p.image_url && <Image src={p.image_url} alt={p.name} fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.category_name}</p>
                  </div>
                  <button
                    onClick={() => toggleFeatured(p.id, p.is_featured)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                      p.is_featured 
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p.is_featured ? '★ Featured' : '☆ Not featured'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Smart Features Manager */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">🛍️ Smart Features</h2>
                <p className="text-sm text-gray-500 mt-1">Control recently viewed and continue shopping features</p>
              </div>
              <button 
                onClick={saveFeatures} 
                disabled={saving} 
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                Save Changes
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Recently Viewed */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-orange-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Recently Viewed</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={features.recentlyViewed.enabled}
                    onChange={(e) => setFeatures({
                      ...features,
                      recentlyViewed: { ...features.recentlyViewed, enabled: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
              
              {features.recentlyViewed.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6 pl-4 border-l-2 border-orange-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Items</label>
                    <select
                      value={features.recentlyViewed.maxItems}
                      onChange={(e) => setFeatures({
                        ...features,
                        recentlyViewed: { ...features.recentlyViewed, maxItems: parseInt(e.target.value) }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                    >
                      <option value={3}>3 items</option>
                      <option value={4}>4 items</option>
                      <option value={6}>6 items</option>
                      <option value={8}>8 items</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                    <input
                      type="text"
                      value={features.recentlyViewed.title}
                      onChange={(e) => setFeatures({
                        ...features,
                        recentlyViewed: { ...features.recentlyViewed, title: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={features.recentlyViewed.showClearButton}
                        onChange={(e) => setFeatures({
                          ...features,
                          recentlyViewed: { ...features.recentlyViewed, showClearButton: e.target.checked }
                        })}
                        className="rounded focus:ring-orange-500"
                      />
                      Show "Clear History" button
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Continue Shopping */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={20} className="text-orange-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Continue Shopping</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={features.continueShopping.enabled}
                    onChange={(e) => setFeatures({
                      ...features,
                      continueShopping: { ...features.continueShopping, enabled: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
              
              {features.continueShopping.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6 pl-4 border-l-2 border-orange-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <select
                      value={features.continueShopping.position}
                      onChange={(e) => setFeatures({
                        ...features,
                        continueShopping: { ...features.continueShopping, position: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry (days)</label>
                    <select
                      value={features.continueShopping.expiryDays}
                      onChange={(e) => setFeatures({
                        ...features,
                        continueShopping: { ...features.continueShopping, expiryDays: parseInt(e.target.value) }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                    >
                      <option value={1}>1 day</option>
                      <option value={3}>3 days</option>
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={features.continueShopping.buttonText}
                      onChange={(e) => setFeatures({
                        ...features,
                        continueShopping: { ...features.continueShopping, buttonText: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Popup Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
            <h2 className="text-xl font-semibold text-gray-900">🎉 Homepage Popup Modal</h2>
            <p className="text-sm text-gray-500 mt-1">Configure the announcement popup that appears to visitors</p>
          </div>
          <div className="p-6">
            <div className="space-y-5 max-w-2xl">
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input 
                  type="checkbox" 
                  checked={popup.enabled} 
                  onChange={e => setPopup({ ...popup, enabled: e.target.checked })} 
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable popup on homepage</span>
              </label>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                  value={popup.title} 
                  onChange={e => setPopup({ ...popup, title: e.target.value })} 
                  placeholder="Special Offer!"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500" 
                  rows={3} 
                  value={popup.message} 
                  onChange={e => setPopup({ ...popup, message: e.target.value })} 
                  placeholder="Get 20% off your first order..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Popup Image</label>
                <div className="flex gap-4 items-start">
                  {popup.image_url && (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border shadow-sm">
                      <Image src={popup.image_url} alt="Popup" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setPopup({ ...popup, image_url: '' })}
                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-gray-100 transition"
                      >
                        <X size={12} className="text-red-500" />
                      </button>
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-500 hover:bg-orange-50 transition">
                      <Upload size={24} className="mx-auto text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Upload image</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePopupImageUpload} />
                  </label>
                  {uploadingImage && <Loader2 className="animate-spin text-orange-500" size={24} />}
                </div>
                <p className="text-xs text-gray-400 mt-1">Recommended: 400x400px, max 2MB</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500" 
                  value={popup.button_text} 
                  onChange={e => setPopup({ ...popup, button_text: e.target.value })} 
                  placeholder="Shop Now"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Button Link</label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500" 
                  value={popup.button_link} 
                  onChange={e => setPopup({ ...popup, button_link: e.target.value })} 
                  placeholder="/products"
                />
              </div>
              
              <button 
                onClick={savePopup} 
                disabled={saving} 
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                Save Popup Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
