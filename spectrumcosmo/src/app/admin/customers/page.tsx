'use client'

import { useEffect, useState } from 'react'
import { Eye, Loader2, User, Mail, Phone, Calendar, Package, TrendingUp, CheckCircle, AlertCircle, Trash2, RefreshCw } from 'lucide-react'

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  account_status: string
  total_orders: number
  total_spent: number
  last_order_date: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchCustomers = async () => {
    const res = await fetch('/api/admin/customers')
    const data = await res.json()
    setCustomers(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const viewProfile = async (id: string) => {
    setLoadingProfile(true)
    setModalOpen(true)
    const res = await fetch(`/api/admin/customers/${id}`)
    const data = await res.json()
    setSelectedCustomer(data)
    setLoadingProfile(false)
  }

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id)
    await fetch(`/api/admin/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    await fetchCustomers()
    setActionLoading(null)
    if (modalOpen && selectedCustomer?.user?.id === id) {
      viewProfile(id)
    }
  }

  const softDelete = async (id: string) => {
    if (!confirm('Soft delete this customer? Data will be retained for cleanup period.')) return
    setActionLoading(id)
    await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' })
    await fetchCustomers()
    setActionLoading(null)
    setModalOpen(false)
  }

  const restore = async (id: string) => {
    setActionLoading(id)
    await fetch(`/api/admin/customers/${id}/restore`, { method: 'POST' })
    await fetchCustomers()
    setActionLoading(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
      case 'frozen': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Frozen</span>
      case 'banned': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Banned</span>
      default: return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{status}</span>
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" size={32} /></div>

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500 text-sm mt-1">Manage customer profiles and account status.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Customer List</h2>
          <span className="text-xs text-gray-400">{customers.length} customers</span>
        </div>
        {customers.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                  <th className="text-left px-6 py-3">Customer</th>
                  <th className="text-left px-6 py-3">Contact</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Orders</th>
                  <th className="text-left px-6 py-3">Total Spent</th>
                  <th className="text-left px-6 py-3">Last Order</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm text-gray-900">{c.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{c.phone || '-'}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(c.account_status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.total_orders}</td>
                    <td className="px-6 py-4 text-sm font-medium text-orange-600">MK {c.total_spent.toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {c.last_order_date ? new Date(c.last_order_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => viewProfile(c.id)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600" title="View Profile">
                          <Eye size={16} />
                        </button>
                        {c.account_status !== 'active' && (
                          <button onClick={() => restore(c.id)} disabled={actionLoading === c.id} className="p-2 rounded-lg hover:bg-green-50 text-green-600" title="Restore">
                            {actionLoading === c.id ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                          </button>
                        )}
                        {c.account_status === 'active' && (
                          <button onClick={() => updateStatus(c.id, 'frozen')} disabled={actionLoading === c.id} className="p-2 rounded-lg hover:bg-yellow-50 text-yellow-600" title="Freeze">
                            {actionLoading === c.id ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
                          </button>
                        )}
                        {c.account_status === 'frozen' && (
                          <button onClick={() => updateStatus(c.id, 'active')} disabled={actionLoading === c.id} className="p-2 rounded-lg hover:bg-green-50 text-green-600" title="Activate">
                            {actionLoading === c.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                          </button>
                        )}
                        <button onClick={() => softDelete(c.id)} disabled={actionLoading === c.id} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Soft Delete">
                          {actionLoading === c.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Profile Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Customer Profile</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            {loadingProfile ? (
              <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-orange-500" size={32} /></div>
            ) : selectedCustomer ? (
              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3"><User size={18} className="text-gray-400" /><div><p className="text-sm font-medium">{selectedCustomer.user.name}</p><p className="text-xs text-gray-500">Name</p></div></div>
                  <div className="flex items-center gap-3"><Mail size={18} className="text-gray-400" /><div><p className="text-sm">{selectedCustomer.user.email}</p><p className="text-xs text-gray-500">Email</p></div></div>
                  <div className="flex items-center gap-3"><Phone size={18} className="text-gray-400" /><div><p className="text-sm">{selectedCustomer.user.phone || '-'}</p><p className="text-xs text-gray-500">Phone</p></div></div>
                  <div className="flex items-center gap-3"><Calendar size={18} className="text-gray-400" /><div><p className="text-sm">{new Date(selectedCustomer.user.created_at).toLocaleDateString()}</p><p className="text-xs text-gray-500">Joined</p></div></div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-orange-50 p-3 rounded-xl text-center"><p className="text-2xl font-bold text-orange-600">{selectedCustomer.orders?.length || 0}</p><p className="text-xs text-gray-500">Orders</p></div>
                  <div className="bg-green-50 p-3 rounded-xl text-center"><p className="text-2xl font-bold text-green-600">MK {selectedCustomer.orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0).toLocaleString()}</p><p className="text-xs text-gray-500">Total Spent</p></div>
                  <div className="bg-blue-50 p-3 rounded-xl text-center"><p className="text-2xl font-bold text-blue-600">{selectedCustomer.topProducts?.length || 0}</p><p className="text-xs text-gray-500">Unique Products</p></div>
                </div>

                {selectedCustomer.topProducts?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><TrendingUp size={18} /> Most Purchased</h3>
                    <div className="space-y-2">
                      {selectedCustomer.topProducts.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center border-b pb-2">
                          <span className="text-sm">{p.product_name}</span>
                          <span className="text-sm font-medium">{p.total_quantity} x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCustomer.orders?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Package size={18} /> Order History</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedCustomer.orders.map((order) => (
                        <div key={order.id} className="border rounded-xl p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Order #{order.id.slice(-8)}</p>
                              <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <p>Total: MK {order.total_amount.toLocaleString()}</p>
                            <div className="mt-1 text-xs text-gray-500">
                              {order.items?.map((item, i) => (
                                <div key={i}>{item.product_name} x {item.quantity}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-10 text-center text-gray-500">Failed to load profile.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
    }
