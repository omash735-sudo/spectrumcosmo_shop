// app/admin/banner/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Truck, Shield, Tag, Plus, X, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const availableIcons = [
  { value: 'Truck', label: 'Truck' },
  { value: 'Shield', label: 'Shield' },
  { value: 'Tag', label: 'Tag' },
  { value: 'Sparkles', label: 'Sparkles' },
  { value: 'Star', label: 'Star' },
  { value: 'Heart', label: 'Heart' },
  { value: 'Gift', label: 'Gift' },
  { value: 'Zap', label: 'Zap' },
  { value: 'Clock', label: 'Clock' },
  { value: 'Package', label: 'Package' },
  { value: 'ShoppingCart', label: 'Shopping Cart' },
];

export default function BannerAdminPage() {
  const [items, setItems] = useState<{ icon: string; text: string }[]>([
    { icon: 'Truck', text: 'Free shipping over 50,000 MWK' },
    { icon: 'Shield', text: '30-day returns' },
    { icon: 'Tag', text: 'Subscribe for 10% off' },
  ]);
  const [isActive, setIsActive] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#C96712');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBanner();
  }, []);

  const fetchBanner = async () => {
    try {
      const res = await fetch('/api/banner');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setIsActive(data.is_active !== false);
        setBackgroundColor(data.background_color || '#C96712');
        setTextColor(data.text_color || '#FFFFFF');
      }
    } catch (err) {
      console.error('Failed to fetch banner:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          is_active: isActive,
          background_color: backgroundColor,
          text_color: textColor,
        }),
      });
      if (res.ok) {
        toast.success('Banner updated successfully!');
      } else {
        toast.error('Failed to update banner');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    setItems([...items, { icon: 'Tag', text: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: 'icon' | 'text', value: string) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Top Banner Settings</h1>

      {/* Active Toggle */}
      <div className="mb-6 flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
        </label>
        <span className="font-medium">Banner Active</span>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Background Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-10 h-10 rounded border cursor-pointer"
            />
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Text Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-10 h-10 rounded border cursor-pointer"
            />
            <input
              type="text"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Banner Items</h2>
          <button
            onClick={addItem}
            className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
            <select
              value={item.icon}
              onChange={(e) => updateItem(index, 'icon', e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white"
            >
              {availableIcons.map((icon) => (
                <option key={icon.value} value={icon.value}>
                  {icon.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={item.text}
              onChange={(e) => updateItem(index, 'text', e.target.value)}
              placeholder="Banner text..."
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <button
              onClick={() => removeItem(index)}
              className="p-1 text-red-500 hover:text-red-600"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div
        className="p-4 rounded-lg mb-6 text-center"
        style={{ backgroundColor, color: textColor }}
      >
        <div className="flex items-center justify-center gap-6 text-sm">
          {items.map((item, index) => {
            const IconComponent = (() => {
              switch (item.icon) {
                case 'Truck': return <Truck size={14} />;
                case 'Shield': return <Shield size={14} />;
                case 'Tag': return <Tag size={14} />;
                default: return null;
              }
            })();
            return (
              <span key={index} className="flex items-center gap-1">
                {IconComponent}
                {item.text || '(empty)'}
              </span>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
        {saving ? 'Saving...' : 'Save Banner Settings'}
      </button>
    </div>
  );
}
