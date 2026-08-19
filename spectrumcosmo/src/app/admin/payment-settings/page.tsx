'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, Save, Zap, FileText, Smartphone, 
  Banknote, Clock, Shield, CheckCircle, AlertCircle,
  Wallet, TrendingUp, Globe, Lock, Sparkles,
  Wifi, WifiOff, CreditCard, Coins, Plus, Edit, 
  Trash2, XCircle, RefreshCw, Search, Filter, 
  ChevronDown, ChevronUp, Building
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
// ROUTE TABLE COMPONENT
// ============================================

interface Route {
  id: number;
  provider_id: number;
  provider_name: string;
  provider_type: string;
  provider_category: string;
  sending_country: string;
  sending_currency: string;
  receiving_country: string;
  receiving_currency: string;
  min_amount: number;
  max_amount: number | null;
  fee_percentage: number;
  fee_fixed: number;
  is_active: boolean;
  requires_quote: boolean;
  verification_status: 'unverified' | 'verified' | 'failed';
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface Provider {
  id: number;
  name: string;
  type: string;
  category: string;
  is_enabled: boolean;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'verified':
      return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 flex items-center gap-1"><CheckCircle size={12} /> Verified</span>;
    case 'unverified':
      return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 flex items-center gap-1"><AlertCircle size={12} /> Unverified</span>;
    case 'failed':
      return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 flex items-center gap-1"><XCircle size={12} /> Failed</span>;
    default:
      return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{status}</span>;
  }
}

function getActiveBadge(isActive: boolean) {
  return isActive
    ? <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400">Active</span>
    : <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">Inactive</span>;
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'mobile_wallet':
      return <Smartphone size={16} className="text-[var(--foreground-muted)]" />;
    case 'bank':
      return <Building size={16} className="text-[var(--foreground-muted)]" />;
    default:
      return <Banknote size={16} className="text-[var(--foreground-muted)]" />;
  }
}

function getCountryFlag(country: string) {
  const flags: Record<string, string> = {
    MW: '🇲🇼',
    NG: '🇳🇬',
    ZA: '🇿🇦',
    KE: '🇰🇪',
    TZ: '🇹🇿',
    ZM: '🇿🇲',
    ZW: '🇿🇼',
    UG: '🇺🇬',
    GH: '🇬🇭',
    US: '🇺🇸',
    GB: '🇬🇧',
    EU: '🇪🇺'
  };
  return flags[country] || '🌍';
}

// ============================================
// MAIN PAGE
// ============================================

