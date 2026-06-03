'use client';

import { useState, useEffect } from 'react';
import { Gift, CheckCircle, XCircle, User, Mail, Calendar, RefreshCw, Tag } from 'lucide-react';

interface EligibleUser {
  user_id: string;
  name: string;
  email: string;
  total_referrals: number;
  eligible_reward: boolean;
  reward_approved: boolean;
  reward_code: string | null;
}

export default function ReferralsPage() {
  const [users, setUsers] = useState<EligibleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchEligibleUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/referrals');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch eligible users:', err);
    } finally {
      setLoading(false);
    }
  };

  const approveReward = async (userId: string) => {
    setProcessing(userId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'approve_reward' }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        await fetchEligibleUsers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to approve reward' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Something went wrong' });
    } finally {
      setProcessing(null);
    }
  };

  const rejectReward = async (userId: string) => {
    if (!confirm('Reject this reward request?')) return;
    setProcessing(userId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'reject_reward' }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        await fetchEligibleUsers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to reject reward' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Something went wrong' });
    } finally {
      setProcessing(null);
    }
  };

  const getRewardDiscount = (referrals: number): number => {
    if (referrals >= 20) return 20;
    if (referrals >= 10) return 10;
    if (referrals >= 5) return 5;
    return 0;
  };

  useEffect(() => {
    fetchEligibleUsers();
  }, []);

  const pendingUsers = users.filter(u => u.eligible_reward && !u.reward_approved);
  const approvedUsers = users.filter(u => u.reward_approved);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Referral Rewards</h1>
          <p className="text-gray-500 mt-1">Manage user referral rewards</p>
        </div>
        <button
          onClick={fetchEligibleUsers}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={18} className="text-orange-500" />
            <span className="text-sm text-orange-600 font-medium">Pending Approval</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">{pendingUsers.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-green-500" />
            <span className="text-sm text-green-600 font-medium">Rewards Approved</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{approvedUsers.length}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <User size={18} className="text-blue-500" />
            <span className="text-sm text-blue-600 font-medium">Total Referrers</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{users.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : pendingUsers.length === 0 && approvedUsers.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          No eligible users yet. Users become eligible after 5, 10, or 20 successful referrals.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Approvals */}
          {pendingUsers.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Pending Approval ({pendingUsers.length})
              </h2>
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div key={user.user_id} className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User size={16} className="text-gray-400" />
                          <span className="font-medium">{user.name || 'Unnamed User'}</span>
                          <span className="text-sm text-gray-400">{user.email}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Gift size={14} className="text-orange-500" />
                            <strong>{user.total_referrals}</strong> referrals
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag size={14} className="text-green-500" />
                            Reward: <strong>{getRewardDiscount(user.total_referrals)}% off</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} className="text-gray-400" />
                            Eligible at {user.total_referrals} referrals
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveReward(user.user_id)}
                          disabled={processing === user.user_id}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex items-center gap-2"
                        >
                          {processing === user.user_id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <CheckCircle size={16} />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => rejectReward(user.user_id)}
                          disabled={processing === user.user_id}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Already Approved */}
          {approvedUsers.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Rewards Approved ({approvedUsers.length})
              </h2>
              <div className="space-y-3">
                {approvedUsers.map((user) => (
                  <div key={user.user_id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <User size={16} className="text-gray-400" />
                          <span className="font-medium">{user.name || 'Unnamed User'}</span>
                          <span className="text-sm text-gray-400">{user.email}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Gift size={14} className="text-gray-500" />
                            {user.total_referrals} referrals
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag size={14} className="text-green-600" />
                            Code: <code className="px-1 bg-gray-200 rounded">{user.reward_code}</code>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle size={14} />
                        Reward issued
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">How Referral Rewards Work</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Each user gets a unique referral code when they sign up</li>
          <li>• 5 successful referrals = 5% discount reward</li>
          <li>• 10 successful referrals = 10% discount reward</li>
          <li>• 20 successful referrals = 20% discount reward (max)</li>
          <li>• Only completed (paid) orders count toward referrals</li>
          <li>• Self-referrals and cancelled orders do not count</li>
          <li>• Admin must approve rewards before users receive their discount code</li>
        </ul>
      </div>
    </div>
  );
}
