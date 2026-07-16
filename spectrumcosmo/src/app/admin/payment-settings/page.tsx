'use client';

import { useState, useEffect } from 'react';
import { 
  Loader2, Save, Zap, FileText, Smartphone, 
  Banknote, Clock, Shield, CheckCircle, AlertCircle,
  Wallet, TrendingUp, Globe, Lock, Sparkles,
  Wifi, WifiOff, CreditCard, Coins
} from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================
// TOGGLE SWITCH COMPONENT
// ============================================

function ToggleSwitch({ 
  enabled, 
  onChange, 
  label,
  description,
  icon: Icon,
  stats,
  status
}: { 
  enabled: boolean; 
  onChange: () => void; 
  label: string;
  description: string;
  icon: any;
  stats?: { label: string; value: string }[];
  status: { text: string; color: string; icon: any };
}) {
  return (
    <div className={`rounded-2xl border-2 transition-all duration-300 ${
      enabled 
        ? 'border-[var(--primary)]/30 dark:border-[var(--primary)]/40 bg-gradient-to-br from-orange-50/50 to-[var(--background-card)] dark:from-orange-950/20 dark:to-[var(--background-card)]' 
        : 'border-[var(--border)] bg-[var(--background-card)]'
    }`}>
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            <div className={`p-2 sm:p-3 rounded-xl transition-all duration-300 flex-shrink-0 ${
              enabled 
                ? 'bg-orange-100 dark:bg-orange-900/30' 
                : 'bg-[var(--background-secondary)]'
            }`}>
              <Icon size={18} className={enabled ? 'text-[var(--primary)]' : 'text-[var(--foreground-muted)]'} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-base font-semibold text-[var(--foreground)]">{label}</h3>
                <span className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${status.color}`}>
                  <status.icon size={10} />
                  {status.text}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">{description}</p>
              
              {stats && enabled && (
                <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 sm:mt-3">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                      <span className="text-[10px] text-[var(--foreground-muted)]">{stat.label}:</span>
                      <span className="text-[10px] font-semibold text-[var(--foreground)]">{stat.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={onChange}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 flex-shrink-0 ${
              enabled ? 'bg-[var(--primary)]' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            role="switch"
            aria-checked={enabled}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                enabled ? 'translate-x-6' : 'translate-x-1'
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
    <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] truncate">{title}</p>
          <p className="text-base sm:text-xl font-bold text-[var(--foreground)] mt-0.5 break-words">{value}</p>
          {trend && (
            <p className="text-[10px] text-green-600 dark:text-green-400 mt-0.5 flex items-center gap-1">
              <TrendingUp size={10} /> {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110 flex-shrink-0 ml-2 ${color}`}>
          <Icon size={14} className="sm:w-[18px] sm:h-[18px] text-white" />
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
        if (!res.ok) throw new Error('Failed to fetch');
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
      toast('No changes to save');
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
        toast.success('Settings saved successfully');
        setOriginalSettings({ automaticEnabled, manualEnabled });
        setHasChanges(false);
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
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

  // Calculate overall system status
  const getOverallStatus = () => {
    const onlineCount = (automaticEnabled ? 1 : 0) + (manualEnabled ? 1 : 0);
    if (onlineCount === 2) return { text: 'All Systems Online', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20', icon: Wifi };
    if (onlineCount === 1) return { text: 'Partial Service', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/20', icon: Wifi };
    return { text: 'All Systems Offline', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/20', icon: WifiOff };
  };

  const overallStatus = getOverallStatus();
  const StatusIcon = overallStatus.icon;

  // Status for individual payment methods
  const automaticStatus = automaticEnabled 
    ? { text: 'Online', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Wifi }
    : { text: 'Offline', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', icon: WifiOff };
    
  const manualStatus = manualEnabled 
    ? { text: 'Online', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Wifi }
    : { text: 'Offline', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', icon: WifiOff };

  if (loading) {
    return (
      <div className="min-h-[50vh] sm:min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
            <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--primary)] w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          </div>
          <p className="text-[var(--foreground-muted)] mt-3 sm:mt-4 text-xs sm:text-sm">Loading payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-8 sm:pb-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-white/80" />
            <span className="text-white/80 text-[10px] sm:text-xs font-medium">Payment Configuration</span>
          </div>
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-1">Payment Settings</h1>
          <p className="text-orange-100 text-xs sm:text-sm max-w-2xl">
            Control which payment categories are available to customers during checkout.
          </p>
        </div>
      </div>

      {/* System Status Card */}
      <div className={`${overallStatus.bg} rounded-xl border p-3 sm:p-4 transition-all duration-300`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm">
              <StatusIcon size={16} className={overallStatus.color} />
            </div>
            <div>
              <p className="text-[10px] text-[var(--foreground-muted)]">System Status</p>
              <p className={`text-sm sm:text-base font-semibold ${overallStatus.color}`}>{overallStatus.text}</p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${automaticEnabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              <span className="text-[10px] text-[var(--foreground-muted)]">Auto: {automaticEnabled ? 'ON' : 'OFF'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${manualEnabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              <span className="text-[10px] text-[var(--foreground-muted)]">Manual: {manualEnabled ? 'ON' : 'OFF'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          title="Total Categories"
          value="2"
          icon={Wallet}
          color="bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)]"
        />
        <StatCard
          title="Automatic Payments"
          value={automaticEnabled ? 'Online' : 'Offline'}
          icon={Zap}
          color={automaticEnabled ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}
        />
        <StatCard
          title="Manual Payments"
          value={manualEnabled ? 'Online' : 'Offline'}
          icon={FileText}
          color={manualEnabled ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}
        />
      </div>

      {/* Main Settings Card */}
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--primary)]" />
                Payment Categories
              </h2>
              <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-0.5">
                Toggle payment methods online or offline
              </p>
            </div>
            {hasChanges && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                <span className="text-[10px] text-[var(--primary)] font-medium">
                  Unsaved changes
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
          {/* Automatic Payments Toggle */}
          <ToggleSwitch
            enabled={automaticEnabled}
            onChange={toggleAutomatic}
            label="Automatic Payments"
            description="Instant mobile money and digital wallet payments. Customers pay directly and orders are automatically approved."
            icon={Zap}
            status={automaticStatus}
            stats={automaticEnabled ? [
              { label: 'Processing', value: 'Instant' },
              { label: 'Methods', value: 'OneKhusa, Airtel Money, TNM Mpamba' },
            ] : undefined}
          />

          {/* Manual Payments Toggle */}
          <ToggleSwitch
            enabled={manualEnabled}
            onChange={toggleManual}
            label="Manual Payments"
            description="Bank transfers, mobile money uploads, and cash on delivery. Requires admin verification before order approval."
            icon={FileText}
            status={manualStatus}
            stats={manualEnabled ? [
              { label: 'Processing', value: '24-48 hours' },
              { label: 'Methods', value: 'Bank Transfer, Cash on Delivery' },
            ] : undefined}
          />
        </div>

        {/* Save Button Area */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-[var(--background-secondary)] border-t border-[var(--border)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <Shield size={14} className="text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-[var(--foreground)]">Changes are applied immediately</p>
                <p className="text-[10px] text-[var(--foreground-muted)]">No need to restart or clear cache</p>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 sm:px-6 py-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-xs sm:text-sm min-h-[44px]"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live Status Preview */}
      <div className="bg-[var(--background-secondary)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
        <h3 className="text-xs sm:text-sm font-semibold text-[var(--foreground)] mb-2 sm:mb-3 flex items-center gap-2">
          <Globe size={12} className="sm:w-3.5 sm:h-3.5" />
          Live Checkout Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <div className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg ${automaticEnabled ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-[var(--background-card)]'}`}>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Zap size={14} className={automaticEnabled ? 'text-emerald-600' : 'text-[var(--foreground-muted)]'} />
              <span className="text-xs sm:text-sm text-[var(--foreground)]">Automatic Payments</span>
            </div>
            <span className={`text-[10px] font-medium ${automaticEnabled ? 'text-emerald-600' : 'text-[var(--foreground-muted)]'}`}>
              {automaticEnabled ? 'Visible' : 'Hidden'}
            </span>
          </div>
          <div className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg ${manualEnabled ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-[var(--background-card)]'}`}>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <FileText size={14} className={manualEnabled ? 'text-emerald-600' : 'text-[var(--foreground-muted)]'} />
              <span className="text-xs sm:text-sm text-[var(--foreground)]">Manual Payments</span>
            </div>
            <span className={`text-[10px] font-medium ${manualEnabled ? 'text-emerald-600' : 'text-[var(--foreground-muted)]'}`}>
              {manualEnabled ? 'Visible' : 'Hidden'}
            </span>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Floating Bar */}
      {hasChanges && (
        <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto animate-in slide-in-from-bottom-5 duration-300 z-50">
          <div className="bg-[var(--primary)] text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-full shadow-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <AlertCircle size={14} />
              <span className="text-xs sm:text-sm font-medium">Unsaved changes</span>
            </div>
            <button onClick={handleSave} className="text-xs sm:text-sm underline font-semibold hover:no-underline">
              Save now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