export default function PaymentSettingsPage() {
  const router = useRouter();
  
  // Payment settings state
  const [automaticEnabled, setAutomaticEnabled] = useState(true);
  const [manualEnabled, setManualEnabled] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState({ automaticEnabled: true, manualEnabled: true });

  // Routes state
  const [routes, setRoutes] = useState<Route[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [filterProvider, setFilterProvider] = useState<string>('');

  // Fetch payment settings
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
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  // Fetch routes and providers
  const fetchRoutes = async () => {
    setLoadingRoutes(true);
    try {
      const url = `/api/admin/payment/routes${filterProvider ? `?providerId=${filterProvider}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch routes');
      const data = await res.json();
      setRoutes(data.routes || []);
    } catch (error) {
      toast.error('Failed to load payment routes');
      console.error(error);
    } finally {
      setLoadingRoutes(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/payment-providers');
      if (!res.ok) throw new Error('Failed to fetch providers');
      const data = await res.json();
      const allProviders = [...(data.automatic || []), ...(data.manual || [])];
      setProviders(allProviders);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  useEffect(() => {
    fetchRoutes();
    fetchProviders();
  }, [filterProvider]);

  // Track changes for settings
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

  // Route actions
  const handleToggleActive = async (routeId: number, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/payment/routes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId, is_active: !currentStatus })
      });
      if (!res.ok) throw new Error('Failed to update route');
      toast.success(`Route ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchRoutes();
    } catch (error) {
      toast.error('Failed to update route');
    }
  };

  const handleToggleVerification = async (routeId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'verified' ? 'unverified' : 'verified';
    try {
      const res = await fetch('/api/admin/payment/routes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId, verification_status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update route');
      toast.success(`Route ${newStatus === 'verified' ? 'verified' : 'unverified'}`);
      fetchRoutes();
    } catch (error) {
      toast.error('Failed to update route');
    }
  };

  const handleDelete = async (routeId: number) => {
    if (!confirm('Are you sure you want to delete this route?')) return;
    try {
      const res = await fetch(`/api/admin/payment/routes?routeId=${routeId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete route');
      toast.success('Route deleted');
      fetchRoutes();
    } catch (error) {
      toast.error('Failed to delete route');
    }
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

  const automaticStatus = automaticEnabled 
    ? { text: 'Online', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Wifi }
    : { text: 'Offline', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', icon: WifiOff };
    
  const manualStatus = manualEnabled 
    ? { text: 'Online', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Wifi }
    : { text: 'Offline', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', icon: WifiOff };

  const isLoading = loadingSettings || loadingRoutes;

  if (isLoading) {
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
    <div className="space-y-4 sm:space-y-6 pb-8 sm:pb-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-white/80" />
            <span className="text-white/80 text-[10px] sm:text-xs font-medium">Payment Configuration</span>
          </div>
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-1">Payment Settings & Corridors</h1>
          <p className="text-orange-100 text-xs sm:text-sm max-w-2xl">
            Control payment categories and manage country-specific payment corridors.
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

      {/* Payment Settings Section */}
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

      {/* Payment Corridors Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
              <Globe size={18} className="text-[var(--primary)]" />
              Payment Corridors
            </h2>
            <p className="text-sm text-[var(--foreground-muted)]">Manage payment routes by country and currency</p>
          </div>
          <button
            onClick={() => toast('Add corridor modal coming soon')}
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 py-2 rounded-xl font-medium transition flex items-center gap-2 shadow-sm text-sm"
          >
            <Plus size={18} /> Add Corridor
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">Filter by Provider</label>
              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="w-full border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
              >
                <option value="">All Providers</option>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchRoutes}
                className="bg-[var(--background-secondary)] hover:bg-[var(--background)] text-[var(--foreground)] px-4 py-2 rounded-lg border border-[var(--border)] transition flex items-center gap-2"
              >
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Routes Table */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--background-secondary)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Corridor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Fees</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Verification</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {routes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[var(--foreground-muted)]">
                      No payment routes configured yet
                    </td>
                  </tr>
                ) : (
                  routes.map((route) => (
                    <tr key={route.id} className="hover:bg-[var(--background-secondary)] transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(route.provider_category)}
                          <div>
                            <p className="font-medium text-[var(--foreground)] text-sm">{route.provider_name}</p>
                            <p className="text-xs text-[var(--foreground-muted)] capitalize">{route.provider_category?.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-lg">{getCountryFlag(route.sending_country)}</span>
                          <span className="text-sm font-mono font-medium text-[var(--foreground)]">{route.sending_currency}</span>
                          <span className="text-[var(--foreground-muted)] mx-1">→</span>
                          <span className="text-lg">{getCountryFlag(route.receiving_country)}</span>
                          <span className="text-sm font-mono font-medium text-[var(--foreground)]">{route.receiving_currency}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                        {route.min_amount > 0 && `MWK ${route.min_amount.toLocaleString()}`}
                        {route.min_amount > 0 && route.max_amount && ' - '}
                        {route.max_amount && `MWK ${route.max_amount.toLocaleString()}`}
                        {route.min_amount === 0 && !route.max_amount && 'No limits'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                        {route.fee_percentage > 0 && `${route.fee_percentage}%`}
                        {route.fee_percentage > 0 && route.fee_fixed > 0 && ' + '}
                        {route.fee_fixed > 0 && `MWK ${route.fee_fixed}`}
                        {route.fee_percentage === 0 && route.fee_fixed === 0 && 'No fees'}
                      </td>
                      <td className="px-4 py-3">
                        {getActiveBadge(route.is_active)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(route.verification_status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(route.id, route.is_active)}
                            className="p-1.5 rounded-lg hover:bg-[var(--background)] transition text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                            title={route.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {route.is_active ? <CheckCircle size={16} /> : <XCircle size={16} />}
                          </button>
                          <button
                            onClick={() => handleToggleVerification(route.id, route.verification_status)}
                            className="p-1.5 rounded-lg hover:bg-[var(--background)] transition text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                            title={route.verification_status === 'verified' ? 'Mark as unverified' : 'Mark as verified'}
                          >
                            <Shield size={16} />
                          </button>
                          <button
                            onClick={() => toast('Edit corridor coming soon')}
                            className="p-1.5 rounded-lg hover:bg-[var(--background)] transition text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(route.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition text-[var(--foreground-muted)] hover:text-red-600 dark:hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--background-secondary)]">
            <p className="text-xs text-[var(--foreground-muted)]">
              {routes.length} route{routes.length !== 1 ? 's' : ''} configured
            </p>
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
