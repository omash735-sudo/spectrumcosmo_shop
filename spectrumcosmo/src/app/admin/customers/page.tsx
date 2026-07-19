Here's the updated Admin Customers page with emojis removed:

```tsx
'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  Eye, Loader2, User, Mail, Phone, Calendar, Package, 
  TrendingUp, CheckCircle, AlertCircle, Trash2, RefreshCw, 
  X, ShoppingBag, DollarSign, Star, MoreVertical, Search, 
  Filter, Download, ChevronLeft, ChevronRight, ArrowUpDown,
  Users, UserCheck, UserX, Clock, Shield, Send, Copy,
  Settings, BarChart3, Activity, Zap, Award, Crown, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  account_status: 'active' | 'frozen' | 'banned' | 'deleted';
  email_verified: boolean;
  email_verified_at: string | null;
  verification_status: 'verified' | 'pending' | 'unknown';
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  created_at: string;
  last_active?: string;
  loyalty_tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  review_count?: number;
  average_rating?: number;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price?: number;
  product_image?: string;
}

interface Order {
  id: string;
  status: 'pending' | 'approved' | 'shipped' | 'delivered' | 'declined' | 'refunded';
  created_at: string;
  total_amount: number;
  items?: OrderItem[];
  tracking_number?: string;
}

interface CustomerProfile {
  user: Customer;
  orders: Order[];
  topProducts: TopProduct[];
  monthlySpending?: { month: string; amount: number }[];
  abandonedCarts?: number;
  averageOrderValue?: number;
  lifetimeValue?: number;
}

interface TopProduct {
  product_name: string;
  total_quantity: number;
  product_image?: string;
}

interface FilterState {
  status: string[];
  tier: string[];
  minOrders: number;
  minSpent: number;
  dateRange: 'all' | 'week' | 'month' | 'year';
  search: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; actions: string[] }> = {
  active: { 
    label: 'Active', 
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle,
    actions: ['freeze', 'ban', 'delete']
  },
  frozen: { 
    label: 'Frozen', 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: AlertCircle,
    actions: ['activate', 'delete']
  },
  banned: { 
    label: 'Banned', 
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: Shield,
    actions: ['activate']
  },
  deleted: { 
    label: 'Deleted', 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    icon: Trash2,
    actions: ['restore']
  },
};

const TIER_CONFIG = {
  bronze: { label: 'Bronze', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30', minSpent: 0, icon: Award },
  silver: { label: 'Silver', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800', minSpent: 50000, icon: Award },
  gold: { label: 'Gold', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30', minSpent: 200000, icon: Crown },
  platinum: { label: 'Platinum', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30', minSpent: 500000, icon: Zap },
};

const ORDER_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30' },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800 dark:bg-green-900/30' },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-800 dark:bg-red-900/30' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800' },
};

const VALID_STATUSES = ['active', 'frozen', 'banned', 'deleted'];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: 'MWK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  return format(new Date(dateString), 'MMM d, yyyy');
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return '-';
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

function calculateTier(totalSpent: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (totalSpent >= 500000) return 'platinum';
  if (totalSpent >= 200000) return 'gold';
  if (totalSpent >= 50000) return 'silver';
  return 'bronze';
}

function CustomersSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-64 mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-[var(--background-secondary)] rounded-xl" />
        ))}
      </div>
      <div className="h-12 bg-[var(--background-secondary)] rounded-xl" />
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-[var(--background-secondary)] rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}) {
  if (!isOpen) return null;

  const colors = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[var(--background-card)] rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-6">
          <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">{title}</h3>
          <p className="text-sm text-[var(--foreground-muted)]">{message}</p>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-[var(--border)] rounded-lg text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition min-h-[44px] text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg text-white transition min-h-[44px] text-sm ${colors[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterBar({
  filters,
  onFilterChange,
  totalCount,
  onExport,
  exporting,
}: {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  totalCount: number;
  onExport: () => void;
  exporting: boolean;
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] min-h-[44px]"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2.5 border border-[var(--border)] rounded-xl flex items-center gap-2 hover:bg-[var(--background-secondary)] transition text-sm text-[var(--foreground)] min-h-[44px]"
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Filters</span>
            {Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== '' && v !== 'all' && v !== 0) && (
              <span className="w-2 h-2 bg-[var(--primary)] rounded-full" />
            )}
          </button>
          <button
            onClick={onExport}
            disabled={exporting}
            className="px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl flex items-center gap-2 transition disabled:opacity-50 text-sm min-h-[44px]"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-[var(--background-secondary)] rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-2">Status</label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {['active', 'frozen', 'banned', 'deleted'].map(status => {
                  const config = STATUS_CONFIG[status];
                  return (
                    <button
                      key={status}
                      onClick={() => {
                        const newStatus = filters.status.includes(status)
                          ? filters.status.filter(s => s !== status)
                          : [...filters.status, status];
                        onFilterChange({ ...filters, status: newStatus });
                      }}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition min-h-[32px] ${
                        filters.status.includes(status)
                          ? config.color + ' ring-2 ring-offset-1 ring-[var(--primary)]'
                          : 'bg-[var(--background-card)] text-[var(--foreground-muted)] border border-[var(--border)]'
                      }`}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-2">Loyalty Tier</label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {['bronze', 'silver', 'gold', 'platinum'].map(tier => {
                  const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG];
                  return (
                    <button
                      key={tier}
                      onClick={() => {
                        const newTier = filters.tier.includes(tier)
                          ? filters.tier.filter(t => t !== tier)
                          : [...filters.tier, tier];
                        onFilterChange({ ...filters, tier: newTier });
                      }}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition min-h-[32px] ${
                        filters.tier.includes(tier)
                          ? config.color + ' ring-2 ring-offset-1 ring-[var(--primary)]'
                          : 'bg-[var(--background-card)] text-[var(--foreground-muted)] border border-[var(--border)]'
                      }`}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-2">Min Orders</label>
              <input
                type="number"
                min="0"
                value={filters.minOrders}
                onChange={(e) => onFilterChange({ ...filters, minOrders: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-[var(--background-card)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] min-h-[40px]"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-2">Min Spent (MWK)</label>
              <input
                type="number"
                min="0"
                step="10000"
                value={filters.minSpent}
                onChange={(e) => onFilterChange({ ...filters, minSpent: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-[var(--background-card)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] min-h-[40px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-2">Date Range</label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'week', label: 'Last 7 Days' },
                { value: 'month', label: 'Last 30 Days' },
                { value: 'year', label: 'Last Year' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => onFilterChange({ ...filters, dateRange: option.value as any })}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition min-h-[36px] ${
                    filters.dateRange === option.value
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--background-card)] text-[var(--foreground-muted)] border border-[var(--border)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => onFilterChange({
                status: [],
                tier: [],
                minOrders: 0,
                minSpent: 0,
                dateRange: 'all',
                search: '',
              })}
              className="text-xs sm:text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
          Showing <span className="font-medium text-[var(--foreground)]">{totalCount}</span> customers
        </p>
      </div>
    </div>
  );
}

function CustomerCard({ customer, onView, onAction, onResendVerification, onManualVerify, isLoading }: {
  customer: Customer;
  onView: () => void;
  onAction: (action: string) => void;
  onResendVerification: () => void;
  onManualVerify: () => void;
  isLoading: boolean;
}) {
  const status = STATUS_CONFIG[customer.account_status];
  const StatusIcon = status?.icon;
  const tier = customer.loyalty_tier ? TIER_CONFIG[customer.loyalty_tier] : TIER_CONFIG.bronze;
  const TierIcon = tier.icon;

  return (
    <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 bg-[var(--primary)] rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[var(--foreground)] text-sm truncate">{customer.name}</h3>
            <p className="text-xs text-[var(--foreground-muted)] truncate">{customer.email}</p>
          </div>
        </div>
        <div className="flex gap-0.5 flex-shrink-0">
          <button
            onClick={onView}
            className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <Eye size={16} className="text-[var(--foreground-muted)]" />
          </button>
          <div className="relative group">
            <button className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition min-h-[36px] min-w-[36px] flex items-center justify-center">
              <MoreVertical size={16} className="text-[var(--foreground-muted)]" />
            </button>
            <div className="absolute right-0 top-full mt-1 bg-[var(--background-card)] rounded-lg shadow-lg border border-[var(--border)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-10 min-w-[120px]">
              {status.actions.map(action => (
                <button
                  key={action}
                  onClick={() => onAction(action)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-left text-xs sm:text-sm text-[var(--foreground)] hover:bg-[var(--background-secondary)] first:rounded-t-lg last:rounded-b-lg disabled:opacity-50 transition"
                >
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-[var(--foreground-muted)]">Phone</span>
          <span className="text-[var(--foreground)]">{customer.phone || '-'}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-[var(--foreground-muted)]">Orders</span>
          <span className="font-medium text-[var(--foreground)]">{customer.total_orders}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-[var(--foreground-muted)]">Total Spent</span>
          <span className="font-medium text-[var(--primary)]">{formatCurrency(customer.total_spent)}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-[var(--foreground-muted)]">Last Active</span>
          <span className="text-[var(--foreground-muted)]">{formatRelativeTime(customer.last_active || customer.last_order_date)}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-[var(--foreground-muted)]">Email</span>
          <span className={customer.email_verified ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
            {customer.email_verified ? 'Verified' : 'Pending'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[var(--border)]">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${status.color}`}>
          <StatusIcon size={10} />
          {status.label}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${tier.color}`}>
          <TierIcon size={10} />
          {tier.label}
        </span>
        {!customer.email_verified && (
          <>
            <button
              onClick={onResendVerification}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
            >
              <Send size={10} />
              Resend
            </button>
            <button
              onClick={onManualVerify}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition"
            >
              <CheckCircle size={10} />
              Verify
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; action: string; customerId: string }>({
    open: false,
    action: '',
    customerId: '',
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    tier: [],
    minOrders: 0,
    minSpent: 0,
    dateRange: 'all',
    search: '',
  });
  const [sortBy, setSortBy] = useState<'name' | 'total_spent' | 'total_orders' | 'last_order_date'>('total_spent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const debouncedSearch = useDebounce(filters.search, 300);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers');
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      
      const customersWithTiers = data.map((customer: Customer) => ({
        ...customer,
        loyalty_tier: calculateTier(customer.total_spent),
      }));
      
      setCustomers(customersWithTiers);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.phone?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status.length > 0) {
      filtered = filtered.filter(c => filters.status.includes(c.account_status));
    }

    if (filters.tier.length > 0) {
      filtered = filtered.filter(c => filters.tier.includes(c.loyalty_tier || 'bronze'));
    }

    filtered = filtered.filter(c => c.total_orders >= filters.minOrders);
    filtered = filtered.filter(c => c.total_spent >= filters.minSpent);

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (filters.dateRange === 'week') cutoff.setDate(now.getDate() - 7);
      if (filters.dateRange === 'month') cutoff.setMonth(now.getMonth() - 1);
      if (filters.dateRange === 'year') cutoff.setFullYear(now.getFullYear() - 1);
      
      filtered = filtered.filter(c => new Date(c.last_order_date) >= cutoff);
    }

    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'name') {
        aVal = a.name;
        bVal = b.name;
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [customers, debouncedSearch, filters, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy, sortOrder, itemsPerPage]);

  const viewProfile = useCallback(async (id: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setLoadingProfile(true);
    setModalOpen(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        signal: abortController.signal
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setSelectedCustomer(data);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Failed to load customer profile');
      }
    } finally {
      setLoadingProfile(false);
      abortControllerRef.current = null;
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: string) => {
    if (!VALID_STATUSES.includes(status)) {
      toast.error('Invalid status');
      return;
    }
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success(`Customer ${status} successfully`);
      await fetchCustomers();
      if (modalOpen && selectedCustomer?.user?.id === id) {
        await viewProfile(id);
      }
    } catch (err) {
      toast.error('Failed to update customer status');
    } finally {
      setActionLoading(null);
    }
  }, [fetchCustomers, modalOpen, selectedCustomer, viewProfile]);

  const softDelete = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete customer');
      toast.success('Customer deleted successfully');
      await fetchCustomers();
      setModalOpen(false);
    } catch (err) {
      toast.error('Failed to delete customer');
    } finally {
      setActionLoading(null);
    }
  }, [fetchCustomers]);

  const restore = useCallback(async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/customers/${id}/restore`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to restore customer');
      toast.success('Customer restored successfully');
      await fetchCustomers();
    } catch (err) {
      toast.error('Failed to restore customer');
    } finally {
      setActionLoading(null);
    }
  }, [fetchCustomers]);

  const resendVerification = useCallback(async (id: string, email: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/customers/${id}/resend-verification`, {
        method: 'POST'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to resend verification');
      }
      toast.success(`Verification email sent to ${email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend verification');
    } finally {
      setActionLoading(null);
    }
  }, []);

  const manualVerify = useCallback(async (id: string, name: string) => {
    if (!confirm(`Manually verify ${name}? They will be able to log in immediately.`)) return;
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/customers/${id}/verify`, {
        method: 'POST'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to verify user');
      }
      toast.success(`${name} verified successfully`);
      await fetchCustomers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to verify user');
    } finally {
      setActionLoading(null);
    }
  }, [fetchCustomers]);

  const handleAction = useCallback((customerId: string, action: string) => {
    setConfirmModal({ open: true, action, customerId });
  }, []);

  const executeAction = useCallback(() => {
    const { action, customerId } = confirmModal;
    switch (action) {
      case 'activate':
        updateStatus(customerId, 'active');
        break;
      case 'freeze':
        updateStatus(customerId, 'frozen');
        break;
      case 'ban':
        updateStatus(customerId, 'banned');
        break;
      case 'delete':
        softDelete(customerId);
        break;
      case 'restore':
        restore(customerId);
        break;
    }
    setConfirmModal({ open: false, action: '', customerId: '' });
  }, [confirmModal, updateStatus, softDelete, restore]);

  const exportToCSV = useCallback(() => {
    setExporting(true);
    try {
      const headers = ['Name', 'Email', 'Phone', 'Status', 'Email Verified', 'Total Orders', 'Total Spent', 'Last Order', 'Loyalty Tier'];
      const rows = filteredCustomers.map(c => [
        c.name,
        c.email,
        c.phone || '',
        c.account_status,
        c.email_verified ? 'Yes' : 'No',
        c.total_orders.toString(),
        c.total_spent.toString(),
        formatDate(c.last_order_date),
        c.loyalty_tier || 'bronze',
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Export completed');
    } catch (err) {
      toast.error('Failed to export customers');
    } finally {
      setExporting(false);
    }
  }, [filteredCustomers]);

  const stats = useMemo(() => {
    const active = customers.filter(c => c.account_status === 'active').length;
    const frozen = customers.filter(c => c.account_status === 'frozen' || c.account_status === 'banned').length;
    const verified = customers.filter(c => c.email_verified).length;
    const unverified = customers.filter(c => !c.email_verified).length;
    const totalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0);
    const avgOrderValue = customers.length > 0 ? totalSpent / customers.length : 0;
    
    return { active, frozen, verified, unverified, totalSpent, avgOrderValue };
  }, [customers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
          <CustomersSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="sticky top-0 z-20 bg-[var(--background-card)] border-b border-[var(--border)] shadow-sm">
        <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Customers</h1>
              </div>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
                Manage customer relationships and account status
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Total Customers</p>
                <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">{customers.length}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-50 dark:bg-orange-950/30 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Active</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center">
                <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Verified</p>
                <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">{stats.verified}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Pending Verification</p>
                <p className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.unverified}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-50 dark:bg-yellow-950/30 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          totalCount={filteredCustomers.length}
          onExport={exportToCSV}
          exporting={exporting}
        />

        <div className="hidden lg:block mt-4 sm:mt-6">
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-[var(--background-secondary)] border-b border-[var(--border)]">
                  <tr>
                    {[
                      { key: 'name', label: 'Customer', sortable: true },
                      { key: 'contact', label: 'Contact', sortable: false },
                      { key: 'status', label: 'Status', sortable: false },
                      { key: 'verification', label: 'Verification', sortable: false },
                      { key: 'total_orders', label: 'Orders', sortable: true },
                      { key: 'total_spent', label: 'Total Spent', sortable: true },
                      { key: 'last_order_date', label: 'Last Active', sortable: true },
                      { key: 'tier', label: 'Tier', sortable: false },
                      { key: 'actions', label: '', sortable: false },
                    ].map(column => (
                      <th key={column.key} className="px-4 sm:px-6 py-3 text-left">
                        {column.sortable ? (
                          <button
                            onClick={() => {
                              if (sortBy === column.key) {
                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                              } else {
                                setSortBy(column.key as any);
                                setSortOrder('desc');
                              }
                            }}
                            className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider hover:text-[var(--foreground)] transition"
                          >
                            {column.label}
                            <ArrowUpDown size={12} />
                          </button>
                        ) : (
                          <span className="text-[10px] sm:text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
                            {column.label}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {paginatedCustomers.map((customer) => {
                    const status = STATUS_CONFIG[customer.account_status];
                    const StatusIcon = status.icon;
                    const tier = customer.loyalty_tier ? TIER_CONFIG[customer.loyalty_tier] : TIER_CONFIG.bronze;
                    const TierIcon = tier.icon;
                    
                    return (
                      <tr key={customer.id} className="hover:bg-[var(--background-secondary)] transition">
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-sm text-[var(--foreground)] truncate max-w-[120px] sm:max-w-[200px]">
                              {customer.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] truncate max-w-[120px] sm:max-w-[180px]">
                            {customer.email}
                          </p>
                          <p className="text-[10px] text-[var(--foreground-muted)]">{customer.phone || '-'}</p>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${status.color}`}>
                            <StatusIcon size={10} className="sm:w-3 sm:h-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                              customer.email_verified 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {customer.email_verified ? (
                                <><CheckCircle size={10} /> Verified</>
                              ) : (
                                <><Clock size={10} /> Pending</>
                              )}
                            </span>
                            {!customer.email_verified && (
                              <>
                                <button
                                  onClick={() => resendVerification(customer.id, customer.email)}
                                  disabled={actionLoading === customer.id}
                                  className="p-1 rounded hover:bg-[var(--background-secondary)] transition text-blue-600 dark:text-blue-400 disabled:opacity-50"
                                  title="Resend verification email"
                                >
                                  <Send size={14} />
                                </button>
                                <button
                                  onClick={() => manualVerify(customer.id, customer.name)}
                                  disabled={actionLoading === customer.id}
                                  className="p-1 rounded hover:bg-[var(--background-secondary)] transition text-green-600 dark:text-green-400 disabled:opacity-50"
                                  title="Manually verify"
                                >
                                  <CheckCircle size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-[var(--foreground)]">{customer.total_orders}</td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-semibold text-[var(--primary)]">
                          {formatCurrency(customer.total_spent)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-[var(--foreground-muted)]">
                          {formatRelativeTime(customer.last_order_date)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <span className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] ${tier.color}`}>
                            <TierIcon size={10} className="sm:w-3 sm:h-3" />
                            {tier.label}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex gap-0.5 sm:gap-1">
                            <button
                              onClick={() => viewProfile(customer.id)}
                              className="p-1.5 rounded-lg hover:bg-[var(--background-secondary)] transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                              title="View Profile"
                            >
                              <Eye size={14} className="text-[var(--foreground-muted)]" />
                            </button>
                            <div className="relative group">
                              <button className="p-1.5 rounded-lg hover:bg-[var(--background-secondary)] transition min-h-[32px] min-w-[32px] flex items-center justify-center">
                                <MoreVertical size={14} className="text-[var(--foreground-muted)]" />
                              </button>
                              <div className="absolute right-0 top-full mt-1 bg-[var(--background-card)] rounded-lg shadow-lg border border-[var(--border)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-10 min-w-[130px]">
                                {status.actions.map(action => (
                                  <button
                                    key={action}
                                    onClick={() => handleAction(customer.id, action)}
                                    disabled={actionLoading === customer.id}
                                    className="w-full px-4 py-2 text-left text-xs sm:text-sm text-[var(--foreground)] hover:bg-[var(--background-secondary)] first:rounded-t-lg last:rounded-b-lg disabled:opacity-50 transition"
                                  >
                                    {actionLoading === customer.id ? (
                                      <Loader2 size={14} className="animate-spin mx-auto" />
                                    ) : (
                                      action.charAt(0).toUpperCase() + action.slice(1)
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="px-2 py-1 border border-[var(--border)] rounded-lg text-sm bg-[var(--background-card)] text-[var(--foreground)] min-h-[36px]"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                    per page
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--background-secondary)] transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <ChevronLeft size={16} className="text-[var(--foreground-muted)]" />
                  </button>
                  <span className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--background-secondary)] transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <ChevronRight size={16} className="text-[var(--foreground-muted)]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:hidden mt-4 space-y-3">
          {paginatedCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onView={() => viewProfile(customer.id)}
              onAction={(action) => handleAction(customer.id, action)}
              onResendVerification={() => resendVerification(customer.id, customer.email)}
              onManualVerify={() => manualVerify(customer.id, customer.name)}
              isLoading={actionLoading === customer.id}
            />
          ))}
          
          {paginatedCustomers.length === 0 && (
            <div className="text-center py-8 sm:py-12">
              {debouncedSearch ? (
                <>
                  <Search className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-[var(--foreground-muted)] opacity-30" />
                  <p className="text-sm text-[var(--foreground-muted)]">No customers match "{debouncedSearch}"</p>
                  <button 
                    onClick={() => setFilters({...filters, search: ''})}
                    className="mt-2 text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <HelpCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-[var(--foreground-muted)] opacity-30" />
                  <p className="text-sm text-[var(--foreground-muted)]">No customers found</p>
                </>
              )}
            </div>
          )}

          {totalPages > 1 && paginatedCustomers.length > 0 && (
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-[var(--border)] disabled:opacity-50 text-sm text-[var(--foreground)] min-h-[44px]"
              >
                Previous
              </button>
              <span className="text-sm text-[var(--foreground-muted)]">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-[var(--border)] disabled:opacity-50 text-sm text-[var(--foreground)] min-h-[44px]"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[var(--background-card)] rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-[var(--background-card)] border-b border-[var(--border)] px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                  <User className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <h2 className="text-base sm:text-xl font-bold text-[var(--foreground)]">Customer Profile</h2>
              </div>
              <button
                onClick={() => {
                  setModalOpen(false);
                  if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                  }
                }}
                className="p-1.5 sm:p-2 hover:bg-[var(--background-secondary)] rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--foreground-muted)]" />
              </button>
            </div>
            
            {loadingProfile ? (
              <div className="p-10 flex justify-center">
                <Loader2 className="animate-spin text-[var(--primary)] w-8 h-8" />
              </div>
            ) : selectedCustomer ? (
              <div className="overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[calc(95vh-70px)] sm:max-h-[calc(90vh-70px)]">
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 bg-[var(--background-secondary)] rounded-xl p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-[var(--foreground-muted)] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--foreground)] text-sm truncate">{selectedCustomer.user.name}</p>
                      <p className="text-[10px] text-[var(--foreground-muted)]">Name</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-[var(--foreground-muted)] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-[var(--foreground)] truncate">{selectedCustomer.user.email}</p>
                      <p className="text-[10px] text-[var(--foreground-muted)]">Email</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-[var(--foreground-muted)] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-[var(--foreground)]">{selectedCustomer.user.phone || '-'}</p>
                      <p className="text-[10px] text-[var(--foreground-muted)]">Phone</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-[var(--foreground-muted)] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-[var(--foreground)]">{formatDate(selectedCustomer.user.created_at)}</p>
                      <p className="text-[10px] text-[var(--foreground-muted)]">Joined</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-orange-50 dark:bg-orange-950/30 p-3 sm:p-4 rounded-xl text-center">
                    <p className="text-xl sm:text-2xl font-bold text-[var(--primary)]">{selectedCustomer.orders?.length || 0}</p>
                    <p className="text-[10px] text-[var(--foreground-muted)]">Orders</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 sm:p-4 rounded-xl text-center">
                    <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(selectedCustomer.orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0)}
                    </p>
                    <p className="text-[10px] text-[var(--foreground-muted)]">Total Spent</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 sm:p-4 rounded-xl text-center">
                    <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedCustomer.topProducts?.length || 0}</p>
                    <p className="text-[10px] text-[var(--foreground-muted)]">Unique Products</p>
                  </div>
                </div>

                {selectedCustomer.topProducts && selectedCustomer.topProducts.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base mb-2 sm:mb-3 flex items-center gap-2">
                      <TrendingUp size={16} className="text-[var(--primary)]" />
                      Most Purchased
                    </h3>
                    <div className="space-y-1.5 sm:space-y-2 bg-[var(--background-secondary)] rounded-xl p-3 sm:p-4">
                      {selectedCustomer.topProducts.map((product, idx) => (
                        <div key={idx} className="flex justify-between items-center border-b border-[var(--border)] pb-1.5 last:border-0">
                          <span className="text-xs sm:text-sm text-[var(--foreground)] truncate max-w-[150px] sm:max-w-[250px]">{product.product_name}</span>
                          <span className="font-medium text-[var(--foreground)] text-xs sm:text-sm">{product.total_quantity} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base mb-2 sm:mb-3 flex items-center gap-2">
                      <Package size={16} className="text-[var(--primary)]" />
                      Order History
                    </h3>
                    <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-96 overflow-y-auto pr-1">
                      {selectedCustomer.orders.map((order) => (
                        <div key={order.id} className="border border-[var(--border)] rounded-xl p-3 sm:p-4">
                          <div className="flex flex-wrap justify-between items-start gap-2 mb-1.5">
                            <div>
                              <p className="font-medium text-[var(--foreground)] text-xs sm:text-sm">Order #{order.id.slice(-8)}</p>
                              <p className="text-[10px] text-[var(--foreground-muted)]">{formatRelativeTime(order.created_at)}</p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${ORDER_STATUS_CONFIG[order.status]?.color || 'bg-gray-100'}`}>
                              {ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-[var(--primary)]">{formatCurrency(order.total_amount)}</p>
                          {order.items && order.items.length > 0 && (
                            <div className="mt-1.5 text-[10px] text-[var(--foreground-muted)] space-y-0.5">
                              {order.items.slice(0, 3).map((item, i) => (
                                <div key={i}>{item.product_name} x {item.quantity}</div>
                              ))}
                              {order.items.length > 3 && <div>+{order.items.length - 3} more items</div>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-10 text-center text-[var(--foreground-muted)]">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Failed to load customer profile</p>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, action: '', customerId: '' })}
        onConfirm={executeAction}
        title={`Confirm ${confirmModal.action}`}
        message={`Are you sure you want to ${confirmModal.action} this customer?`}
        confirmText={confirmModal.action.charAt(0).toUpperCase() + confirmModal.action.slice(1)}
        type={confirmModal.action === 'delete' ? 'danger' : 'warning'}
      />
    </div>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
```
