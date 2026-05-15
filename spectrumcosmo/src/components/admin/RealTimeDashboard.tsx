'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Activity, Server, Database, Clock, AlertTriangle, CheckCircle, XCircle,
  Zap, Cpu, HardDrive, Wifi, Eye, TrendingUp, ShoppingBag, BarChart3
} from 'lucide-react'

type Metric = {
  pageLoadSpeed: number
  apiResponseTime: number
  serverResponseTime: number
  dbQuerySpeed: number
  cpuUsage: number
  memoryUsage: number
  networkLatency: number
  uptime: number
  errorRate: number
  failedApiRequests: number
  timestamp: string
}

type Analytics = {
  activeUsers: number
  uniqueVisitors: number
  todayOrders: number
  todayRevenue: number
  conversionRate: number
  abandonmentRate: number
  activeCarts: number
  timestamp: string
}

type Risk = {
  alerts: Array<{
    id: string
    type: 'critical' | 'warning' | 'info'
    message: string
    timestamp: string
  }>
  count: number
  timestamp: string
}

export default function RealTimeDashboard() {
  const [metrics, setMetrics] = useState<Metric | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [risks, setRisks] = useState<Risk | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, analyticsRes, risksRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/analytics/realtime'),
        fetch('/api/admin/risks')
      ])

      const [metricsData, analyticsData, risksData] = await Promise.all([
        metricsRes.json(),
        analyticsRes.json(),
        risksRes.json()
      ])

      setMetrics(metricsData)
      setAnalytics(analyticsData)
      setRisks(risksData)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Failed to fetch real-time data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  const getHealthColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthBg = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'bg-green-50'
    if (value <= thresholds.warning) return 'bg-yellow-50'
    return 'bg-red-50'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Sticky Top Summary */}
      <div className="sticky top-0 bg-white z-10 pb-4 border-b border-gray-100 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Real-time store monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-gray-500">Live</span>
            </div>
            <span className="text-xs text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Performance Monitoring */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={20} className="text-orange-500" />
          <h2 className="font-bold text-gray-800">Real-time Performance</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className={`${getHealthBg(metrics?.pageLoadSpeed || 1, { good: 1, warning: 2 })} rounded-xl p-3 text-center`}>
            <Clock size={16} className={`mx-auto mb-1 ${getHealthColor(metrics?.pageLoadSpeed || 1, { good: 1, warning: 2 })}`} />
            <p className="text-xs text-gray-500">Page Load</p>
            <p className={`text-sm font-bold ${getHealthColor(metrics?.pageLoadSpeed || 1, { good: 1, warning: 2 })}`}>
              {(metrics?.pageLoadSpeed || 0).toFixed(2)}s
            </p>
          </div>
          <div className={`${getHealthBg(metrics?.apiResponseTime || 0.2, { good: 0.3, warning: 0.8 })} rounded-xl p-3 text-center`}>
            <Zap size={16} className={`mx-auto mb-1 ${getHealthColor(metrics?.apiResponseTime || 0.2, { good: 0.3, warning: 0.8 })}`} />
            <p className="text-xs text-gray-500">API Response</p>
            <p className={`text-sm font-bold ${getHealthColor(metrics?.apiResponseTime || 0.2, { good: 0.3, warning: 0.8 })}`}>
              {(metrics?.apiResponseTime || 0).toFixed(2)}s
            </p>
          </div>
          <div className={`${getHealthBg(metrics?.serverResponseTime || 0.15, { good: 0.2, warning: 0.5 })} rounded-xl p-3 text-center`}>
            <Server size={16} className={`mx-auto mb-1 ${getHealthColor(metrics?.serverResponseTime || 0.15, { good: 0.2, warning: 0.5 })}`} />
            <p className="text-xs text-gray-500">Server</p>
            <p className={`text-sm font-bold ${getHealthColor(metrics?.serverResponseTime || 0.15, { good: 0.2, warning: 0.5 })}`}>
              {(metrics?.serverResponseTime || 0).toFixed(2)}s
            </p>
          </div>
          <div className={`${getHealthBg(metrics?.dbQuerySpeed || 0.08, { good: 0.1, warning: 0.3 })} rounded-xl p-3 text-center`}>
            <Database size={16} className={`mx-auto mb-1 ${getHealthColor(metrics?.dbQuerySpeed || 0.08, { good: 0.1, warning: 0.3 })}`} />
            <p className="text-xs text-gray-500">Database</p>
            <p className={`text-sm font-bold ${getHealthColor(metrics?.dbQuerySpeed || 0.08, { good: 0.1, warning: 0.3 })}`}>
              {(metrics?.dbQuerySpeed || 0).toFixed(2)}s
            </p>
          </div>
          <div className={`${getHealthBg(metrics?.cpuUsage || 45, { good: 50, warning: 70 })} rounded-xl p-3 text-center`}>
            <Cpu size={16} className={`mx-auto mb-1 ${getHealthColor(metrics?.cpuUsage || 45, { good: 50, warning: 70 })}`} />
            <p className="text-xs text-gray-500">CPU</p>
            <p className={`text-sm font-bold ${getHealthColor(metrics?.cpuUsage || 45, { good: 50, warning: 70 })}`}>
              {(metrics?.cpuUsage || 0).toFixed(1)}%
            </p>
          </div>
          <div className={`${getHealthBg(metrics?.memoryUsage || 55, { good: 60, warning: 80 })} rounded-xl p-3 text-center`}>
            <HardDrive size={16} className={`mx-auto mb-1 ${getHealthColor(metrics?.memoryUsage || 55, { good: 60, warning: 80 })}`} />
            <p className="text-xs text-gray-500">Memory</p>
            <p className={`text-sm font-bold ${getHealthColor(metrics?.memoryUsage || 55, { good: 60, warning: 80 })}`}>
              {(metrics?.memoryUsage || 0).toFixed(1)}%
            </p>
          </div>
          <div className={`${getHealthBg(metrics?.networkLatency || 60, { good: 50, warning: 100 })} rounded-xl p-3 text-center`}>
            <Wifi size={16} className={`mx-auto mb-1 ${getHealthColor(metrics?.networkLatency || 60, { good: 50, warning: 100 })}`} />
            <p className="text-xs text-gray-500">Latency</p>
            <p className={`text-sm font-bold ${getHealthColor(metrics?.networkLatency || 60, { good: 50, warning: 100 })}`}>
              {(metrics?.networkLatency || 0).toFixed(0)}ms
            </p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <CheckCircle size={16} className="mx-auto mb-1 text-green-600" />
            <p className="text-xs text-gray-500">Uptime</p>
            <p className="text-sm font-bold text-green-600">{(metrics?.uptime || 99.5).toFixed(2)}%</p>
          </div>
        </div>
      </div>

      {/* Risk Alerts */}
      {risks && risks.alerts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-yellow-500" />
            <h2 className="font-bold text-gray-800">Active Alerts ({risks.count})</h2>
          </div>
          <div className="space-y-2">
            {risks.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl flex items-center gap-3 ${
                  alert.type === 'critical' ? 'bg-red-50 border border-red-200' :
                  alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}
              >
                {alert.type === 'critical' ? (
                  <XCircle size={18} className="text-red-500 flex-shrink-0" />
                ) : alert.type === 'warning' ? (
                  <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0" />
                ) : (
                  <CheckCircle size={18} className="text-blue-500 flex-shrink-0" />
                )}
                <p className={`text-sm flex-1 ${
                  alert.type === 'critical' ? 'text-red-700' :
                  alert.type === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  {alert.message}
                </p>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Eye size={14} className="text-gray-400" />
              <p className="text-xs text-gray-500">Active Users</p>
            </div>
            <p className="text-xl font-bold text-gray-800">{analytics.activeUsers}</p>
            <p className="text-xs text-green-600 mt-1">Today</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-gray-400" />
              <p className="text-xs text-gray-500">Conversion</p>
            </div>
            <p className="text-xl font-bold text-gray-800">{analytics.conversionRate.toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag size={14} className="text-gray-400" />
              <p className="text-xs text-gray-500">Cart Abandonment</p>
            </div>
            <p className="text-xl font-bold text-gray-800">{analytics.abandonmentRate.toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={14} className="text-gray-400" />
              <p className="text-xs text-gray-500">Error Rate</p>
            </div>
            <p className={`text-xl font-bold ${getHealthColor(metrics?.errorRate || 1, { good: 1, warning: 3 })}`}>
              {(metrics?.errorRate || 0).toFixed(1)}%
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-gray-400" />
              <p className="text-xs text-gray-500">Failed API</p>
            </div>
            <p className={`text-xl font-bold ${getHealthColor(metrics?.failedApiRequests || 0, { good: 2, warning: 5 })}`}>
              {metrics?.failedApiRequests || 0}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
