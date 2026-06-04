// app/admin/alert-settings/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Bell, BellOff, Mail, X, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Types
interface AlertSetting {
  email: string;
  receive_low_stock: boolean;
  receive_critical: boolean;
  receive_out_of_stock: boolean;
}

interface ApiResponse {
  success: boolean;
  data: AlertSetting[];
  error?: string;
}

// Constants
const ALERT_TYPES = [
  {
    key: 'receive_out_of_stock' as const,
    label: 'Out of Stock',
    color: 'red',
    icon: Bell,
    description: 'When product quantity reaches 0',
  },
  {
    key: 'receive_critical' as const,
    label: 'Critical Stock',
    color: 'orange',
    icon: Bell,
    description: 'When quantity is 3 or fewer',
  },
  {
    key: 'receive_low_stock' as const,
    label: 'Low Stock',
    color: 'yellow',
    icon: BellOff,
    description: 'When quantity falls below threshold',
  },
];

export default function AlertSettingsPage() {
  const [settings, setSettings] = useState<AlertSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [updatingEmails, setUpdatingEmails] = useState<Set<string>>(new Set());

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/alert-settings');
      const data: ApiResponse = await res.json();
      if (data.success) {
        setSettings(data.data);
      } else {
        toast.error(data.error || 'Failed to load settings');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch alert settings:', errorMessage);
      toast.error('Failed to load alert settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = useCallback(async (email: string, updates: Partial<AlertSetting>) => {
    setUpdatingEmails((prev) => new Set(prev).add(email));
    try {
      const res = await fetch('/api/admin/alert-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...updates }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Updated alerts for ${email}`);
        await fetchSettings();
      } else {
        toast.error(data.error || 'Failed to update setting');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to update setting:', errorMessage);
      toast.error('Failed to update alert settings');
    } finally {
      setUpdatingEmails((prev) => {
        const newSet = new Set(prev);
        newSet.delete(email);
        return newSet;
      });
    }
  }, [fetchSettings]);

  const deleteSetting = useCallback(async (email: string) => {
    const confirmed = window.confirm(`Remove ${email} from stock alerts?`);
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/admin/alert-settings?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Removed ${email} from alerts`);
        await fetchSettings();
      } else {
        toast.error(data.error || 'Failed to remove email');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to delete setting:', errorMessage);
      toast.error('Failed to remove email');
    }
  }, [fetchSettings]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addSetting = useCallback(async () => {
    if (!newEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    
    if (!validateEmail(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (settings.some(s => s.email === newEmail)) {
      toast.error('This email is already configured for alerts');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/alert-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: newEmail, 
          receive_low_stock: true, 
          receive_critical: true, 
          receive_out_of_stock: true 
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Added ${newEmail} to alerts`);
        setNewEmail('');
        setShowAddModal(false);
        await fetchSettings();
      } else {
        toast.error(data.error || 'Failed to add email');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to add setting:', errorMessage);
      toast.error('Failed to add email');
    } finally {
      setSaving(false);
    }
  }, [newEmail, settings, fetchSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red':
        return {
          bg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-400',
          focus: 'focus:ring-red-500',
        };
      case 'orange':
        return {
          bg: 'bg-orange-50 dark:bg-orange-950/30',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-700 dark:text-orange-400',
          focus: 'focus:ring-orange-500',
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950/30',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-700 dark:text-yellow-400',
          focus: 'focus:ring-yellow-500',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900',
          border: 'border-gray-200 dark:border-gray-800',
          text: 'text-gray-700 dark:text-gray-300',
          focus: 'focus:ring-gray-500',
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Shopify-style Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Alert Settings</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage who receives inventory alert emails
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Recipient
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-orange-500 w-8 h-8 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Loading alert settings...</p>
          </div>
        ) : settings.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center shadow-sm">
            <BellOff className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Alert Recipients
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Add at least one email address to receive stock alerts.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Add First Recipient
            </button>
          </div>
        ) : (
          /* Settings Grid */
          <div className="space-y-4">
            {settings.map((setting) => {
              const isUpdating = updatingEmails.has(setting.email);
              
              return (
                <div
                  key={setting.email}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-5 shadow-sm hover:shadow-md transition"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between flex-wrap gap-4 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <span className="font-mono font-medium text-gray-900 dark:text-white">
                          {setting.email}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSetting(setting.email)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                      aria-label={`Remove ${setting.email}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Alert Type Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {ALERT_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isChecked = setting[type.key];
                      const colors = getColorClasses(type.color);
                      const isUpdatingThis = isUpdating;

                      return (
                        <label
                          key={type.key}
                          className={`
                            flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition
                            ${isChecked ? `${colors.bg} ${colors.border}` : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'}
                            hover:shadow-sm
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => updateSetting(setting.email, { [type.key]: e.target.checked })}
                            disabled={isUpdatingThis}
                            className={`
                              w-4 h-4 mt-0.5 rounded focus:ring-2 ${colors.focus}
                              ${isChecked ? colors.text : 'text-gray-400'}
                            `}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Icon className={`w-3.5 h-3.5 ${isChecked ? colors.text : 'text-gray-400'}`} />
                              <span className={`text-sm font-medium ${isChecked ? colors.text : 'text-gray-700 dark:text-gray-300'}`}>
                                {type.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {type.description}
                            </p>
                          </div>
                          {isUpdatingThis && (
                            <Loader2 className="animate-spin w-4 h-4 text-gray-400" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Email Modal - Shopify Style */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Alert Recipient
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@spectrumcosmo.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This email will receive all selected stock alerts.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Alert Types</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  New recipients will receive all alert types by default. They can be customized after adding.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={addSetting}
                  disabled={saving || !newEmail}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin w-4 h-4" /> : null}
                  {saving ? 'Adding...' : 'Add Recipient'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
