export const dynamic = 'force-dynamic'
import { getUserFromCookies } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, ArrowLeft, Clock, CheckCircle, Loader } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Clock,
  },
  processing: {
    label: 'Processing',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Loader,
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
}

export default async function AccountOrdersPage() {
  const user = await getUserFromCookies()
  if (!user) redirect('/auth/login')

  let orders: any[] = []
  try {
    const sql = getDb()
    orders = await sql`
      SELECT * FROM orders
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `
  } catch (err) {
    console.error(err)
  }

  return (
    <main className="min-h-screen bg-[#f9f9f9] px-4 py-12">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/account"
            className="p-2 rounded-xl hover:bg-white border border-gray-200 transition-all">
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#111111]">My Orders</h1>
            <p className="text-gray-500 text-sm mt-0.5">Track all your orders in one place</p>
          </div>
        </div>

        {/* Empty state */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <Package size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="font-bold text-[#111111] mb-2">No orders yet</h3>
            <p className="text-gray-400 text-sm mb-6">
              When you place an order it will appear here.
            </p>
            <Link href="/products" className="btn-primary text-sm">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              const StatusIcon = statusCfg.icon
              return (
                <div key={order.id}
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-orange-200 transition-all">

                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                        <Package size={18} className="text-[#F97316]" />
                      </div>
                      <div>
                        <p className="font-bold text-[#111111]">{order.product_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Ordered {new Date(order.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${statusCfg.color}`}>
                      <StatusIcon size={12} />
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-b border-gray-50 mb-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Payment</p>
                      <p className="text-sm font-medium text-[#111111]">{order.payment_method || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Delivery</p>
                      <p className="text-sm font-medium text-[#111111]">{order.delivery_method || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Total</p>
                      <p className="text-sm font-bold text-[#F97316]">
                        {order.total_amount ? `MWK ${Number(order.total_amount).toLocaleString()}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                      <p className="text-sm font-medium text-[#111111]">{order.phone_number}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-2">
                    {['pending', 'processing', 'completed'].map((s, i) => {
                      const steps = ['pending', 'processing', 'completed']
                      const currentIndex = steps.indexOf(order.status)
                      const stepIndex = steps.indexOf(s)
                      const isActive = stepIndex <= currentIndex
                      const isCurrent = s === order.status
                      return (
                        <div key={s} className="flex items-center flex-1">
                          <div className={`flex items-center gap-1.5 text-xs font-medium transition-all ${
                            isActive ? 'text-[#F97316]' : 'text-gray-300'
                          }`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                              isActive ? 'bg-[#F97316]' : 'bg-gray-200'
                            } ${isCurrent ? 'ring-2 ring-orange-200' : ''}`}>
                              {stepIndex + 1}
                            </div>
                            <span className="hidden sm:block capitalize">{s}</span>
                          </div>
                          {i < 2 && (
                            <div className={`flex-1 h-0.5 mx-2 rounded ${
                              stepIndex < currentIndex ? 'bg-[#F97316]' : 'bg-gray-100'
                            }`} />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Custom details */}
                  {order.custom_details && (
                    <div className="mt-4 bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-xs text-gray-400 mb-1">Custom Instructions</p>
                      <p className="text-sm text-gray-600">{order.custom_details}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
