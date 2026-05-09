export const dynamic = 'force-dynamic'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { Package, ShoppingCart, Star, TrendingUp, Users, DollarSign } from 'lucide-react'
import Link from 'next/link'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token || !verifyToken(token)) redirect('/admin/login')

  let stats = { products: 0, orders: 0, revenue: 0, customers: 0 }
  let recentOrders: any[] = []
  let monthlySales: any[] = []
  let topProducts: any[] = []

  try {
    const sql = getDb()
    const [
      productCount,
      orderCount,
      revenueSum,
      customerCount,
      ordersList,
      monthlyData,
      topProductsData
    ] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM products`,
      sql`SELECT COUNT(*) as count FROM orders`,
      sql`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders`,
      sql`SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL`,
      sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 5`,
      sql`
        SELECT
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as order_count,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month ASC
      `,
      sql`
        SELECT product_name, COUNT(*) as sold
        FROM orders
        WHERE status = 'approved'
        GROUP BY product_name
        ORDER BY sold DESC
        LIMIT 5
      `
    ])

    stats = {
      products: parseInt(productCount[0].count),
      orders: parseInt(orderCount[0].count),
      revenue: parseFloat(revenueSum[0].total),
      customers: parseInt(customerCount[0].count),
    }
    recentOrders = ordersList
    monthlySales = monthlyData.map((row: any) => ({
      month: new Date(row.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      orders: parseInt(row.order_count),
      revenue: parseFloat(row.revenue),
    }))
    topProducts = topProductsData
  } catch (err) {
    console.error(err)
  }

  const cards = [
    { label: 'Total Products', value: stats.products, icon: Package, href: '/admin/products', color: 'bg-orange-50 text-orange-600' },
    { label: 'Total Orders', value: stats.orders, icon: ShoppingCart, href: '/admin/orders', color: 'bg-blue-50 text-blue-600' },
    { label: 'Revenue', value: `MK ${stats.revenue.toLocaleString()}`, icon: DollarSign, href: '/admin/analytics', color: 'bg-green-50 text-green-600' },
    { label: 'Customers', value: stats.customers, icon: Users, href: '/admin/customers', color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back. Here's your store overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map(({ label, value, icon: Icon, href, color }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-3`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        {/* Monthly Sales Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4">Monthly Sales Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#F97316" name="Orders" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue (MK)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4">Top Selling Products</h2>
          <div className="space-y-3">
            {topProducts.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{p.product_name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${(p.sold / topProducts[0].sold) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{p.sold} sold</span>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-gray-400 text-center">No data yet.</p>}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-orange-500 hover:underline font-medium">
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                  <th className="text-left px-6 py-3">Customer</th>
                  <th className="text-left px-6 py-3">Product</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm text-gray-800">{o.customer_name}</p>
                      <p className="text-xs text-gray-400">{o.phone_number}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{o.product_name}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
  }
