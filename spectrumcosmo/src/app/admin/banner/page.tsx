// app/admin/banner/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Truck, Shield, Tag, Plus, X, Save, Loader2, 
  Sparkles, Star, Heart, Gift, Zap, Clock, Package, 
  ShoppingCart, AlertCircle, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const availableIcons = [
  { value: 'Truck', label: 'Truck', icon: Truck },
  { value: 'Shield', label: 'Shield', icon: Shield },
  { value: 'Tag', label: 'Tag', icon: Tag },
  { value: 'Sparkles', label: 'Sparkles', icon: Sparkles },
  { value: 'Star', label: 'Star', icon: Star },
  { value: 'Heart', label: 'Heart', icon: Heart },
  { value: 'Gift', label: 'Gift', icon: Gift },
  { value: 'Zap', label: 'Zap', icon: Zap },
  { value: 'Clock', label: 'Clock', icon: Clock },
  { value: 'Package', label: 'Package', icon: Package },
  { value: 'ShoppingCart', label: 'Shopping Cart', icon: ShoppingCart },
];

// ===== SKELETON =====
function BannerSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
      <div className="h-6 bg-[var(--background-secondary)] rounded w-32" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-12 bg-[var(--background-secondary)] rounded" />
        <div className="h-12 bg-[var(--background-secondary)] rounded" />
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-[var(--background-secondary)] rounded" />
        ))}
      </div>
      <div className="h-16 bg-[var(--background-secondary)] rounded" />
      <div className="h-12 bg-[var(--background-secondary)] rounded" />
    </div>
  );
}

export default function BannerAdminPage() {
  // Start with empty array — no placeholders
  const [items, setItems] = useState<{ icon: string; text: string }[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#C96712');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    fetchBanner();
  }, []);

  const fetchBanner = async () => {
    try {
      const res = await fetch('/api/banner');
      if (res.ok) {
        const data = await res.json();
        // If the API returns data, use it; otherwise keep empty array
        setItems(data.items || []);
        setIsActive(data.is_active !== false);
        setBackgroundColor(data.background_color || '#C96712');
        setTextColor(data.text_color || '#FFFFFF');
      }
    } catch (err) {
      console.error('Failed to fetch banner:', err);
      toast.error('Failed to load banner settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (items.some(item => !item.text.trim())) {
      toast.error('All banner items must have text');
      return;
    }

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
        const error = await res.json();
        toast.error(error.error || 'Failed to update banner');
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
    if (items.length <= 1) {
      toast.error('Banner must have at least one item');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: 'icon' | 'text', value: string) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const getIconComponent = (iconName: string) => {
    const found = availableIcons.find(i => i.value === iconName);
    return found?.icon || Tag;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl mx-auto">
          <BannerSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
              <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Top Banner Settings</h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
            Manage the promotional banner displayed at the top of your store
          </p>
        </div>

        {/* Active Toggle */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
              </label>
              <div>
                <span className="font-medium text-[var(--foreground)] text-sm">Banner Active</span>
                <p className="text-xs text-[var(--foreground-muted)]">
                  {isActive ? 'Banner is visible on the storefront' : 'Banner is hidden'}
                </p>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isActive ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Colors */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3 sm:mb-4">Colors</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-10 h-10 rounded border border-[var(--border)] cursor-pointer bg-[var(--background-secondary)]"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                Text Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-10 h-10 rounded border border-[var(--border)] cursor-pointer bg-[var(--background-secondary)]"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Banner Items</h2>
              <p className="text-xs text-[var(--foreground-muted)]">Add up to 6 items that will appear in the banner</p>
            </div>
            <button
              onClick={addItem}
              disabled={items.length >= 6}
              className="inline-flex items-center gap-1 text-xs sm:text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
            >
              <Plus size={16} /> Add Item
            </button>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {items.map((item, index) => {
              const IconComponent = getIconComponent(item.icon);
              return (
                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-[var(--background-secondary)] rounded-lg border border-[var(--border)]">
                  <select
                    value={item.icon}
                    onChange={(e) => updateItem(index, 'icon', e.target.value)}
                    className="w-full sm:w-40 px-3 py-2 bg-[var(--background-card)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)]"
                  >
                    {availableIcons.map((icon) => {
                      const IconComp = icon.icon;
                      return (
                        <option key={icon.value} value={icon.value}>
                          {icon.label}
                        </option>
                      );
                    })}
                  </select>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => updateItem(index, 'text', e.target.value)}
                    placeholder="Banner text..."
                    className="flex-1 w-full px-3 py-2 bg-[var(--background-card)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                  />
                  <button
                    onClick={() => removeItem(index)}
                    className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Remove item"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {items.length === 0 && (
            <div className="text-center py-6 text-[var(--foreground-muted)] text-sm">
              No banner items added. Click "Add Item" to start.
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-[var(--foreground-muted)]" />
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Live Preview</h2>
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-[var(--foreground-muted)] hover:text-[var(--primary)] transition"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>

          {showPreview && (
            <div
              className="p-3 sm:p-4 rounded-lg text-center transition-all"
              style={{ backgroundColor, color: textColor }}
            >
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
                {items.map((item, index) => {
                  const IconComponent = getIconComponent(item.icon);
                  return (
                    <span key={index} className="flex items-center gap-1.5">
                      <IconComponent size={14} className="flex-shrink-0" />
                      {item.text || <span className="opacity-50">(empty)</span>}
                    </span>
                  );
                })}
                {items.length === 0 && (
                  <span className="text-sm opacity-50">No items to preview</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-3 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base min-h-[52px]"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Banner Settings'}
        </button>

        {/* Pro Tips */}
        <div className="mt-4 sm:mt-6 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400">
                <strong>Pro Tips:</strong>
              </p>
              <ul className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 mt-1 space-y-0.5 list-disc list-inside">
                <li>Keep banner text short and actionable (under 30 characters)</li>
                <li>Use contrasting colors for better readability</li>
                <li>Limit to 3-4 items for the best visual appearance</li>
                <li>Test your banner on mobile devices before saving</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
