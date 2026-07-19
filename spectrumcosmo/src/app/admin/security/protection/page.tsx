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
} from 'lucide-react';

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
      }
    } catch (err) {
      console.error('Failed to fetch protection status:', err);
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mb-8"></div>
          <div className="space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border p-5 h-20"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Shield size={32} className="text-[#F97316]" />
              <h1 className="text-3xl font-bold text-gray-900">Protection</h1>
            </div>
            <p className="text-gray-500 mt-1">Built-in security protections status</p>
          </div>
          <button
            onClick={fetchStatus}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-xl border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Protection Summary</h2>
              <p className="text-sm text-gray-500 mt-1">
                {enabledCount} of {totalCount} protections active
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(enabledCount / totalCount) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900">
                {Math.round((enabledCount / totalCount) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Protection List */}
        <div className="space-y-3">
          {protections.map((protection) => (
            <div
              key={protection.key}
              className={`bg-white rounded-xl border p-5 transition ${
                protection.enabled ? 'border-green-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  protection.enabled ? 'bg-green-50' : 'bg-gray-100'
                }`}>
                  <protection.icon size={20} className={protection.enabled ? 'text-green-600' : 'text-gray-400'} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{protection.label}</h3>
                    {protection.enabled ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle size={14} />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <XCircle size={14} />
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{protection.description}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  protection.enabled ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <AlertTriangle size={18} />
            <h4 className="font-semibold">Built-in Protection</h4>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            All protections are enabled by default and require no manual configuration.
            They operate automatically at the middleware and API level.
          </p>
        </div>
      </div>
    </div>
  );
}
