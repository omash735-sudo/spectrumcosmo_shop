export const dynamic = 'force-dynamic'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { MonthlySalesChart } from '@/components/admin/Charts'

export default async function AnalyticsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token || !verifyToken(token)) redirect('/admin/login')

  // Fetch data from the realtime endpoint
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/analytics/realtime`, {
    cache: 'no-store',
    headers: { Cookie: cookieStore.toString() }
  })
  const data = await res.json()

  const stats = data.stats || {
    totalOrders: 0,
    totalRevenue: 0,
    confirmedOrders: 0,
    pendingOrders: 0,
    declinedOrders: 0,
  }
  const monthlyData = data.monthlyData || []
  const topProducts = data.topProducts || []
  const customerStats = data.customerStats || { repeatCustomers: 0, newCustomers: 0 }

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your business performance.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        <div className="bg-white rounded-2xl p-5 border">
          <p className="text-2xl font-bold">{stats.totalOrders}</p>
          <p className="text-xs text-gray-500">Total Orders</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border">
          <p className="text-2xl font-bold">MK {stats.totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Revenue</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border">
          <p className="text-2xl font-bold">{stats.confirmedOrders}</p>
          <p className="text-xs text-gray-500">Confirmed</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border">
          <p className="text-2xl font-bold">{stats.pendingOrders}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border">
          <p className="text-2xl font-bold">{stats.declinedOrders}</p>
          <p className="text-xs text-gray-500">Declined</p>
        </div>
      </div>

      {/* Customer Retention */}
      <div className="bg-white rounded-2xl border p-5 mb-8">
        <h2 className="font-bold mb-4">Customer Retention</h2>
        <div className="flex gap-8">
          <div>
            <p className="text-3xl font-bold text-orange-600">{customerStats.repeatCustomers}</p>
            <p className="text-xs text-gray-500">Repeat Customers</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-600">{customerStats.newCustomers}</p>
            <p className="text-xs text-gray-500">New Customers</p>
          </div>
        </div>
      </div>

      {/* Monthly Sales Chart */}
      <div className="bg-white rounded-2xl border p-5 mb-8">
        <h2 className="font-bold mb-4">Monthly Sales Trend</h2>
        <MonthlySalesChart data={monthlyData} />
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="px-6 py-4 border-b"><h2 className="font-bold">Top Selling Products</h2></div>
        {topProducts.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No data</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-400 uppercase">
              <tr><th className="text-left px-6 py-3">Product</th><th className="text-left px-6 py-3">Sold</th></tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={i} className="border-t">
                  <td className="px-6 py-4">{p.product_name}</td>
                  <td className="px-6 py-4">{p.sold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
