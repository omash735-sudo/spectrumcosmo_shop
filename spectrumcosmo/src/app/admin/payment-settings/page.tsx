'use client';

import { useState, useEffect } from 'react';
import { 
  Loader2, Save, RefreshCw, Zap, FileText, Smartphone, 
  Banknote, CreditCard, Clock, Shield, CheckCircle, AlertCircle,
  Wallet, TrendingUp, ArrowRight, Sparkles, Globe, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================
// TOGGLE SWITCH COMPONENT
// ============================================

function ToggleSwitch({ 
  enabled, 
  onChange, 
  disabled = false,
  label,
  description,
  icon: Icon,
  stats
}: { 
  enabled: boolean; 
  onChange: () => void; 
  disabled?: boolean;
  label: string;
  description: string;
  icon: any;
  stats?: { label: string; value: string }[];
}) {
  return (
    <div className={`relative rounded-2xl border-2 transition-all duration-300 ${
      enabled 
        ? 'border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50/50 to-white dark:from-orange-950/20 dark:to-gray-900' 
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className={`p-3 rounded-xl transition-all duration-300 ${
              enabled 
                ? 'bg-orange-100 dark:bg-orange-900/30 shadow-lg shadow-orange-500/20' 
                : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              <Icon size={24} className={enabled ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{label}</h3>
                {enabled ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle size={10} /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-lg">{description}</p>
              
              {stats && (
                <div className="flex gap-4 mt-3">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{stat.label}:</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">{stat.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={onChange}
            disabled={disabled}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
              enabled ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            role="switch"
            aria-checked={enabled}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STATS CARD
// ============================================

function StatCard({ title, value, icon: Icon, color, trend }: {
  title: string;
  value: string;
  icon: any;
  color: string;
  trend?: { value: number; label: string };
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {trend && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110 ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function PaymentSettingsPage() {
  const [automaticEnabled, setAutomaticEnabled] = useState(true);
  const [manualEnabled, setManualEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState({ automaticEnabled: true, manualEnabled: true });

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/payment-settings');
        const data = await res.json();
        const newSettings = {
          automaticEnabled: data.automatic_enabled ?? true,
          manualEnabled: data.manual_enabled ?? true,
        };
        setAutomaticEnabled(newSettings.automaticEnabled);
        setManualEnabled(newSettings.manualEnabled);
        setOriginalSettings(newSettings);
      } catch (err) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Track changes
  useEffect(() => {
    setHasChanges(
      automaticEnabled !== originalSettings.automaticEnabled ||
      manualEnabled !== originalSettings.manualEnabled
    );
  }, [automaticEnabled, manualEnabled, originalSettings]);

  // Save settings
  const handleSave = async () => {
    if (!hasChanges) {
      toast('No changes to save', { icon: 'ℹ️' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/payment-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automatic_enabled: automaticEnabled,
          manual_enabled: manualEnabled,
        }),
      });
      
      if (res.ok) {
        toast.success('Settings saved successfully!');
        setOriginalSettings({ automaticEnabled, manualEnabled });
        setHasChanges(false);
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleAutomatic = () => {
    if (!automaticEnabled && !manualEnabled) {
      toast.error('At least one payment category must be enabled');
      return;
    }
    setAutomaticEnabled(!automaticEnabled);
  };

  const toggleManual = () => {
    if (!manualEnabled && !automaticEnabled) {
      toast.error('At least one payment category must be enabled');
      return;
    }
    setManualEnabled(!manualEnabled);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-orange-500 rounded-full animate-spin" />
            <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-500 w-6 h-6 animate-pulse" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Loading payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 mb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-6 h-6 text-white" />
            <span className="text-white/80 text-sm font-medium">Payment Configuration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Payment Settings</h1>
          <p className="text-orange-100 text-sm max-w-2xl">
            Control which payment categories are available to customers during checkout. 
            Toggle automatic or manual payments on/off globally.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Categories"
          value="2"
          icon={Wallet}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
        <StatCard
          title="Automatic Payments"
          value={automaticEnabled ? 'Active' : 'Inactive'}
          icon={Zap}
          color={automaticEnabled ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}
          trend={automaticEnabled ? { value: 100, label: 'of transactions' } : undefined}
        />
        <StatCard
          title="Manual Payments"
          value={manualEnabled ? 'Active' : 'Inactive'}
          icon={FileText}
          color={manualEnabled ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}
        />
      </div>

      {/* Main Settings Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles size={18} className="text-orange-500" />
                Payment Categories
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Enable or disable entire payment categories at checkout
              </p>
            </div>
            {hasChanges && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                  Unsaved changes
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Automatic Payments Toggle */}
          <ToggleSwitch
            enabled={automaticEnabled}
            onChange={toggleAutomatic}
            label="Automatic Payments"
            description="Instant mobile money and digital wallet payments. Customers pay directly and orders are automatically approved."
            icon={Zap}
            stats={[
              { label: 'Processing', value: 'Instant' },
              { label: 'Methods', value: 'OneKhusa, Airtel Money, TNM Mpamba' },
            ]}
          />

          {/* Manual Payments Toggle */}
          <ToggleSwitch
            enabled={manualEnabled}
            onChange={toggleManual}
            label="Manual Payments"
            description="Bank transfers, mobile money uploads, and cash on delivery. Requires admin verification before order approval."
            icon={FileText}
            stats={[
              { label: 'Processing', value: '24-48 hours' },
              { label: 'Methods', value: 'Bank Transfer, Cash on Delivery' },
            ]}
          />
        </div>

        {/* Save Button Area */}
        <div className="px-6 py-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Shield size={18} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Changes are applied immediately</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">No need to restart or clear cache</p>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2.5 rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-orange-200"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* What happens when enabled */}
        <div className="bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-200 dark:border-green-800 p-5 hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
              <Zap size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-green-800 dark:text-green-300">When Automatic Payments are ON</h3>
          </div>
          <ul className="space-y-2">
            <li className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
              <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
              Customers see instant payment options at checkout
            </li>
            <li className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
              <Smartphone size={14} className="mt-0.5 flex-shrink-0" />
              Mobile money integration (OneKhusa, Airtel Money, TNM Mpamba)
            </li>
            <li className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
              <Lock size={14} className="mt-0.5 flex-shrink-0" />
              Secure gateway with automatic order approval
            </li>
          </ul>
        </div>

        {/* When manual is enabled */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-5 hover:shadow-md transition">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <FileText size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-300">When Manual Payments are ON</h3>
          </div>
          <ul className="space-y-2">
            <li className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <Clock size={14} className="mt-0.5 flex-shrink-0" />
              Customers see bank transfer and manual upload options
            </li>
            <li className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <Banknote size={14} className="mt-0.5 flex-shrink-0" />
              Payment verification required before order approval
            </li>
            <li className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <Shield size={14} className="mt-0.5 flex-shrink-0" />
              Additional security through manual review process
            </li>
          </ul>
        </div>
      </div>

      {/* Best Practices Card */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <Shield size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <Globe size={16} />
              Best Practice Recommendation
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              Keep both payment categories enabled to provide customers with maximum flexibility. 
              Automatic payments offer convenience and speed, while manual payments serve customers who prefer 
              traditional banking methods. Disabling a category will hide all associated payment methods from checkout.
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs text-amber-600 dark:text-amber-500">
              <span className="flex items-center gap-1">✅ Both ON = Maximum conversion</span>
              <span className="flex items-center gap-1">⚡ Automatic only = Faster checkout</span>
              <span className="flex items-center gap-1">📝 Manual only = Lower fees</span>
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Floating Bar */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 animate-in slide-in-from-bottom-5 duration-300 z-50">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2">
            <AlertCircle size={18} />
            <span className="text-sm font-medium">You have unsaved changes</span>
            <button onClick={handleSave} className="ml-2 text-sm underline font-semibold hover:no-underline">
              Save now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
