// app/admin/inventory/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Package, TrendingDown, RefreshCw } from 'lucide-react';

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

export default function InventoryDashboard() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inventory/alerts');
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setAlerts(data.alerts);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
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
        await fetchAlerts();
      }
    } catch (err) {
      console.error('Failed to update stock:', err);
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'out': return 'bg-red-100 border-red-500 text-red-700';
      case 'critical': return 'bg-orange-100 border-orange-500 text-orange-700';
      case 'low': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      default: return 'bg-gray-100';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'out': return <Package className="w-5 h-5" />;
      case 'critical': return <TrendingDown className="w-5 h-5" />;
      case 'low': return <AlertTriangle className="w-5 h-5" />;
      default: return null;
    }
  };

  const getAlertLabel = (type: string, stock: number) => {
    if (type === 'out') return 'Out of Stock';
    if (type === 'critical') return 'Critically Low';
    return 'Low Stock';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <button
          onClick={fetchAlerts}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {summary && summary.total_alerts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-sm text-red-600">Out of Stock</p>
            <p className="text-2xl font-bold text-red-700">{summary.out_of_stock}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <p className="text-sm text-orange-600">Critical (&le;3 units)</p>
            <p className="text-2xl font-bold text-orange-700">{summary.critical}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-sm text-yellow-600">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-700">{summary.low}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600">Total Alerts</p>
            <p className="text-2xl font-bold text-gray-700">{summary.total_alerts}</p>
          </div>
        </div>
      )}

      {summary && summary.total_alerts === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-green-700">
          All products are adequately stocked.
        </div>
      )}

      {/* Alerts List */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold mb-3">Products Needing Attention</h2>
          {alerts.map((alert) => (
            <div
              key={alert.product_id}
              className={`border-l-4 rounded-lg p-4 shadow-sm ${getAlertColor(alert.alert_type)}`}
            >
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  {getAlertIcon(alert.alert_type)}
                  <div>
                    <p className="font-semibold">{alert.product_name}</p>
                    <p className="text-sm opacity-75">
                      Stock: <strong>{alert.stock_quantity}</strong> / Threshold: {alert.low_stock_threshold}
                    </p>
                    <p className="text-xs mt-1 font-medium">
                      {getAlertLabel(alert.alert_type, alert.stock_quantity)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={alert.stock_quantity}
                    onChange={(e) => updateStock(alert.product_id, parseInt(e.target.value))}
                    disabled={updating === alert.product_id}
                    className="px-3 py-1 border rounded text-sm bg-white"
                  >
                    <option value={alert.stock_quantity}>Current: {alert.stock_quantity}</option>
                    <option value="0">Set to 0</option>
                    <option value={alert.low_stock_threshold + 5}>Add {alert.low_stock_threshold + 5}</option>
                    <option value={alert.low_stock_threshold + 10}>Add {alert.low_stock_threshold + 10}</option>
                    <option value={alert.low_stock_threshold + 20}>Add {alert.low_stock_threshold + 20}</option>
                  </select>
                  {updating === alert.product_id && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
