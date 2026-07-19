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
} from 'lucide-react';

interface BlockedIP {
  id: number;
  ip_address: string;
  reason: string;
  expires_at: string;
  blocked_by: string;
  is_manual: boolean;
  created_at: string;
}

export default function BlockedIPsPage() {
  const [ips, setIps] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newExpiry, setNewExpiry] = useState('');

  const fetchIPs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/security/blocked-ips');
      if (res.ok) {
        const data = await res.json();
        setIps(data);
      }
    } catch (err) {
      console.error('Failed to fetch blocked IPs:', err);
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
      await fetch('/api/admin/security/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipAddress }),
      });
      fetchIPs();
    } catch (err) {
      console.error('Failed to unblock IP:', err);
    }
  };

  const blockIP = async () => {
    if (!newIP) return;
    try {
      await fetch('/api/admin/security/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: newIP,
          reason: newReason || 'Manually blocked',
          expiresAt: newExpiry || null,
        }),
      });
      setShowModal(false);
      setNewIP('');
      setNewReason('');
      setNewExpiry('');
      fetchIPs();
    } catch (err) {
      console.error('Failed to block IP:', err);
    }
  };

  const filteredIPs = ips.filter(ip => 
    ip.ip_address.includes(searchQuery) ||
    ip.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mb-8"></div>
          <div className="bg-white rounded-xl border p-6 h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Ban size={32} className="text-[#F97316]" />
              <h1 className="text-3xl font-bold text-gray-900">Blocked IPs</h1>
            </div>
            <p className="text-gray-500 mt-1">Manage blocked IP addresses and manual blocks</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#F97316] text-white rounded-lg hover:bg-orange-600 transition"
            >
              <Plus size={16} />
              Block IP
            </button>
            <button
              onClick={fetchIPs}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search IP or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            />
          </div>
        </div>

        {/* Blocked IPs Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left">IP Address</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-left">Blocked By</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Expires</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredIPs.map((ip) => (
                  <tr key={ip.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{ip.ip_address}</td>
                    <td className="px-4 py-3 text-sm">{ip.reason}</td>
                    <td className="px-4 py-3 text-sm">{ip.blocked_by || 'System'}</td>
                    <td className="px-4 py-3">
                      {ip.is_manual ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          Manual
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                          Auto
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {ip.expires_at ? (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock size={14} />
                          {new Date(ip.expires_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => unblockIP(ip.ip_address)}
                        className="text-sm text-[#F97316] hover:underline"
                      >
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredIPs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                      <p>No blocked IPs</p>
                      <button
                        onClick={() => setShowModal(true)}
                        className="mt-2 text-sm text-[#F97316] hover:underline"
                      >
                        Block an IP →
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t bg-gray-50">
            <span className="text-sm text-gray-500">
              {filteredIPs.length} blocked IPs
            </span>
          </div>
        </div>
      </div>

      {/* Block IP Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Block IP Address</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IP Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  placeholder="e.g., 192.168.1.1"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Why is this IP being blocked?"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry (optional)
                </label>
                <input
                  type="datetime-local"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={blockIP}
                className="px-4 py-2 bg-[#F97316] text-white rounded-lg hover:bg-orange-600"
              >
                Block IP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
