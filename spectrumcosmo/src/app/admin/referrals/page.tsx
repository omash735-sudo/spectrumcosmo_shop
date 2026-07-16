'use client';

import { useState, useEffect } from 'react';
import { 
  Gift, CheckCircle, XCircle, User, Mail, Calendar, RefreshCw, Tag,
  Users, Award, AlertCircle, ChevronRight, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

interface EligibleUser {
  user_id: string;
  name: string;
  email: string;
  total_referrals: number;
  eligible_reward: boolean;
  reward_approved: boolean;
  reward_code: string | null;
}

// ===== SKELETON =====
function ReferralsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-64 mt-1" />
        </div>
        <div className="h-10 bg-[var(--background-secondary)] rounded w-24" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
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

export default function ReferralsPage() {
  const [users, setUsers] = useState<EligibleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchEligibleUsers = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/referrals');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch referrals');
      }
    } catch (err) {
      console.error('Failed to fetch eligible users:', err);
      toast.error('Failed to load referral data');
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
        toast.success(data.message || 'Reward approved successfully');
        await fetchEligibleUsers();
      } else {
        toast.error(data.error || 'Failed to approve reward');
      }
    } catch (err) {
      toast.error('Something went wrong');
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
        toast.success(data.message || 'Reward rejected');
        await fetchEligibleUsers();
      } else {
        toast.error(data.error || 'Failed to reject reward');
      }
    } catch (err) {
      toast.error('Something went wrong');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
          <ReferralsSkeleton />
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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Referral Rewards</h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
              Manage user referral rewards and discount codes
            </p>
          </div>
          <button
            onClick={fetchEligibleUsers}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--background-secondary)] hover:bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm font-medium text-[var(--foreground)] transition min-h-[44px]"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-800 p-3 sm:p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Gift size={16} className="sm:w-[18px] sm:h-[18px] text-orange-600 dark:text-orange-400" />
              <span className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 font-medium">Pending Approval</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-orange-700 dark:text-orange-400">{pendingUsers.length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800 p-3 sm:p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-green-600 dark:text-green-400" />
              <span className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">Rewards Approved</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-400">{approvedUsers.length}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-3 sm:p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="sm:w-[18px] sm:h-[18px] text-blue-600 dark:text-blue-400" />
              <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">Total Referrers</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400">{users.length}</p>
          </div>
        </div>

        {/* No Data State */}
        {pendingUsers.length === 0 && approvedUsers.length === 0 ? (
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-8 sm:p-12 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift size={24} className="sm:w-7 sm:h-7 text-[var(--foreground-muted)] opacity-50" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-[var(--foreground)] mb-1">No eligible users yet</h3>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] max-w-md mx-auto">
              Users become eligible for rewards after 5, 10, or 20 successful referrals.
              Encourage your customers to share their referral codes.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Approvals */}
            {pendingUsers.length > 0 && (
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Pending Approval ({pendingUsers.length})
                </h2>
                <div className="space-y-2 sm:space-y-3">
                  {pendingUsers.map((user) => (
                    <div key={user.user_id} className="bg-[var(--background-card)] border border-[var(--border)] rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center flex-shrink-0">
                              <User size={12} className="sm:w-3.5 sm:h-3.5 text-[var(--primary)]" />
                            </div>
                            <span className="font-medium text-sm sm:text-base text-[var(--foreground)] truncate">
                              {user.name || 'Unnamed User'}
                            </span>
                            <span className="text-xs text-[var(--foreground-muted)] truncate max-w-[120px] sm:max-w-[200px]">
                              {user.email}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                            <span className="flex items-center gap-1 text-[var(--foreground-muted)]">
                              <Gift size={12} className="sm:w-3.5 sm:h-3.5 text-[var(--primary)]" />
                              <strong className="text-[var(--foreground)]">{user.total_referrals}</strong> referrals
                            </span>
                            <span className="flex items-center gap-1 text-[var(--foreground-muted)]">
                              <Tag size={12} className="sm:w-3.5 sm:h-3.5 text-green-500" />
                              Reward: <strong className="text-[var(--foreground)]">{getRewardDiscount(user.total_referrals)}% off</strong>
                            </span>
                            <span className="flex items-center gap-1 text-[var(--foreground-muted)]">
                              <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                              Eligible at {user.total_referrals} referrals
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => approveReward(user.user_id)}
                            disabled={processing === user.user_id}
                            className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm font-medium transition disabled:opacity-50 flex items-center gap-1.5 sm:gap-2 min-h-[40px]"
                          >
                            {processing === user.user_id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <CheckCircle size={14} className="sm:w-4 sm:h-4" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => rejectReward(user.user_id)}
                            disabled={processing === user.user_id}
                            className="px-3 sm:px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/20 transition disabled:opacity-50 min-h-[40px]"
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
                <h2 className="text-sm sm:text-base font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Rewards Approved ({approvedUsers.length})
                </h2>
                <div className="space-y-2 sm:space-y-3">
                  {approvedUsers.map((user) => (
                    <div key={user.user_id} className="bg-green-50 dark:bg-green-950/10 border border-green-200 dark:border-green-800 rounded-xl p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                              <User size={12} className="sm:w-3.5 sm:h-3.5 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="font-medium text-sm sm:text-base text-[var(--foreground)] truncate">
                              {user.name || 'Unnamed User'}
                            </span>
                            <span className="text-xs text-[var(--foreground-muted)] truncate max-w-[120px] sm:max-w-[200px]">
                              {user.email}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                            <span className="flex items-center gap-1 text-[var(--foreground-muted)]">
                              <Gift size={12} className="sm:w-3.5 sm:h-3.5" />
                              {user.total_referrals} referrals
                            </span>
                            {user.reward_code && (
                              <span className="flex items-center gap-1 text-[var(--foreground-muted)]">
                                <Tag size={12} className="sm:w-3.5 sm:h-3.5 text-green-500" />
                                Code: <code className="px-1.5 py-0.5 bg-[var(--background)] rounded text-xs font-mono text-[var(--foreground)]">
                                  {user.reward_code}
                                </code>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs sm:text-sm flex-shrink-0">
                          <CheckCircle size={14} className="sm:w-4 sm:h-4" />
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
        <div className="mt-6 sm:mt-8 p-4 sm:p-5 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-400 text-sm sm:text-base">How Referral Rewards Work</h3>
              <ul className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1 list-disc list-inside">
                <li>Each user gets a unique referral code when they sign up</li>
                <li>5 successful referrals = 5% discount reward</li>
                <li>10 successful referrals = 10% discount reward</li>
                <li>20 successful referrals = 20% discount reward (max)</li>
                <li>Only completed (paid) orders count toward referrals</li>
                <li>Self-referrals and cancelled orders do not count</li>
                <li>Admin must approve rewards before users receive their discount code</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
