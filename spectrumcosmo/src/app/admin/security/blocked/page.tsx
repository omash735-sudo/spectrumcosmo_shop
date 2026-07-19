'use client';

import { useEffect, useState } from 'react';
import {
  Ban,
  RefreshCw,
  Search,
  Plus,
  X,
  CheckCircle,
  Clock,
  Shield,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BlockedIP {
  id: number;
  ip_address: string;
  reason: string;
  expires_at: string;
  blocked_by: string;
  is_manual: boolean;
  created_at: string;
}

// ===== SKELETON =====
function BlockedIPSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-64 mt-1" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-[var(--background-secondary)] rounded w-24" />
          <div className="h-10 bg-[var(--background-secondary)] rounded w-20" />
        </div>
      </div>
      <div className="h-12 bg-[var(--background-secondary)] rounded-xl" />
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--background-secondary)] rounded w-1/4" />
                <div className="h-3 bg-[var(--background-secondary)] rounded w-1/3" />
              </div>
              <div className="h-6 bg-[var(--background-secondary)] rounded w-16" />
              <div className="h-8 w-8 bg-[var(--background-secondary)] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BlockedIPsPage() {
  const [ips, setIps] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [blocking, setBlocking] = useState(false);

  const fetchIPs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/security/blocked-ips');
      if (res.ok) {
        const data = await res.json();
        setIps(data);
      } else {
        toast.error('Failed to fetch blocked IPs');
      }
    } catch (err) {
      console.error('Failed to fetch blocked IPs:', err);
      toast.error('Failed to load blocked IPs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIPs();
  }, []);

  const unblockIP = async (ipAddress: string) => {
    if (!confirm(`Are you sure you want to unblock ${ipAddress}?`)) return;
    try {
      const res = await fetch('/api/admin/security/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipAddress }),
      });
      if (res.ok) {
        toast.success(`Unblocked ${ipAddress}`);
        fetchIPs();
      } else {
        toast.error('Failed to unblock IP');
      }
    } catch (err) {
      console.error('Failed to unblock IP:', err);
      toast.error('Failed to unblock IP');
    }
  };

  const blockIP = async () => {
    if (!newIP) {
      toast.error('Please enter an IP address');
      return;
    }
    
    setBlocking(true);
    try {
      const res = await fetch('/api/admin/security/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: newIP,
          reason: newReason || 'Manually blocked',
          expiresAt: newExpiry || null,
        }),
      });
      if (res.ok) {
        toast.success(`Blocked ${newIP}`);
        setShowModal(false);
        setNewIP('');
        setNewReason('');
        setNewExpiry('');
        fetchIPs();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to block IP');
      }
    } catch (err) {
      console.error('Failed to block IP:', err);
      toast.error('Failed to block IP');
    } finally {
      setBlocking(false);
    }
  };

  const filteredIPs = ips.filter(ip => 
    ip.ip_address.includes(searchQuery) ||
    ip.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: ips.length,
    manual: ips.filter(ip => ip.is_manual).length,
    auto: ips.filter(ip => !ip.is_manual).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
          <BlockedIPSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                <Ban className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--foreground)]">Blocked IPs</h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5 sm:mt-1">Manage blocked IP addresses and manual blocks</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition text-xs sm:text-sm font-medium min-h-[40px] shadow-sm"
            >
              <Plus size={14} className="sm:w-4 sm:h-4" />
              <span>Block IP</span>
            </button>
            <button
              onClick={fetchIPs}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-[var(--background-card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition text-xs sm:text-sm min-h-[40px] disabled:opacity-50"
            >
              <RefreshCw size={14} className={`sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Total Blocked</p>
            <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">{stats.total}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-3 sm:p-4 shadow-sm">
            <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400">Manual Blocks</p>
            <p className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-400">{stats.manual}</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-3 sm:p-4 shadow-sm">
            <p className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400">Auto Blocks</p>
            <p className="text-lg sm:text-xl font-bold text-yellow-700 dark:text-yellow-400">{stats.auto}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-3 sm:p-4 shadow-sm">
            <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400">Active</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {ips.filter(ip => !ip.expires_at || new Date(ip.expires_at) > new Date()).length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="relative max-w-md w-full">
            <Search size={14} className="sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <input
              type="text"
              placeholder="Search IP or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 sm:pl-9 pr-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[40px]"
            />
          </div>
        </div>

        {/* Blocked IPs Table */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-[var(--background-secondary)] border-b border-[var(--border)]">
                <tr className="text-[10px] sm:text-xs text-[var(--foreground-muted)] uppercase tracking-wider">
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">IP Address</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left">Reason</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left hidden sm:table-cell">Blocked By</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left hidden md:table-cell">Type</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left hidden lg:table-cell">Expires</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredIPs.map((ip) => (
                  <tr key={ip.id} className="hover:bg-[var(--background-secondary)] transition">
                    <td className="px-3 sm:px-4 py-2 sm:py-3 font-mono text-xs sm:text-sm text-[var(--foreground)]">
                      {ip.ip_address}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-[var(--foreground)]">
                      {ip.reason}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-[var(--foreground-muted)] hidden sm:table-cell">
                      {ip.blocked_by || 'System'}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 hidden md:table-cell">
                      {ip.is_manual ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400">
                          Manual
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400">
                          Auto
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-[var(--foreground-muted)] hidden lg:table-cell">
                      {ip.expires_at ? (
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="sm:w-3 sm:h-3" />
                          {new Date(ip.expires_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-[var(--foreground-muted)]">Never</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-right">
                      <button
                        onClick={() => unblockIP(ip.ip_address)}
                        className="text-xs sm:text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition"
                      >
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredIPs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Shield size={20} className="text-[var(--foreground-muted)] sm:w-6 sm:h-6" />
                      </div>
                      <p className="text-sm text-[var(--foreground-muted)]">No blocked IPs</p>
                      <p className="text-xs text-[var(--foreground-muted)] opacity-70 mt-1">All clear</p>
                      <button
                        onClick={() => setShowModal(true)}
                        className="mt-3 text-xs sm:text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
                      >
                        Block an IP →
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-[var(--border)] bg-[var(--background-secondary)]">
            <span className="text-xs sm:text-sm text-[var(--foreground-muted)]">
              {filteredIPs.length} blocked {filteredIPs.length !== 1 ? 'IPs' : 'IP'}
            </span>
          </div>
        </div>
      </div>

      {/* Block IP Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--background-card)] rounded-xl max-w-md w-full shadow-xl border border-[var(--border)] mx-2 sm:mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-3.5 sm:p-4 md:p-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                  <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--primary)]" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Block IP Address</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-[var(--background-secondary)] rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center">
                <X size={16} className="sm:w-[18px] sm:h-[18px] text-[var(--foreground-muted)]" />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5">
                  IP Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  placeholder="e.g., 192.168.1.1"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Reason
                </label>
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Why is this IP being blocked?"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1.5">
                  Expiry (optional)
                </label>
                <input
                  type="datetime-local"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-[var(--foreground)] min-h-[44px]"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 p-3.5 sm:p-4 md:p-5 border-t border-[var(--border)]">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={blockIP}
                disabled={blocking || !newIP}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg text-xs sm:text-sm font-medium transition min-h-[44px] flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50"
              >
                {blocking ? <RefreshCw size={14} className="animate-spin" /> : <Ban size={14} className="sm:w-4 sm:h-4" />}
                {blocking ? 'Blocking...' : 'Block IP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
