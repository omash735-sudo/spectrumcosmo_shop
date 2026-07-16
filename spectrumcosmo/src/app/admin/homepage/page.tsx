'use client';

import { useEffect, useState } from 'react';
import { 
  Loader2, Save, ArrowUp, ArrowDown, Upload, Trash2, Plus, 
  ShoppingBag, Clock, CheckCircle, X, Package, Star, 
  Settings, Bell, FolderTree, Eye, EyeOff, AlertCircle,
  ChevronRight, HelpCircle
} from 'lucide-react';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';

// ===== SKELETON =====
function HomepageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-64 mt-1" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-[var(--background-secondary)] rounded w-24" />
        ))}
      </div>
      <div className="bg-[var(--background-card)] rounded-lg border border-[var(--border)] p-6">
        <div className="space-y-4">
          <div className="h-6 bg-[var(--background-secondary)] rounded w-32" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-[var(--background-secondary)] rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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
    delaySeconds: 2,
    showDismissOption: true,
    dismissDays: 1,
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
  const [uploadingCatImage, setUploadingCatImage] = useState<string | null>(null);
  const [savedCategoryId, setSavedCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [activeTab, setActiveTab] = useState('categories');

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
      setPopup({ ...popup, ...popupData });
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

  const handleCategoryImageUpload = async (catId: string, file: File) => {
    setUploadingCatImage(catId);
    setSavedCategoryId(null);
    
    const url = await uploadToCloudinary(file);
    if (!url) {
      setUploadingCatImage(null);
      return;
    }

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
      
      setSavedCategoryId(catId);
      toast.success('Category image saved');
      
      setTimeout(() => setSavedCategoryId(null), 2000);
      await fetchData();
    } catch (err) {
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
      await fetchData();
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
      toast.success('Category added');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
          <HomepageSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Homepage Editor</h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
            Manage categories, featured products, popups, and customer features
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6 border-b border-[var(--border)] pb-2">
          {[
            { id: 'categories', label: 'Categories', icon: FolderTree },
            { id: 'products', label: 'Featured Products', icon: Star },
            { id: 'features', label: 'Smart Features', icon: Settings },
            { id: 'popup', label: 'Popup Modal', icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition min-h-[36px] sm:min-h-[40px] ${
                  activeTab === tab.id
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)]'
                }`}
              >
                <Icon size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">{tab.label}</span>
                <span className="xs:hidden">{tab.id.charAt(0).toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        {/* Categories Section */}
        {activeTab === 'categories' && (
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--background-secondary)] rounded-t-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FolderTree size={18} className="sm:w-5 sm:h-5 text-[var(--foreground-muted)]" />
                    <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Categories</h2>
                    <span className="text-[10px] text-[var(--foreground-muted)] bg-[var(--background)] px-2 py-0.5 rounded-full">
                      {categories.length} total
                    </span>
                  </div>
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5">Manage homepage categories – upload images, reorder, or delete</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="New category name"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none bg-[var(--background-secondary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[40px]"
                    onKeyPress={e => e.key === 'Enter' && addCategory()}
                  />
                  <button 
                    onClick={addCategory} 
                    className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition min-h-[40px]"
                  >
                    <Plus size={16} /> Add Category
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-3 sm:p-4 lg:p-6">
              {categories.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-[var(--foreground-muted)] border-2 border-dashed border-[var(--border)] rounded-xl">
                  <FolderTree size={40} className="sm:size-12 mx-auto mb-3 text-[var(--foreground-muted)] opacity-30" />
                  <p className="text-sm">No categories found</p>
                  <p className="text-xs mt-1 opacity-70">Add your first category using the form above</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)] hover:shadow-sm transition gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full sm:w-auto min-w-0">
                        {/* Image Area */}
                        <div className="relative flex-shrink-0">
                          <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-[var(--background)] rounded-lg overflow-hidden border border-[var(--border)]">
                            {cat.image_url ? (
                              <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[var(--foreground-muted)] text-[10px]">
                                No image
                              </div>
                            )}
                            
                            <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 cursor-pointer transition">
                              <Upload size={14} className="text-white" />
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
                            
                            {uploadingCatImage === cat.id && (
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                <Loader2 className="animate-spin text-white" size={18} />
                              </div>
                            )}
                          </div>
                          
                          {savedCategoryId === cat.id && (
                            <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-lg">
                              <CheckCircle size={10} />
                            </div>
                          )}
                        </div>
                        
                        {/* Category Info */}
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm text-[var(--foreground)] truncate block">{cat.name}</span>
                          {cat.image_url && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                              <CheckCircle size={10} /> Image saved
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-0.5 w-full sm:w-auto justify-end">
                        <button 
                          onClick={() => updateCategoryOrder(cat.id, 'up')} 
                          className="p-1.5 sm:p-2 hover:bg-[var(--background)] rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                          title="Move up"
                        >
                          <ArrowUp size={14} className="text-[var(--foreground-muted)]" />
                        </button>
                        <button 
                          onClick={() => updateCategoryOrder(cat.id, 'down')} 
                          className="p-1.5 sm:p-2 hover:bg-[var(--background)] rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                          title="Move down"
                        >
                          <ArrowDown size={14} className="text-[var(--foreground-muted)]" />
                        </button>
                        <button 
                          onClick={() => deleteCategory(cat.id)} 
                          className="p-1.5 sm:p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition text-red-500 min-h-[32px] min-w-[32px] flex items-center justify-center"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Featured Products Section */}
        {activeTab === 'products' && (
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--background-secondary)] rounded-t-xl">
              <div className="flex items-center gap-2">
                <Star size={18} className="sm:w-5 sm:h-5 text-[var(--foreground-muted)]" />
                <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Featured Products</h2>
              </div>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">Toggle which products appear in the featured section on your homepage</p>
            </div>
            <div className="p-3 sm:p-4 lg:p-6">
              {products.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-[var(--foreground-muted)] border-2 border-dashed border-[var(--border)] rounded-xl">
                  <Package size={40} className="sm:size-12 mx-auto mb-3 text-[var(--foreground-muted)] opacity-30" />
                  <p className="text-sm">No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {products.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-[var(--background-secondary)] rounded-lg border border-[var(--border)] hover:shadow-sm transition">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 relative bg-[var(--background)] rounded-lg overflow-hidden flex-shrink-0">
                        {p.image_url && <Image src={p.image_url} alt={p.name} fill className="object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm text-[var(--foreground)] truncate">{p.name}</p>
                        <p className="text-[10px] text-[var(--foreground-muted)] truncate">{p.category_name}</p>
                      </div>
                      <button
                        onClick={() => toggleFeatured(p.id, p.is_featured)}
                        className={`px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-medium transition whitespace-nowrap min-h-[32px] ${
                          p.is_featured 
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-[var(--primary)] hover:bg-orange-200 dark:hover:bg-orange-900/50' 
                            : 'bg-[var(--background)] text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)]'
                        }`}
                      >
                        {p.is_featured ? 'Featured' : 'Not featured'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Smart Features Section */}
        {activeTab === 'features' && (
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--background-secondary)] rounded-t-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Settings size={18} className="sm:w-5 sm:h-5 text-[var(--foreground-muted)]" />
                    <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Smart Features</h2>
                  </div>
                  <p className="text-xs text-[var(--foreground-muted)] mt-0.5">Control recently viewed and continue shopping features</p>
                </div>
                <button 
                  onClick={saveFeatures} 
                  disabled={saving} 
                  className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition disabled:opacity-50 w-full sm:w-auto justify-center min-h-[40px]"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                  Save Changes
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
              {/* Recently Viewed */}
              <div className="border-b border-[var(--border)] pb-5 sm:pb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="sm:w-[18px] sm:h-[18px] text-[var(--foreground-muted)]" />
                    <h3 className="font-medium text-sm text-[var(--foreground)]">Recently Viewed</h3>
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
                    <div className="w-10 h-5 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-200 dark:peer-focus:ring-orange-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                  </label>
                </div>
                
                {features.recentlyViewed.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 ml-0 sm:ml-6 pl-0 sm:pl-4 border-l-0 sm:border-l-2 border-[var(--border)]">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1">Max Items</label>
                      <select
                        value={features.recentlyViewed.maxItems}
                        onChange={(e) => setFeatures({
                          ...features,
                          recentlyViewed: { ...features.recentlyViewed, maxItems: parseInt(e.target.value) }
                        })}
                        className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background-secondary)] text-[var(--foreground)] min-h-[40px]"
                      >
                        <option value={3}>3 items</option>
                        <option value={4}>4 items</option>
                        <option value={6}>6 items</option>
                        <option value={8}>8 items</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1">Section Title</label>
                      <input
                        type="text"
                        value={features.recentlyViewed.title}
                        onChange={(e) => setFeatures({
                          ...features,
                          recentlyViewed: { ...features.recentlyViewed, title: e.target.value }
                        })}
                        className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background-secondary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[40px]"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-2 text-xs sm:text-sm text-[var(--foreground)]">
                        <input
                          type="checkbox"
                          checked={features.recentlyViewed.showClearButton}
                          onChange={(e) => setFeatures({
                            ...features,
                            recentlyViewed: { ...features.recentlyViewed, showClearButton: e.target.checked }
                          })}
                          className="rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                        Show "Clear History" button
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Continue Shopping */}
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={16} className="sm:w-[18px] sm:h-[18px] text-[var(--foreground-muted)]" />
                    <h3 className="font-medium text-sm text-[var(--foreground)]">Continue Shopping</h3>
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
                    <div className="w-10 h-5 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-200 dark:peer-focus:ring-orange-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                  </label>
                </div>
                
                {features.continueShopping.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 ml-0 sm:ml-6 pl-0 sm:pl-4 border-l-0 sm:border-l-2 border-[var(--border)]">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1">Position</label>
                      <select
                        value={features.continueShopping.position}
                        onChange={(e) => setFeatures({
                          ...features,
                          continueShopping: { ...features.continueShopping, position: e.target.value }
                        })}
                        className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background-secondary)] text-[var(--foreground)] min-h-[40px]"
                      >
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1">Expiry (days)</label>
                      <select
                        value={features.continueShopping.expiryDays}
                        onChange={(e) => setFeatures({
                          ...features,
                          continueShopping: { ...features.continueShopping, expiryDays: parseInt(e.target.value) }
                        })}
                        className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background-secondary)] text-[var(--foreground)] min-h-[40px]"
                      >
                        <option value={1}>1 day</option>
                        <option value={3}>3 days</option>
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                        <option value={30}>30 days</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1">Button Text</label>
                      <input
                        type="text"
                        value={features.continueShopping.buttonText}
                        onChange={(e) => setFeatures({
                          ...features,
                          continueShopping: { ...features.continueShopping, buttonText: e.target.value }
                        })}
                        className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background-secondary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[40px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Popup Settings Section */}
        {activeTab === 'popup' && (
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--background-secondary)] rounded-t-xl">
              <div className="flex items-center gap-2">
                <Bell size={18} className="sm:w-5 sm:h-5 text-[var(--foreground-muted)]" />
                <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Popup Modal</h2>
              </div>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">Configure the announcement popup that appears to visitors</p>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-5 max-w-2xl">
                <label className="flex items-center gap-3 p-3 bg-[var(--background-secondary)] rounded-lg">
                  <input 
                    type="checkbox" 
                    checked={popup.enabled} 
                    onChange={e => setPopup({ ...popup, enabled: e.target.checked })} 
                    className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)] rounded"
                  />
                  <span className="text-sm text-[var(--foreground)]">Enable popup on homepage</span>
                </label>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Title</label>
                  <input 
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-[var(--background-secondary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[40px] text-sm" 
                    value={popup.title} 
                    onChange={e => setPopup({ ...popup, title: e.target.value })} 
                    placeholder="Special Offer!"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Message</label>
                  <textarea 
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-[var(--background-secondary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] resize-none text-sm" 
                    rows={3} 
                    value={popup.message} 
                    onChange={e => setPopup({ ...popup, message: e.target.value })} 
                    placeholder="Get 20% off your first order..."
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Popup Image</label>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {popup.image_url && (
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-[var(--background-secondary)] border border-[var(--border)] flex-shrink-0">
                        <Image src={popup.image_url} alt="Popup" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => setPopup({ ...popup, image_url: '' })}
                          className="absolute top-1 right-1 bg-[var(--background-card)] rounded-full p-1 shadow"
                        >
                          <X size={12} className="text-red-500" />
                        </button>
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-4 text-center hover:border-[var(--primary)] hover:bg-orange-50 dark:hover:bg-orange-950/20 transition min-w-[120px]">
                        <Upload size={18} className="mx-auto text-[var(--foreground-muted)] mb-1" />
                        <span className="text-xs text-[var(--foreground-muted)]">Upload image</span>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePopupImageUpload} />
                    </label>
                    {uploadingImage && <Loader2 className="animate-spin text-[var(--primary)]" size={24} />}
                  </div>
                  <p className="text-[10px] text-[var(--foreground-muted)] mt-1 opacity-70">Recommended: 400x400px, max 2MB</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Show after (seconds)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="10"
                      className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background-secondary)] text-[var(--foreground)] min-h-[40px] text-sm" 
                      value={popup.delaySeconds} 
                      onChange={e => setPopup({ ...popup, delaySeconds: parseInt(e.target.value) })} 
                    />
                    <p className="text-[10px] text-[var(--foreground-muted)] mt-1 opacity-70">Delay before popup appears</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Don't show for (days)</label>
                    <select
                      value={popup.dismissDays}
                      onChange={e => setPopup({ ...popup, dismissDays: parseInt(e.target.value) })}
                      className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background-secondary)] text-[var(--foreground)] min-h-[40px] text-sm"
                    >
                      <option value={0}>Every visit</option>
                      <option value={1}>1 day</option>
                      <option value={3}>3 days</option>
                      <option value={7}>7 days</option>
                      <option value={30}>30 days</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs sm:text-sm text-[var(--foreground)]">
                  <input 
                    type="checkbox" 
                    checked={popup.showDismissOption} 
                    onChange={e => setPopup({ ...popup, showDismissOption: e.target.checked })} 
                    className="rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  Show "No, thanks" option
                </label>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Button Text</label>
                  <input 
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background-secondary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[40px] text-sm" 
                    value={popup.button_text} 
                    onChange={e => setPopup({ ...popup, button_text: e.target.value })} 
                    placeholder="Shop Now"
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">Button Link</label>
                  <input 
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background-secondary)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[40px] text-sm" 
                    value={popup.button_link} 
                    onChange={e => setPopup({ ...popup, button_link: e.target.value })} 
                    placeholder="/products"
                  />
                </div>
                
                <button 
                  onClick={savePopup} 
                  disabled={saving} 
                  className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-6 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50 min-h-[44px] text-sm"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                  Save Popup Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
