'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Eye, Loader2, User, Mail, Phone, Calendar, Package, 
  TrendingUp, CheckCircle, AlertCircle, Trash2, RefreshCw, 
  X, ShoppingBag, DollarSign, Star, MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';

// Types
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  account_status: 'active' | 'frozen' | 'banned' | 'deleted';
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  created_at?: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price?: number;
}

interface Order {
  id: string;
  status: string;
  created_at: string;
  total_amount: number;
  items?: OrderItem[];
}

interface TopProduct {
  product_name: string;
  total_quantity: number;
}

interface CustomerProfile {
  user: Customer;
  orders: Order[];
  topProducts: TopProduct[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  declined: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const ACCOUNT_STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  frozen: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  banned: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  deleted: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
};

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
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}

function getStatusBadge(status: string) {
  const styles = ACCOUNT_STATUS_STYLES[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  const labels: Record<string, string> = {
    active: 'Active',
    frozen: 'Frozen',
    banned: 'Banned',
    deleted: 'Deleted',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles}`}>
      {labels[status] || status}
    </span>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/customers');
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch customers:', errorMessage);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const viewProfile = async (id: string) => {
    setLoadingProfile(true);
    setModalOpen(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setSelectedCustomer(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch profile:', errorMessage);
      toast.error('Failed to load customer profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success(`Customer status updated to ${status}`);
      await fetchCustomers();
      if (modalOpen && selectedCustomer?.user?.id === id) {
        await viewProfile(id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const softDelete = async (id: string) => {
    const confirmed = window.confirm('Soft delete this customer? Data will be retained for cleanup period.');
    if (!confirmed) return;
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete customer');
      toast.success('Customer deleted successfully');
      await fetchCustomers();
      setModalOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const restore = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/customers/${id}/restore`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to restore customer');
      toast.success('Customer restored successfully');
      await fetchCustomers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-orange-500 w-8 h-8 mb-3" />
        <p className="text-gray-500 dark:text-gray-400">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Shopify-style Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage customer profiles and account status
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{customers.length}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {customers.filter(c => c.account_status === 'active').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Frozen / Banned</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {customers.filter(c => c.account_status === 'frozen' || c.account_status === 'banned').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Customer List</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">{customers.length} customers</span>
          </div>
          
          {customers.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No customers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="text-left px-6 py-3">Customer</th>
                    <th className="text-left px-6 py-3">Contact</th>
                    <th className="text-left px-6 py-3">Status</th>
                    <th className="text-left px-6 py-3">Orders</th>
                    <th className="text-left px-6 py-3">Total Spent</th>
                    <th className="text-left px-6 py-3">Last Order</th>
                    <th className="text-right px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className="px-6 py-4">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{customer.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{customer.phone || '-'}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{customer.email}</p>
                       </td>
                      <td className="px-6 py-4">{getStatusBadge(customer.account_status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{customer.total_orders}</td>
                      <td className="px-6 py-4 text-sm font-medium text-orange-600 dark:text-orange-400">
                        {formatCurrency(customer.total_spent)}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(customer.last_order_date)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => viewProfile(customer.id)}
                            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 transition"
                            title="View Profile"
                          >
                            <Eye size={16} />
                          </button>
                          {customer.account_status !== 'active' && customer.account_status !== 'deleted' && (
                            <button
                              onClick={() => restore(customer.id)}
                              disabled={actionLoading === customer.id}
                              className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/30 text-green-600 dark:text-green-400 transition disabled:opacity-50"
                              title="Restore"
                            >
                              {actionLoading === customer.id ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                            </button>
                          )}
                          {customer.account_status === 'active' && (
                            <button
                              onClick={() => updateStatus(customer.id, 'frozen')}
                              disabled={actionLoading === customer.id}
                              className="p-2 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 transition disabled:opacity-50"
                              title="Freeze Account"
                            >
                              {actionLoading === customer.id ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
                            </button>
                          )}
                          {customer.account_status === 'frozen' && (
                            <button
                              onClick={() => updateStatus(customer.id, 'active')}
                              disabled={actionLoading === customer.id}
                              className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/30 text-green-600 dark:text-green-400 transition disabled:opacity-50"
                              title="Activate Account"
                            >
                              {actionLoading === customer.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            </button>
                          )}
                          {customer.account_status !== 'deleted' && (
                            <button
                              onClick={() => softDelete(customer.id)}
                              disabled={actionLoading === customer.id}
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition disabled:opacity-50"
                              title="Delete Account"
                            >
                              {actionLoading === customer.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            </button>
                          )}
                        </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Customer Profile Modal - Shopify Style */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Customer Profile</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                aria-label="Close modal"
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
                {/* User Info Cards */}
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedCustomer.user.name}</p>
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
                      <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(selectedCustomer.user.created_at || '')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid - FIXED: Typed reduce callback */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-xl text-center">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {selectedCustomer.orders?.length || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Orders</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-xl text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(
                        selectedCustomer.orders?.reduce((sum: number, order: Order) => sum + (order.total_amount || 0), 0) || 0
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Spent</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedCustomer.topProducts?.length || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Unique Products</p>
                  </div>
                </div>

                {/* Most Purchased Products */}
                {selectedCustomer.topProducts && selectedCustomer.topProducts.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <TrendingUp size={18} className="text-orange-500" />
                      Most Purchased
                    </h3>
                    <div className="space-y-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      {selectedCustomer.topProducts.map((product: TopProduct, idx: number) => (
                        <div key={idx} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{product.product_name}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{product.total_quantity} units</span>
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
                      {selectedCustomer.orders.map((order: Order) => (
                        <div key={order.id} className="border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">Order #{order.id.slice(-8)}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(order.created_at)}</p>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="mt-3 text-sm">
                            <p className="text-gray-600 dark:text-gray-400">Total: {formatCurrency(order.total_amount)}</p>
                            {order.items && order.items.length > 0 && (
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                {order.items.map((item: OrderItem, i: number) => (
                                  <div key={i}>
                                    {item.product_name} x {item.quantity}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
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
    </div>
  );
}
