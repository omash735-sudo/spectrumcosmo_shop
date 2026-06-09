'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  Eye, Loader2, User, Mail, Phone, Calendar, Package, 
  TrendingUp, CheckCircle, AlertCircle, Trash2, RefreshCw, 
  X, ShoppingBag, DollarSign, Star, MoreVertical, Search, 
  Filter, Download, ChevronLeft, ChevronRight, ArrowUpDown,
  Users, UserCheck, UserX, Clock, Shield, Send, Copy,
  Settings, BarChart3, Activity, Zap, Award, Crown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

// ============================================
// TYPES
// ============================================

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  account_status: 'active' | 'frozen' | 'banned' | 'deleted';
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

// ============================================
// CONSTANTS & HELPERS
// ============================================

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
  return new Intl.NumberFormat('en-US', {
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

// ============================================
// CUSTOM HOOKS
// ============================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });
  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  };
  return [storedValue, setValue];
}

// ============================================
// CONFIRMATION MODAL COMPONENT
// ============================================

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
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg text-white transition ${colors[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// FILTER BAR COMPONENT
// ============================================

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
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Filters</span>
            {Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== '' && v !== 'all' && v !== 0) && (
              <span className="w-2 h-2 bg-orange-500 rounded-full" />
            )}
          </button>
          <button
            onClick={onExport}
            disabled={exporting}
            className="px-4 py-2.5 bg-gray-900 dark:bg-gray-800 text-white rounded-xl flex items-center gap-2 hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {['active', 'frozen', 'banned', 'deleted'].map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      const newStatus = filters.status.includes(status)
                        ? filters.status.filter(s => s !== status)
                        : [...filters.status, status];
                      onFilterChange({ ...filters, status: newStatus });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      filters.status.includes(status)
                        ? STATUS_CONFIG[status].color + ' ring-2 ring-offset-1 ring-orange-500'
                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {STATUS_CONFIG[status].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loyalty Tier</label>
              <div className="flex flex-wrap gap-2">
                {['bronze', 'silver', 'gold', 'platinum'].map(tier => (
                  <button
                    key={tier}
                    onClick={() => {
                      const newTier = filters.tier.includes(tier)
                        ? filters.tier.filter(t => t !== tier)
                        : [...filters.tier, tier];
                      onFilterChange({ ...filters, tier: newTier });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      filters.tier.includes(tier)
                        ? TIER_CONFIG[tier as keyof typeof TIER_CONFIG].color + ' ring-2 ring-offset-1 ring-orange-500'
                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {TIER_CONFIG[tier as keyof typeof TIER_CONFIG].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min Orders</label>
              <input
                type="number"
                min="0"
                value={filters.minOrders}
                onChange={(e) => onFilterChange({ ...filters, minOrders: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min Spent (MWK)</label>
              <input
                type="number"
                min="0"
                step="10000"
                value={filters.minSpent}
                onChange={(e) => onFilterChange({ ...filters, minSpent: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'week', label: 'Last 7 Days' },
                { value: 'month', label: 'Last 30 Days' },
                { value: 'year', label: 'Last Year' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => onFilterChange({ ...filters, dateRange: option.value as any })}
                  className={`px-4 py-2 rounded-lg text-sm transition ${
                    filters.dateRange === option.value
                      ? 'bg-orange-500 text-white'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
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
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing <span className="font-medium text-gray-900 dark:text-white">{totalCount}</span> customers
        </p>
      </div>
    </div>
  );
}

// ============================================
// CUSTOMER CARD (Mobile)
// ============================================

function CustomerCard({ customer, onView, onAction, isLoading }: {
  customer: Customer;
  onView: () => void;
  onAction: (action: string) => void;
  isLoading: boolean;
}) {
  const status = STATUS_CONFIG[customer.account_status];
  const StatusIcon = status?.icon;
  const tier = customer.loyalty_tier ? TIER_CONFIG[customer.loyalty_tier] : TIER_CONFIG.bronze;
  const TierIcon = tier.icon;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{customer.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{customer.email}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onView}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <Eye size={16} />
          </button>
          <div className="relative group">
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <MoreVertical size={16} />
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-10 min-w-[120px]">
              {status.actions.map(action => (
                <button
                  key={action}
                  onClick={() => onAction(action)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg disabled:opacity-50"
                >
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Phone</span>
          <span className="text-gray-900 dark:text-white">{customer.phone || '-'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Orders</span>
          <span className="font-medium text-gray-900 dark:text-white">{customer.total_orders}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Total Spent</span>
          <span className="font-medium text-orange-600 dark:text-orange-400">{formatCurrency(customer.total_spent)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Last Active</span>
          <span className="text-gray-600 dark:text-gray-400">{formatRelativeTime(customer.last_active || customer.last_order_date)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.color}`}>
          <StatusIcon size={12} />
          {status.label}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${tier.color}`}>
          <TierIcon size={12} />
          {tier.label}
        </span>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

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
  
  // Abort controller ref for profile fetching
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Filtering & Sorting
  const [filters, setFilters] = useLocalStorage<FilterState>('customer-filters', {
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

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/customers');
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      
      // Calculate loyalty tiers based on spending
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

  // ============================================
  // FILTERING & SORTING LOGIC
  // ============================================

  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];

    // Search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.phone?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(c => filters.status.includes(c.account_status));
    }

    // Tier filter
    if (filters.tier.length > 0) {
      filtered = filtered.filter(c => filters.tier.includes(c.loyalty_tier || 'bronze'));
    }

    // Min orders filter
    filtered = filtered.filter(c => c.total_orders >= filters.minOrders);

    // Min spent filter
    filtered = filtered.filter(c => c.total_spent >= filters.minSpent);

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (filters.dateRange === 'week') cutoff.setDate(now.getDate() - 7);
      if (filters.dateRange === 'month') cutoff.setMonth(now.getMonth() - 1);
      if (filters.dateRange === 'year') cutoff.setFullYear(now.getFullYear() - 1);
      
      filtered = filtered.filter(c => new Date(c.last_order_date) >= cutoff);
    }

    // Sorting
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

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Reset to first page when filters or items per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy, sortOrder, itemsPerPage]);

  // ============================================
  // ACTIONS
  // ============================================

  const viewProfile = useCallback(async (id: string) => {
    // Cancel any in-flight request
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
    // Validate status
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
      const headers = ['Name', 'Email', 'Phone', 'Status', 'Total Orders', 'Total Spent', 'Last Order', 'Loyalty Tier'];
      const rows = filteredCustomers.map(c => [
        c.name,
        c.email,
        c.phone || '',
        c.account_status,
        c.total_orders.toString(),
        c.total_spent.toString(),
        formatDate(c.last_order_date),
        c.loyalty_tier || 'bronze',
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
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

  // ============================================
  // STATS CARDS
  // ============================================

  const stats = useMemo(() => {
    const active = customers.filter(c => c.account_status === 'active').length;
    const frozen = customers.filter(c => c.account_status === 'frozen' || c.account_status === 'banned').length;
    const totalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0);
    const avgOrderValue = customers.length > 0 ? totalSpent / customers.length : 0;
    
    return { active, frozen, totalSpent, avgOrderValue };
  }, [customers]);

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-orange-500 w-10 h-10 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-7 h-7 text-orange-500" />
                Customers
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage customer relationships and account status
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{customers.length}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Restricted</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.frozen}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <UserX className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg Order Value</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(stats.avgOrderValue)}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          totalCount={filteredCustomers.length}
          onExport={exportToCSV}
          exporting={exporting}
        />

        {/* Desktop Table View */}
        <div className="hidden lg:block mt-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    {[
                      { key: 'name', label: 'Customer', sortable: true },
                      { key: 'contact', label: 'Contact', sortable: false },
                      { key: 'status', label: 'Status', sortable: false },
                      { key: 'total_orders', label: 'Orders', sortable: true },
                      { key: 'total_spent', label: 'Total Spent', sortable: true },
                      { key: 'last_order_date', label: 'Last Active', sortable: true },
                      { key: 'tier', label: 'Tier', sortable: false },
                      { key: 'actions', label: '', sortable: false },
                    ].map(column => (
                      <th key={column.key} className="px-6 py-4 text-left">
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
                            className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            {column.label}
                            <ArrowUpDown size={12} />
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {column.label}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginatedCustomers.map((customer) => {
                    const status = STATUS_CONFIG[customer.account_status];
                    const StatusIcon = status.icon;
                    const tier = customer.loyalty_tier ? TIER_CONFIG[customer.loyalty_tier] : TIER_CONFIG.bronze;
                    const TierIcon = tier.icon;
                    
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-sm text-gray-900 dark:text-white">{customer.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 dark:text-gray-400">{customer.email}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{customer.phone || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon size={12} />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{customer.total_orders}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-orange-600 dark:text-orange-400">
                          {formatCurrency(customer.total_spent)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(customer.last_order_date)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${tier.color}`}>
                            <TierIcon size={10} />
                            {tier.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            <button
                              onClick={() => viewProfile(customer.id)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                              title="View Profile"
                            >
                              <Eye size={16} className="text-gray-500" />
                            </button>
                            <div className="relative group">
                              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                <MoreVertical size={16} className="text-gray-500" />
                              </button>
                              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-10 min-w-[130px]">
                                {status.actions.map(action => (
                                  <button
                                    key={action}
                                    onClick={() => handleAction(customer.id, action)}
                                    disabled={actionLoading === customer.id}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg disabled:opacity-50"
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    per page
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden mt-6 space-y-3">
          {paginatedCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onView={() => viewProfile(customer.id)}
              onAction={(action) => handleAction(customer.id, action)}
              isLoading={actionLoading === customer.id}
            />
          ))}
          
          {paginatedCustomers.length === 0 && (
            <div className="text-center py-12">
              {debouncedSearch ? (
                <>
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">No customers match "{debouncedSearch}"</p>
                  <button 
                    onClick={() => setFilters({...filters, search: ''})}
                    className="mt-2 text-orange-500 hover:text-orange-600 text-sm"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">No customers found</p>
                </>
              )}
            </div>
          )}

          {/* Mobile Pagination */}
          {totalPages > 1 && paginatedCustomers.length > 0 && (
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Customer Profile Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Customer Profile</h2>
              <button
                onClick={() => {
                  setModalOpen(false);
                  if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                  }
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            {loadingProfile ? (
              <div className="p-10 flex justify-center">
                <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
              </div>
            ) : selectedCustomer ? (
              <div className="overflow-y-auto p-6 space-y-6 max-h-[calc(90vh-70px)]">
                {/* User Info */}
                <div className="grid md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedCustomer.user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{selectedCustomer.user.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{selectedCustomer.user.phone || '-'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(selectedCustomer.user.created_at)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{selectedCustomer.orders?.length || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Orders</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(selectedCustomer.orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Spent</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedCustomer.topProducts?.length || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Unique Products</p>
                  </div>
                </div>

                {/* Top Products */}
                {selectedCustomer.topProducts && selectedCustomer.topProducts.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <TrendingUp size={18} className="text-orange-500" />
                      Most Purchased
                    </h3>
                    <div className="space-y-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      {selectedCustomer.topProducts.map((product, idx) => (
                        <div key={idx} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{product.product_name}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{product.total_quantity} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order History */}
                {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Package size={18} className="text-orange-500" />
                      Order History
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {selectedCustomer.orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">Order #{order.id.slice(-8)}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(order.created_at)}</p>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_CONFIG[order.status]?.color || 'bg-gray-100'}`}>
                              {ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-orange-600 dark:text-orange-400">{formatCurrency(order.total_amount)}</p>
                          {order.items && order.items.length > 0 && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
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
              <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Failed to load customer profile</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
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
