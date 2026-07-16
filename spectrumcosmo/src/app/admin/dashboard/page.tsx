'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Loader2,
  ShoppingBag,
  Users,
  DollarSign,
  RefreshCw,
  X,
  TrendingUp,
  TrendingDown,
  Monitor,
  Smartphone,
  Laptop,
  Tablet,
  Clock,
  Activity,
  Zap,
  UserCheck,
  UserX,
  ArrowRight,
} from 'lucide-react';
import { useRealtimeActiveUsers } from '@/hooks/useRealtimeActiveUsers';
import Link from 'next/link';

// Types
interface DashboardStats {
  revenue_today: number;
  orders_today: number;
  active_users_today: number;
  abandoned_carts: number;
  active_carts: number;
  avg_api_response_ms: number;
  failed_logins_last_hour: number;
  revenue_growth: number;
  orders_growth: number;
  total_revenue_lifetime?: number;
  total_orders_lifetime?: number;
  avg_order_value_lifetime?: number;
  unique_visitors_today?: number;
  conversion_rate?: number;
}

interface UserTimeBucket {
  label: string;
  count: number;
  icon: any;
  color: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-MW', { 
    style: 'currency', 
    currency: 'MWK', 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-MW').format(num);
};

const getDeviceIcon = (deviceType: string) => {
  if (deviceType === 'Mobile') return <Smartphone size={12} />;
  if (deviceType === 'Tablet') return <Tablet size={12} />;
  return <Laptop size={12} />;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showActiveUsersModal, setShowActiveUsersModal] = useState(false);
  const [activeUsersTimeFilter, setActiveUsersTimeFilter] = useState<'15min' | '30min' | '1hour' | '24hour'>('15min');
  
  const { data: realtimeUsers, isConnected, refresh: refreshUsers } = useRealtimeActiveUsers();

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    try {
      const statsRes = await fetch('/api/admin/dashboard/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const getFilteredActiveUsers = () => {
    if (!realtimeUsers?.users) return [];
    const now = Date.now();
    return realtimeUsers.users.filter((user: any) => {
      const userTime = new Date(user.last_seen || user.timestamp || Date.now()).getTime();
      const diffMinutes = (now - userTime) / (1000 * 60);
      if (activeUsersTimeFilter === '15min') return diffMinutes <= 15;
      if (activeUsersTimeFilter === '30min') return diffMinutes <= 30;
      if (activeUsersTimeFilter === '1hour') return diffMinutes <= 60;
      return true;
    });
  };

  const getUserTimeBuckets = (): UserTimeBucket[] => {
    if (!realtimeUsers?.users) return [];
    const now = Date.now();
    
    const users = realtimeUsers.users;
    const online = users.filter((u: any) => {
      const t = new Date(u.last_seen || u.timestamp || Date.now()).getTime();
      return (now - t) / 1000 <= 60;
    });
    const fifteenMin = users.filter((u: any) => {
      const t = new Date(u.last_seen || u.timestamp || Date.now()).getTime();
      return (now - t) / 1000 <= 900;
    });
    const oneHour = users.filter((u: any) => {
      const t = new Date(u.last_seen || u.timestamp || Date.now()).getTime();
      return (now - t) / 1000 <= 3600;
    });
    const today = users.filter((u: any) => {
      const t = new Date(u.last_seen || u.timestamp || Date.now()).getTime();
      return (now - t) / 1000 <= 86400;
    });

    return [
      { label: 'Online', count: online.length, icon: Zap, color: 'text-emerald-500' },
      { label: '15m', count: fifteenMin.length, icon: Clock, color: 'text-blue-500' },
      { label: '1h', count: oneHour.length, icon: Users, color: 'text-orange-500' },
      { label: 'Today', count: today.length, icon: UserCheck, color: 'text-purple-500' },
    ];
  };

  const statCards = [
    {
      title: "Today's Revenue",
      value: formatCurrency(stats?.revenue_today || 0),
      icon: DollarSign,
      trend: stats?.revenue_growth || 0,
      trendUp: (stats?.revenue_growth || 0) >= 0,
      bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      href: '/admin/analytics',
      subtitle: stats?.total_revenue_lifetime ? `Lifetime: ${formatCurrency(stats.total_revenue_lifetime)}` : undefined,
    },
    {
      title: "Today's Orders",
      value: formatNumber(stats?.orders_today || 0),
      icon: ShoppingBag,
      trend: stats?.orders_growth || 0,
      trendUp: (stats?.orders_growth || 0) >= 0,
      bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
      href: '/admin/orders',
      subtitle: stats?.total_orders_lifetime ? `Lifetime: ${formatNumber(stats.total_orders_lifetime)}` : undefined,
    },
    {
      title: 'Active Users',
      value: formatNumber(realtimeUsers?.count || 0),
      icon: Users,
      trend: isConnected ? 100 : 0,
      trendUp: true,
      bgGradient: 'from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30',
      iconBg: 'bg-orange-100 dark:bg-orange-900/40',
      iconColor: 'text-orange-600 dark:text-orange-400',
      onClick: () => setShowActiveUsersModal(true),
    },
    {
      title: 'Conversion Rate',
      value: stats?.conversion_rate !== undefined 
        ? `${(stats.conversion_rate * 100).toFixed(1)}%`
        : stats?.orders_today && stats?.unique_visitors_today && stats.unique_visitors_today > 0
          ? `${((stats.orders_today / stats.unique_visitors_today) * 100).toFixed(1)}%`
          : '0%',
      icon: TrendingUp,
      trend: 0,
      trendUp: true,
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      iconColor: 'text-purple-600 dark:text-purple-400',
      subtitle: stats?.unique_visitors_today ? `${formatNumber(stats.unique_visitors_today)} visitors today` : undefined,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[var(--primary)] w-8 h-8 mx-auto mb-3" />
          <p className="text-[var(--foreground-muted)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredUsers = getFilteredActiveUsers();
  const filteredCount = filteredUsers.length;
  const userBuckets = getUserTimeBuckets();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background-card)] border-b border-[var(--border)] shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-start md:items-center gap-3 md:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5 truncate">
                Welcome back! Here's what's happening with your store today.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
              <button 
                onClick={fetchDashboardData} 
                disabled={refreshing} 
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 bg-[var(--background-card)] border border-[var(--border)] rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] transition disabled:opacity-50 min-h-[36px] sm:min-h-[44px] text-xs sm:text-sm"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                <span className="hidden xs:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-[1440px] mx-auto">
          {/* User Activity Buckets */}
          <div className="mb-4 sm:mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {userBuckets.map((bucket) => (
                <div 
                  key={bucket.label}
                  className="bg-[var(--background-card)] rounded-lg border border-[var(--border)] px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <bucket.icon size={14} className={`${bucket.color} sm:size-4`} />
                      <span className="text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)]">{bucket.label}</span>
                    </div>
                    <span className="text-sm sm:text-base font-bold text-[var(--foreground)]">{bucket.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              const CardContent = (
                <div className={`bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 shadow-sm hover:shadow-md transition ${
                  stat.href || stat.onClick ? 'cursor-pointer hover:border-[var(--primary)] hover:shadow-lg' : ''
                }`}>
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={16} className={`${stat.iconColor} sm:size-5`} />
                    </div>
                    {stat.trend !== 0 && (
                      <div className={`flex items-center gap-0.5 text-[10px] sm:text-xs font-medium ${stat.trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full flex-shrink-0 ml-1`}>
                        {stat.trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {Math.abs(stat.trend)}%
                      </div>
                    )}
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--foreground)] truncate">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5 sm:mt-1">{stat.title}</p>
                  {stat.subtitle && (
                    <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-0.5 opacity-70">{stat.subtitle}</p>
                  )}
                </div>
              );

              if (stat.href) {
                return (
                  <Link key={index} href={stat.href}>
                    {CardContent}
                  </Link>
                );
              }

              return (
                <div key={index} onClick={stat.onClick}>
                  {CardContent}
                </div>
              );
            })}
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Link 
              href="/admin/analytics"
              className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-[var(--primary)] transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                    <TrendingUp size={18} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">Analytics</p>
                    <p className="text-xs text-[var(--foreground-muted)]">View charts & products</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-[var(--foreground-muted)] group-hover:text-[var(--primary)] transition" />
              </div>
            </Link>

            <Link 
              href="/admin/security"
              className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-[var(--primary)] transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                    <Users size={18} className="text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">Security</p>
                    <p className="text-xs text-[var(--foreground-muted)]">Threats & monitoring</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-[var(--foreground-muted)] group-hover:text-[var(--primary)] transition" />
              </div>
            </Link>

            <Link 
              href="/admin/activity"
              className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-[var(--primary)] transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                    <Activity size={18} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">Activity</p>
                    <p className="text-xs text-[var(--foreground-muted)]">API logs & history</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-[var(--foreground-muted)] group-hover:text-[var(--primary)] transition" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Active Users Modal */}
      {showActiveUsersModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-[var(--background-card)] rounded-xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-xl">
            {/* Modal Header */}
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 p-3 sm:p-5 border-b border-[var(--border)] sticky top-0 bg-[var(--background-card)] z-10">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[var(--primary)] sm:size-5" />
                <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-[var(--foreground)]">Active Users</h2>
                <span className="bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full">
                  {filteredCount} active
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <div className="flex flex-wrap gap-0.5 sm:gap-1">
                  {(['15min', '30min', '1hour', '24hour'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveUsersTimeFilter(filter)}
                      className={`px-1.5 sm:px-2.5 py-1 text-[9px] sm:text-xs rounded-md transition min-h-[28px] sm:min-h-[32px] ${
                        activeUsersTimeFilter === filter 
                          ? 'bg-[var(--primary)] text-white' 
                          : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                      }`}
                    >
                      {filter === '15min' ? '15m' : filter === '30min' ? '30m' : filter === '1hour' ? '1h' : '24h'}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => {
                    refreshUsers();
                    setActiveUsersTimeFilter('15min');
                  }} 
                  className="p-1.5 hover:bg-[var(--background-secondary)] rounded-full transition"
                  title="Refresh"
                >
                  <RefreshCw size={14} className="text-[var(--foreground-muted)] sm:size-4" />
                </button>
                <button 
                  onClick={() => setShowActiveUsersModal(false)} 
                  className="p-1.5 hover:bg-[var(--background-secondary)] rounded-full transition"
                >
                  <X size={16} className="text-[var(--foreground-muted)] sm:size-5" />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(95vh-70px)] sm:max-h-[calc(90vh-80px)] p-3 sm:p-5">
              {filteredCount === 0 ? (
                <div className="text-center py-8 sm:py-12 text-[var(--foreground-muted)]">
                  <UserX size={32} className="mx-auto mb-3 opacity-50 sm:size-12" />
                  <p className="text-xs sm:text-sm">No active users in the last {activeUsersTimeFilter === '15min' ? '15 minutes' : activeUsersTimeFilter === '30min' ? '30 minutes' : activeUsersTimeFilter === '1hour' ? 'hour' : '24 hours'}</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {/* Desktop Table View */}
                  <div className="hidden md:grid md:grid-cols-12 gap-3 px-3 py-2 text-xs font-semibold text-[var(--foreground-muted)] border-b border-[var(--border)]">
                    <div className="col-span-4">User</div>
                    <div className="col-span-3">Current Page</div>
                    <div className="col-span-2">Device / Browser</div>
                    <div className="col-span-2">IP Address</div>
                    <div className="col-span-1">Last Active</div>
                  </div>
                  
                  {/* Mobile Cards */}
                  {filteredUsers.map((user: any) => (
                    <div 
                      key={user.session_id} 
                      className="border border-[var(--border)] rounded-lg p-3 sm:p-4 hover:bg-[var(--background-secondary)] transition md:hover:bg-transparent md:p-0 md:border-0"
                    >
                      {/* Mobile Card Layout */}
                      <div className="md:hidden space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0 mt-1"></div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[var(--foreground)] text-sm truncate">
                                {user.user_name || user.user_email || 'Guest'}
                              </p>
                              {user.user_email && (
                                <p className="text-xs text-[var(--foreground-muted)] truncate">{user.user_email}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-[var(--foreground-muted)] flex-shrink-0 ml-2">
                            {user.seconds_ago < 60 ? `${user.seconds_ago}s` : `${Math.floor(user.seconds_ago / 60)}m`}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--foreground-muted)]">
                          <span className="truncate max-w-[120px]">
                            {user.page_url?.split('/').pop() || '/'}
                          </span>
                          <span className="w-px h-3 bg-[var(--border)]"></span>
                          <span className="flex items-center gap-1">
                            {getDeviceIcon(user.device_type)}
                            {user.device_type || 'Unknown'}
                          </span>
                          {user.browser && (
                            <>
                              <span className="w-px h-3 bg-[var(--border)]"></span>
                              <span>{user.browser}</span>
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <code className="text-[var(--foreground-muted)] bg-[var(--background-secondary)] px-1.5 py-0.5 rounded truncate max-w-[140px]">
                            {user.ip_address || 'N/A'}
                          </code>
                          <span className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-1">
                            <Clock size={10} />
                            {user.seconds_ago < 60 ? `${user.seconds_ago}s ago` : `${Math.floor(user.seconds_ago / 60)}m ago`}
                          </span>
                        </div>
                      </div>
                      
                      {/* Desktop Row View */}
                      <div className="hidden md:grid md:grid-cols-12 gap-3 py-3 border-b border-[var(--border)] last:border-0">
                        <div className="col-span-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[var(--foreground)] text-sm truncate">
                                {user.user_name || user.user_email || 'Guest'}
                              </p>
                              {user.user_email && (
                                <p className="text-xs text-[var(--foreground-muted)] truncate">{user.user_email}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="col-span-3">
                          <p className="text-sm text-[var(--foreground-muted)] truncate" title={user.page_url}>
                            {user.page_url?.split('/').pop() || '/'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-1 flex-wrap">
                            {getDeviceIcon(user.device_type)}
                            <span className="text-xs text-[var(--foreground-muted)]">{user.device_type || 'Unknown'}</span>
                            {user.browser && (
                              <span className="text-xs text-[var(--foreground-muted)] ml-1">({user.browser})</span>
                            )}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <code className="text-xs text-[var(--foreground-muted)]">{user.ip_address || 'N/A'}</code>
                        </div>
                        <div className="col-span-1">
                          <span className="text-xs text-[var(--foreground-muted)]">
                            {user.seconds_ago < 60 ? `${user.seconds_ago}s ago` : `${Math.floor(user.seconds_ago / 60)}m ago`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="text-center pt-2 sm:pt-4">
                    <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">
                      <Activity size={8} className="inline mr-1 sm:size-3" />
                      Auto-refreshes every 10 seconds
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
