export const dynamic = 'force-dynamic'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { Package, ShoppingCart, Star, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token || !verifyToken(token)) redirect('/admin/login')

  let stats = { products: 0, orders: 0, reviews: 0, pendingReviews: 0 }
  let recentOrders: any[] = []
  try {
    const sql = getDb()
    const [p, o, r, pr, ro] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM products`,
      sql`SELECT COUNT(*) as count FROM orders`,
      sql`SELECT COUNT(*) as count FROM reviews WHERE approved=true`,
      sql`SELECT COUNT(*) as count FROM reviews WHERE approved=false`,
      sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 5`,
    ])
    stats = {
      products: parseInt(p[0].count),
      orders: parseInt(o[0].count),
      reviews: parseInt(r[0].count),
      pendingReviews: parseInt(pr[0].count),
    }
    recentOrders = ro
  } catch (err) {
    console.error(err)
  }

  const cards = [
    { label: 'Total Products', value: stats.products, icon: Package, href: '/admin/products', color: 'bg-orange-50 text-orange-600' },
    { label: 'Total Orders', value: stats.orders, icon: ShoppingCart, href: '/admin/orders', color: 'bg-blue-50 text-blue-600' },
    { label: 'Approved Reviews', value: stats.reviews, icon: Star, href: '/admin/reviews', color: 'bg-green-50 text-green-600' },
    { label: 'Pending Reviews', value: stats.pendingReviews, icon: TrendingUp, href: '/admin/reviews', color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111111]">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back. Here's your store overview.</p>
      </div>

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
            <p className="text-2xl font-bold text-[#111111]">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-[#111111]">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-[#F97316] hover:underline font-medium">
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
                      <p className="font-medium text-sm text-[#111111]">{o.customer_name}</p>
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

