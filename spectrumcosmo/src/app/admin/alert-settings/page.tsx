// app/admin/alert-settings/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Trash2, Bell, BellOff, Mail, X, Loader2, AlertCircle,
  Users, CheckCircle, Eye
} from 'lucide-react';
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

// ===== SKELETON =====
function AlertSettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-64 mt-1" />
        </div>
        <div className="h-10 bg-[var(--background-secondary)] rounded w-32" />
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-5">
            <div className="flex justify-between mb-4">
              <div className="h-6 bg-[var(--background-secondary)] rounded w-48" />
              <div className="h-6 bg-[var(--background-secondary)] rounded w-8" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-16 bg-[var(--background-secondary)] rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
          hover: 'hover:bg-red-100 dark:hover:bg-red-900/40',
        };
      case 'orange':
        return {
          bg: 'bg-orange-50 dark:bg-orange-950/30',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-700 dark:text-orange-400',
          focus: 'focus:ring-[var(--primary)]',
          hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/40',
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950/30',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-700 dark:text-yellow-400',
          focus: 'focus:ring-yellow-500',
          hover: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/40',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-900',
          border: 'border-gray-200 dark:border-gray-800',
          text: 'text-gray-700 dark:text-gray-300',
          focus: 'focus:ring-gray-500',
          hover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
          <AlertSettingsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background-card)] border-b border-[var(--border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Stock Alert Settings</h1>
              </div>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
                Manage who receives inventory alert emails
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition shadow-sm text-sm sm:text-base min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              Add Recipient
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Empty State */}
        {settings.length === 0 ? (
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-8 sm:p-12 text-center shadow-sm">
            <BellOff className="w-12 h-12 text-[var(--foreground-muted)] opacity-30 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)] mb-2">
              No Alert Recipients
            </h3>
            <p className="text-sm text-[var(--foreground-muted)] mb-6">
              Add at least one email address to receive stock alerts.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              Add First Recipient
            </button>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Total Recipients</p>
                <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">{settings.length}</p>
              </div>
              <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Out of Stock</p>
                <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
                  {settings.filter(s => s.receive_out_of_stock).length}
                </p>
              </div>
              <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Critical Stock</p>
                <p className="text-lg sm:text-xl font-bold text-[var(--primary)]">
                  {settings.filter(s => s.receive_critical).length}
                </p>
              </div>
              <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Low Stock</p>
                <p className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  {settings.filter(s => s.receive_low_stock).length}
                </p>
              </div>
            </div>

            {/* Settings Grid */}
            <div className="space-y-3 sm:space-y-4">
              {settings.map((setting) => {
                const isUpdating = updatingEmails.has(setting.email);
                
                return (
                  <div
                    key={setting.email}
                    className="bg-[var(--background-card)] border border-[var(--border)] rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4 pb-3 border-b border-[var(--border)]">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-[var(--background-secondary)] flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-[var(--foreground-muted)]" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-mono font-medium text-sm text-[var(--foreground)] truncate block">
                            {setting.email}
                          </span>
                          <span className="text-[10px] text-[var(--foreground-muted)]">
                            {setting.receive_out_of_stock && setting.receive_critical && setting.receive_low_stock 
                              ? 'All alerts enabled' 
                              : 'Custom alerts'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSetting(setting.email)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center flex-shrink-0"
                        aria-label={`Remove ${setting.email}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Alert Type Toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      {ALERT_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isChecked = setting[type.key];
                        const colors = getColorClasses(type.color);
                        const isUpdatingThis = isUpdating;

                        return (
                          <label
                            key={type.key}
                            className={`
                              flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border cursor-pointer transition
                              ${isChecked ? `${colors.bg} ${colors.border}` : 'bg-[var(--background-secondary)] border-[var(--border)]'}
                              hover:shadow-sm ${isChecked ? colors.hover : 'hover:bg-[var(--background)]'}
                              min-h-[48px] sm:min-h-[56px]
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => updateSetting(setting.email, { [type.key]: e.target.checked })}
                              disabled={isUpdatingThis}
                              className={`
                                w-4 h-4 mt-0.5 rounded focus:ring-2 ${colors.focus}
                                ${isChecked ? colors.text : 'text-[var(--foreground-muted)]'}
                                disabled:opacity-50
                              `}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isChecked ? colors.text : 'text-[var(--foreground-muted)]'}`} />
                                <span className={`text-xs sm:text-sm font-medium ${isChecked ? colors.text : 'text-[var(--foreground-muted)]'}`}>
                                  {type.label}
                                </span>
                              </div>
                              <p className="text-[10px] text-[var(--foreground-muted)] mt-0.5 hidden sm:block">
                                {type.description}
                              </p>
                            </div>
                            {isUpdatingThis && (
                              <Loader2 className="animate-spin w-4 h-4 text-[var(--foreground-muted)] flex-shrink-0" />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add Email Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[var(--background-card)] rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">
                  Add Alert Recipient
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-[var(--background-secondary)] rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-[var(--foreground-muted)]" />
              </button>
            </div>
            
            <div className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@spectrumcosmo.com"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                  autoFocus
                />
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-1.5 opacity-70">
                  This email will receive all selected stock alerts.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 sm:p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-medium">Alert Types</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  New recipients will receive all alert types by default. They can be customized after adding.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-[var(--border)] rounded-lg text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition min-h-[44px] text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={addSetting}
                  disabled={saving || !newEmail}
                  className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50 inline-flex items-center justify-center gap-2 min-h-[44px] text-sm"
                >
                  {saving && <Loader2 className="animate-spin w-4 h-4" />}
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
