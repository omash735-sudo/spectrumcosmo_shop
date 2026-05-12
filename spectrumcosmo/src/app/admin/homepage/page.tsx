'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, ArrowUp, ArrowDown, Eye, EyeOff, Upload, Trash2, Plus, ShoppingBag, Clock, Search } from 'lucide-react';
import Image from 'next/image';

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
  
  // NEW: Feature toggles for recently viewed & continue shopping
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
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      const popupData = await popupRes.json();
      setProducts(productsData);
      setCategories(categoriesData);
      setPopup(popupData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
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
      await fetch('/api/homepage/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features),
      });
      alert('Features saved successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to save features');
    }
    setSaving(false);
  };

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) return null;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      return data.secure_url || null;
    } catch {
      return null;
    }
  };

  const handlePopupImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const url = await uploadToCloudinary(file);
    if (url) setPopup({ ...popup, image_url: url });
    setUploadingImage(false);
  };

  const handleCategoryImageUpload = async (catId: number, file: File) => {
    setUploadingCatImage(catId);
    const url = await uploadToCloudinary(file);
    if (url) {
      const updated = categories.map(c => c.id === catId ? { ...c, image_url: url } : c);
      setCategories(updated);
      await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: catId, image_url: url }),
      });
    }
    setUploadingCatImage(null);
  };

  const toggleFeatured = async (productId: string, current: boolean) => {
    const res = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: productId, is_featured: !current }),
    });
    if (res.ok) fetchData();
  };

  const updateCategoryOrder = async (id: string, direction: 'up' | 'down') => {
    const index = categories.findIndex(c => c.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === categories.length - 1)) return;
    const newCategories = [...categories];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newCategories[index], newCategories[swapIndex]] = [newCategories[swapIndex], newCategories[index]];
    setCategories(newCategories);
    await fetch('/api/categories/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories: newCategories.map((c, idx) => ({ id: c.id, sort_order: idx })) }),
    });
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Products will lose this category.')) return;
    await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName }),
    });
    if (res.ok) {
      setNewCategoryName('');
      fetchData();
    } else {
      alert('Failed to add category');
    }
  };

  const savePopup = async () => {
    setSaving(true);
    await fetch('/api/homepage/popup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(popup),
    });
    setSaving(false);
    alert('Popup settings saved');
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Homepage Editor</h1>

      {/* Featured Products Manager */}
      <div className="bg-white rounded-2xl border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">⭐ Featured Products</h2>
        <p className="text-sm text-gray-500 mb-4">Toggle which products appear in the "Featured Products" section on the homepage.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-2 border rounded-lg">
              <div className="w-12 h-12 relative bg-gray-100 rounded overflow-hidden">
                {p.image_url && <Image src={p.image_url} alt={p.name} fill className="object-cover" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm line-clamp-1">{p.name}</p>
                <p className="text-xs text-gray-500">{p.category_name}</p>
              </div>
              <button
                onClick={() => toggleFeatured(p.id, p.is_featured)}
                className={`px-3 py-1 rounded-full text-xs ${p.is_featured ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}
              >
                {p.is_featured ? '★ Featured' : '☆ Not featured'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Features Manager (Recently Viewed + Continue Shopping) */}
      <div className="bg-white rounded-2xl border p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">🛍️ Smart Features</h2>
          <button onClick={saveFeatures} disabled={saving} className="bg-[#F97316] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Features
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">Control recently viewed and continue shopping features.</p>

        {/* Recently Viewed Section */}
        <div className="border-b pb-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-[#F97316]" />
              <h3 className="text-lg font-semibold">Recently Viewed</h3>
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F97316]"></div>
            </label>
          </div>
          
          {features.recentlyViewed.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6 pl-4 border-l-2 border-orange-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Items to Show</label>
                <select
                  value={features.recentlyViewed.maxItems}
                  onChange={(e) => setFeatures({
                    ...features,
                    recentlyViewed: { ...features.recentlyViewed, maxItems: parseInt(e.target.value) }
                  })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
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
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Recently Viewed"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={features.recentlyViewed.showClearButton}
                    onChange={(e) => setFeatures({
                      ...features,
                      recentlyViewed: { ...features.recentlyViewed, showClearButton: e.target.checked }
                    })}
                  />
                  Show "Clear History" button
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Continue Shopping Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-[#F97316]" />
              <h3 className="text-lg font-semibold">Continue Shopping</h3>
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F97316]"></div>
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
                  className="w-full border rounded-lg px-3 py-2 text-sm"
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
                  className="w-full border rounded-lg px-3 py-2 text-sm"
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
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Continue"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Categories Manager */}
      <div className="bg-white rounded-2xl border p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">📂 Categories (Homepage Display)</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New category name"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm"
            />
            <button onClick={addCategory} className="bg-[#F97316] text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1">
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {cat.image_url ? (
                    <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 cursor-pointer transition">
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
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" size={16} />
                    </div>
                  )}
                </div>
                <span className="font-medium">{cat.name}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateCategoryOrder(cat.id, 'up')} className="p-1 hover:bg-gray-100 rounded"><ArrowUp size={16} /></button>
                <button onClick={() => updateCategoryOrder(cat.id, 'down')} className="p-1 hover:bg-gray-100 rounded"><ArrowDown size={16} /></button>
                <button onClick={() => deleteCategory(cat.id)} className="p-1 hover:bg-red-100 rounded text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          {categories.length === 0 && <p className="text-gray-400 text-sm">No categories yet. Add one above.</p>}
        </div>
      </div>

      {/* Popup Settings */}
      <div className="bg-white rounded-2xl border p-6">
        <h2 className="text-xl font-semibold mb-4">🎉 Homepage Popup Modal</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={popup.enabled} onChange={e => setPopup({ ...popup, enabled: e.target.checked })} />
            Enable popup on homepage
          </label>
          <div><label className="block text-sm font-medium mb-1">Title</label><input className="w-full border rounded-lg px-3 py-2" value={popup.title} onChange={e => setPopup({ ...popup, title: e.target.value })} /></div>
          <div><label className="block text-sm font-medium mb-1">Message</label><textarea className="w-full border rounded-lg px-3 py-2" rows={2} value={popup.message} onChange={e => setPopup({ ...popup, message: e.target.value })} /></div>

          <div>
            <label className="block text-sm font-medium mb-1">Popup Image (optional)</label>
            <div className="flex gap-3 items-start mt-1">
              {popup.image_url && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                  <Image src={popup.image_url} alt="Popup" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setPopup({ ...popup, image_url: '' })}
                    className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow"
                  >
                    <Trash2 size={12} className="text-red-500" />
                  </button>
                </div>
              )}
              <label className="cursor-pointer">
                <div className="border-2 border-dashed rounded-lg p-3 text-center hover:bg-gray-50 transition">
                  <Upload size={20} className="mx-auto text-gray-400" />
                  <span className="text-xs text-gray-500">Upload</span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePopupImageUpload} />
              </label>
              {uploadingImage && <Loader2 className="animate-spin" />}
            </div>
          </div>

          <div><label className="block text-sm font-medium mb-1">Button Text</label><input className="w-full border rounded-lg px-3 py-2" value={popup.button_text} onChange={e => setPopup({ ...popup, button_text: e.target.value })} /></div>
          <div><label className="block text-sm font-medium mb-1">Button Link</label><input className="w-full border rounded-lg px-3 py-2" value={popup.button_link} onChange={e => setPopup({ ...popup, button_link: e.target.value })} /></div>
          <button onClick={savePopup} disabled={saving} className="bg-[#F97316] text-white px-4 py-2 rounded-lg flex items-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Popup Settings
          </button>
        </div>
      </div>
    </div>
  );
}
