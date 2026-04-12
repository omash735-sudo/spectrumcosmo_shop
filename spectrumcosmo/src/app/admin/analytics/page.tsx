export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/db'

export default async function AnalyticsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token || !verifyToken(token)) redirect('/admin/login')

  const sql = getDb()

  let stats = {
    totalOrders: 0,
    totalRevenue: 0,
    confirmedOrders: 0,
    pendingOrders: 0,
    failedOrders: 0,
  }

  let topProducts: any[] = []

  try {
    const [orders, revenue, confirmed, pending, failed, products] =
      await Promise.all([
        sql`SELECT COUNT(*) as count FROM orders`,
        sql`
          SELECT SUM(COALESCE(total_amount, total_price)) as total
          FROM orders
          WHERE status = 'confirmed'
        `,
        sql`SELECT COUNT(*) as count FROM orders WHERE status = 'confirmed'`,
        sql`SELECT COUNT(*) as count FROM orders WHERE status = 'pending'`,
        sql`SELECT COUNT(*) as count FROM orders WHERE status = 'failed'`,

        sql`
          SELECT product_name, COUNT(*) as total_sold
          FROM orders
          WHERE status = 'confirmed'
          GROUP BY product_name
          ORDER BY total_sold DESC
          LIMIT 5
        `,
      ])

    stats = {
      totalOrders: parseInt(orders[0].count),
      totalRevenue: parseFloat(revenue[0].total || 0),
      confirmedOrders: parseInt(confirmed[0].count),
      pendingOrders: parseInt(pending[0].count),
      failedOrders: parseInt(failed[0].count),
    }

    topProducts = products
  } catch (err) {
    console.error(err)
  }

  const cards = [
    {
      label: 'Total Orders',
      value: stats.totalOrders,
    },
    {
      label: 'Revenue',
      value: `MK ${stats.totalRevenue}`,
    },
    {
      label: 'Confirmed Orders',
      value: stats.confirmedOrders,
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders,
    },
    {
      label: 'Failed Orders',
      value: stats.failedOrders,
    },
  ]

  return (
    <div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111111]">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">
          Overview of your business performance.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">

        {cards.map((c, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 border border-gray-100"
          >
            <p className="text-2xl font-bold text-[#111111]">
              {c.value}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {c.label}
            </p>
          </div>
        ))}

      </div>

      {/* Top Products */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#111111]">Top Products</h2>
        </div>

        {topProducts.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No product data available.
          </div>
        ) : (
          <table className="w-full">

            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                <th className="text-left px-6 py-3">Product</th>
                <th className="text-left px-6 py-3">Sold</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">

              {topProducts.map((p: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">

                  <td className="px-6 py-4 text-sm text-[#111111]">
                    {p.product_name}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {p.total_sold}
                  </td>

                </tr>
              ))}

            </tbody>

          </table>
        )}

      </div>
    </div>
  )
}
