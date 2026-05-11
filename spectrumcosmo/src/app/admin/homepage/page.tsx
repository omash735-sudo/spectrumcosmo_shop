'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
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
    // Save new order
    await fetch('/api/categories/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories: newCategories.map((c, idx) => ({ id: c.id, sort_order: idx })) }),
    });
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
        <h2 className="text-xl font-semibold mb-4">Featured Products</h2>
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

      {/* Categories Order */}
      <div className="bg-white rounded-2xl border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Category Order (on homepage)</h2>
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {cat.image_url ? (
                  <div className="w-10 h-10 relative rounded overflow-hidden">
                    <Image src={cat.image_url} alt={cat.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-orange-100 rounded flex items-center justify-center text-orange-500">📁</div>
                )}
                <span>{cat.name}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateCategoryOrder(cat.id, 'up')} className="p-1 hover:bg-gray-100 rounded"><ArrowUp size={16} /></button>
                <button onClick={() => updateCategoryOrder(cat.id, 'down')} className="p-1 hover:bg-gray-100 rounded"><ArrowDown size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popup Settings */}
      <div className="bg-white rounded-2xl border p-6">
        <h2 className="text-xl font-semibold mb-4">Homepage Popup Modal</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={popup.enabled} onChange={e => setPopup({ ...popup, enabled: e.target.checked })} />
            Enable popup on homepage
          </label>
          <div><label>Title</label><input className="input w-full" value={popup.title} onChange={e => setPopup({ ...popup, title: e.target.value })} /></div>
          <div><label>Message</label><textarea className="input w-full" rows={2} value={popup.message} onChange={e => setPopup({ ...popup, message: e.target.value })} /></div>
          <div><label>Image URL (optional)</label><input className="input w-full" value={popup.image_url} onChange={e => setPopup({ ...popup, image_url: e.target.value })} /></div>
          <div><label>Button Text</label><input className="input w-full" value={popup.button_text} onChange={e => setPopup({ ...popup, button_text: e.target.value })} /></div>
          <div><label>Button Link</label><input className="input w-full" value={popup.button_link} onChange={e => setPopup({ ...popup, button_link: e.target.value })} /></div>
          <button onClick={savePopup} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Popup Settings
          </button>
        </div>
      </div>
    </div>
  );
                                                }
