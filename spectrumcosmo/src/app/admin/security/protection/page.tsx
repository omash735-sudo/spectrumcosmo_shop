'use client';

import { useEffect, useState } from 'react';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Server,
  Database,
  Zap,
  FileText,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ProtectionStatus {
  rate_limiting: boolean;
  sql_injection: boolean;
  xss: boolean;
  csrf: boolean;
  auto_blocking: boolean;
  admin_route_protection: boolean;
  file_upload_validation: boolean;
  last_updated: string;
}

// ===== SKELETON =====
function ProtectionSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-64 mt-1" />
        </div>
        <div className="h-10 bg-[var(--background-secondary)] rounded w-24" />
      </div>
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-6">
        <div className="h-6 bg-[var(--background-secondary)] rounded w-32 mb-2" />
        <div className="h-4 bg-[var(--background-secondary)] rounded w-48" />
      </div>
      <div className="space-y-3">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-5 h-20" />
        ))}
      </div>
    </div>
  );
}

export default function ProtectionPage() {
  const [status, setStatus] = useState<ProtectionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/security/protection-status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        toast.error('Failed to load protection status');
      }
    } catch (err) {
      console.error('Failed to fetch protection status:', err);
      toast.error('Failed to load protection status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const protections = [
    {
      key: 'rate_limiting',
      icon: Zap,
      label: 'Rate Limiting',
      description: 'Prevents brute force attacks by limiting request frequency',
      enabled: status?.rate_limiting || false,
    },
    {
      key: 'sql_injection',
      icon: Database,
      label: 'SQL Injection Protection',
      description: 'Blocks malicious SQL queries before they reach the database',
      enabled: status?.sql_injection || false,
    },
    {
      key: 'xss',
      icon: FileText,
      label: 'XSS Protection',
      description: 'Prevents cross-site scripting attacks by sanitizing input',
      enabled: status?.xss || false,
    },
    {
      key: 'csrf',
      icon: Shield,
      label: 'CSRF Protection',
      description: 'Protects against cross-site request forgery attacks',
      enabled: status?.csrf || false,
    },
    {
      key: 'auto_blocking',
      icon: Lock,
      label: 'Automatic IP Blocking',
      description: 'Automatically blocks IPs after multiple failed attempts',
      enabled: status?.auto_blocking || false,
    },
    {
      key: 'admin_route_protection',
      icon: Server,
      label: 'Admin Route Protection',
      description: 'Secures all admin routes with authentication checks',
      enabled: status?.admin_route_protection || false,
    },
    {
      key: 'file_upload_validation',
      icon: FileText,
      label: 'File Upload Validation',
      description: 'Validates uploaded files for size, type, and content safety',
      enabled: status?.file_upload_validation || false,
    },
  ];

  const enabledCount = protections.filter(p => p.enabled).length;
  const totalCount = protections.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl mx-auto">
          <ProtectionSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--foreground)]">Protection</h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5 sm:mt-1">Built-in security protections status</p>
          </div>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-[var(--background-card)] border border-[var(--border)] rounded-lg text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition text-xs sm:text-sm min-h-[40px] disabled:opacity-50"
          >
            <RefreshCw size={14} className={`sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Refresh</span>
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Active Protections</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {enabledCount}/{totalCount}
            </p>
          </div>
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Coverage</p>
            <p className="text-lg sm:text-xl font-bold text-[var(--primary)]">
              {Math.round((enabledCount / totalCount) * 100)}%
            </p>
          </div>
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Status</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle size={16} className="sm:w-5 sm:h-5" />
              Secure
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-[var(--foreground)]">Protection Coverage</h2>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                {enabledCount} of {totalCount} protections active
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:w-40 h-2.5 bg-[var(--background-secondary)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                  style={{ width: `${(enabledCount / totalCount) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold text-[var(--primary)] min-w-[40px] text-right">
                {Math.round((enabledCount / totalCount) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Protection List */}
        <div className="space-y-2.5 sm:space-y-3">
          {protections.map((protection) => {
            const Icon = protection.icon;
            return (
              <div
                key={protection.key}
                className={`bg-[var(--background-card)] rounded-xl border p-3.5 sm:p-4 md:p-5 transition-all duration-200 hover:shadow-md ${
                  protection.enabled 
                    ? 'border-emerald-200 dark:border-emerald-800/50' 
                    : 'border-[var(--border)]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    protection.enabled 
                      ? 'bg-emerald-50 dark:bg-emerald-950/30' 
                      : 'bg-[var(--background-secondary)]'
                  }`}>
                    <Icon size={16} className={`sm:w-[18px] sm:h-[18px] ${
                      protection.enabled 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-[var(--foreground-muted)]'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base">
                        {protection.label}
                      </h3>
                      {protection.enabled ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 sm:px-2 py-0.5 rounded-full">
                          <CheckCircle size={10} className="sm:w-3 sm:h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs text-[var(--foreground-muted)] bg-[var(--background-secondary)] px-1.5 sm:px-2 py-0.5 rounded-full">
                          <XCircle size={10} className="sm:w-3 sm:h-3" />
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5 sm:mt-1">
                      {protection.description}
                    </p>
                  </div>
                  <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 self-start mt-1 sm:mt-0 ${
                    protection.enabled 
                      ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30' 
                      : 'bg-[var(--border)]'
                  }`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-4 sm:mt-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertTriangle size={14} className="sm:w-[18px] sm:h-[18px] text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-400 text-sm sm:text-base">Built-in Protection</h4>
              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 mt-0.5">
                All protections are enabled by default and require no manual configuration.
                They operate automatically at the middleware and API level.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
