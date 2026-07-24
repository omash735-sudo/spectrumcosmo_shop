// app/admin/inventory/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Package, 
  TrendingDown, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StockAlert {
  product_id: string;
  product_name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  alert_type: 'out' | 'critical' | 'low';
}

interface AlertSummary {
  out_of_stock: number;
  critical: number;
  low: number;
  total_alerts: number;
}

function InventorySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
        <div className="h-10 bg-[var(--background-secondary)] rounded w-24" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-[var(--background-secondary)] rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-[var(--background-secondary)] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function InventoryDashboard() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'out' | 'critical' | 'low'>('all');
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StockAlert | null>(null);
  const [newThreshold, setNewThreshold] = useState<number>(5);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventory/alerts');
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setAlerts(data.alerts);
      } else {
        toast.error('Failed to fetch inventory alerts');
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      toast.error('Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId: string, newStock: number) => {
    setUpdating(productId);
    try {
      const res = await fetch('/api/admin/inventory/update-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, newStock, reason: 'manual_adjustment' }),
      });
      if (res.ok) {
        toast.success(`Stock updated to ${newStock}`);
        await fetchAlerts();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update stock');
      }
    } catch (err) {
      console.error('Failed to update stock:', err);
      toast.error('Failed to update stock');
    } finally {
      setUpdating(null);
    }
  };

  const updateThreshold = async (productId: string, threshold: number) => {
    try {
      const res = await fetch('/api/admin/inventory/update-threshold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, threshold }),
      });
      if (res.ok) {
        toast.success(`Threshold updated to ${threshold}`);
        await fetchAlerts();
        setShowThresholdModal(false);
        setSelectedProduct(null);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update threshold');
      }
    } catch (err) {
      console.error('Failed to update threshold:', err);
      toast.error('Failed to update threshold');
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const getAlertBg = (type: string) => {
    switch (type) {
      case 'out': return 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400';
      case 'critical': return 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400';
      case 'low': return 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400';
      default: return 'bg-[var(--background-secondary)]';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'out': return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
      case 'critical': return <AlertCircle className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />;
      case 'low': return <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
      default: return <Package className="w-5 h-5 flex-shrink-0" />;
    }
  };

  const getAlertLabel = (type: string, stock: number) => {
    if (type === 'out') return 'Out of Stock';
    if (type === 'critical') return 'Critically Low';
    return 'Low Stock';
  };

  const getStatusDot = (type: string) => {
    switch (type) {
      case 'out': return <span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-1.5" />;
      case 'critical': return <span className="w-2 h-2 rounded-full bg-[var(--primary)] inline-block mr-1.5" />;
      case 'low': return <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block mr-1.5" />;
      default: return null;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || alert.alert_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const summaryCards = [
    {
      label: 'Out of Stock',
      value: summary?.out_of_stock || 0,
      color: 'text-red-700 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-800',
      icon: <XCircle className="w-5 h-5 text-red-500" />,
    },
    {
      label: 'Critical (&le;3 units)',
      value: summary?.critical || 0,
      color: 'text-[var(--primary)]',
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      border: 'border-orange-200 dark:border-orange-800',
      icon: <AlertCircle className="w-5 h-5 text-[var(--primary)]" />,
    },
    {
      label: 'Low Stock',
      value: summary?.low || 0,
      color: 'text-yellow-700 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-950/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    },
    {
      label: 'Total Alerts',
      value: summary?.total_alerts || 0,
      color: 'text-[var(--foreground)]',
      bg: 'bg-[var(--background-secondary)]',
      border: 'border-[var(--border)]',
      icon: <Package className="w-5 h-5 text-[var(--foreground-muted)]" />,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <InventorySkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="sticky top-0 z-10 bg-[var(--background-card)] border-b border-[var(--border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Inventory Management</h1>
                <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
                  Monitor stock levels and manage inventory alerts
                </p>
              </div>
            </div>
            <button
              onClick={fetchAlerts}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-[var(--background-secondary)] hover:bg-[var(--background)] border border-[var(--border)] rounded-lg font-medium transition text-sm min-h-[44px]"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {summaryCards.map((card, index) => (
              <div
                key={index}
                className={`${card.bg} rounded-xl border ${card.border} p-3 sm:p-4 shadow-sm transition hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">{card.label}</p>
                    <p className={`text-xl sm:text-2xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center">
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {summary && summary.total_alerts === 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-emerald-700 dark:text-emerald-400">All products are adequately stocked</p>
                <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-500">No inventory alerts at this time.</p>
              </div>
            </div>
          </div>
        )}

        {alerts.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" size={16} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[44px]"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'out', 'critical', 'low'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition min-h-[44px] capitalize ${
                    filterType === type
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                  }`}
                >
                  {type === 'all' ? 'All' : type}
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredAlerts.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-sm sm:text-base font-semibold text-[var(--foreground)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[var(--primary)]" />
              Products Needing Attention ({filteredAlerts.length})
            </h2>
            {filteredAlerts.map((alert) => (
              <div
                key={alert.product_id}
                className={`${getAlertBg(alert.alert_type)} rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition border border-[var(--border)]`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {getAlertIcon(alert.alert_type)}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[var(--foreground)] text-sm sm:text-base truncate">
                        {alert.product_name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                        <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                          Stock: <strong className="text-[var(--foreground)]">{alert.stock_quantity}</strong>
                        </p>
                        <span className="w-px h-4 bg-[var(--border)] hidden sm:block" />
                        <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                          Threshold: <strong className="text-[var(--foreground)]">{alert.low_stock_threshold}</strong>
                        </p>
                        <span className="w-px h-4 bg-[var(--border)] hidden sm:block" />
                        <span className="inline-flex items-center gap-1 text-xs font-medium">
                          {getStatusDot(alert.alert_type)}
                          {getAlertLabel(alert.alert_type, alert.stock_quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    <select
                      value={alert.stock_quantity}
                      onChange={(e) => updateStock(alert.product_id, parseInt(e.target.value))}
                      disabled={updating === alert.product_id}
                      className="px-3 py-1.5 sm:py-2 bg-[var(--background-card)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition min-h-[36px] text-[var(--foreground)] disabled:opacity-50"
                    >
                      <option value={alert.stock_quantity}>Current: {alert.stock_quantity}</option>
                      <option value="0">Set to 0</option>
                      <option value={alert.low_stock_threshold + 5}>Add {alert.low_stock_threshold + 5}</option>
                      <option value={alert.low_stock_threshold + 10}>Add {alert.low_stock_threshold + 10}</option>
                      <option value={alert.low_stock_threshold + 20}>Add {alert.low_stock_threshold + 20}</option>
                    </select>
                    
                    <button
                      onClick={() => {
                        setSelectedProduct(alert);
                        setNewThreshold(alert.low_stock_threshold);
                        setShowThresholdModal(true);
                      }}
                      className="p-1.5 sm:p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Update threshold"
                    >
                      <ChevronDown size={16} />
                    </button>
                    
                    {updating === alert.product_id && (
                      <Loader2 className="animate-spin text-[var(--primary)]" size={18} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : alerts.length > 0 && filteredAlerts.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-[var(--foreground-muted)]">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No alerts match your filters</p>
            <button
              onClick={() => { setSearchTerm(''); setFilterType('all'); }}
              className="mt-2 text-xs text-[var(--primary)] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : null}

        {showThresholdModal && selectedProduct && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-[var(--background-card)] rounded-xl max-w-md w-full shadow-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">
                  Update Stock Threshold
                </h3>
                <button
                  onClick={() => setShowThresholdModal(false)}
                  className="p-1.5 hover:bg-[var(--background-secondary)] rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                >
                  <XCircle size={18} className="text-[var(--foreground-muted)]" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[var(--foreground-muted)]">Product</p>
                  <p className="font-medium text-[var(--foreground)]">{selectedProduct.product_name}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--foreground-muted)]">Current Threshold</p>
                  <p className="font-medium text-[var(--foreground)]">{selectedProduct.low_stock_threshold}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    New Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)]"
                  />
                  <p className="text-xs text-[var(--foreground-muted)] mt-1 opacity-70">
                    Products with stock at or below this threshold will trigger alerts
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowThresholdModal(false)}
                    className="flex-1 px-4 py-2.5 border border-[var(--border)] rounded-lg text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition min-h-[44px] text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateThreshold(selectedProduct.product_id, newThreshold)}
                    className="flex-1 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition min-h-[44px] text-sm"
                  >
                    Update Threshold
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
