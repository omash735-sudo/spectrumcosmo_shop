export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/db'

export default async function CustomersPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token || !verifyToken(token)) redirect('/admin/login')

  const sql = getDb()

  let customers: any[] = []

  try {
    customers = await sql`
      SELECT 
        customer_name,
        phone_number,
        email,
        COUNT(*) as total_orders,
        SUM(COALESCE(total_amount, total_price)) as total_spent,
        MAX(created_at) as last_order
      FROM orders
      GROUP BY customer_name, phone_number, email
      ORDER BY last_order DESC
    `
  } catch (err) {
    console.error(err)
  }

  return (
    <div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111111]">Customers</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage and track all your customers.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#111111]">Customer List</h2>
        </div>

        {customers.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No customers found.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                  <th className="text-left px-6 py-3">Customer</th>
                  <th className="text-left px-6 py-3">Contact</th>
                  <th className="text-left px-6 py-3">Orders</th>
                  <th className="text-left px-6 py-3">Total Spent</th>
                  <th className="text-left px-6 py-3">Last Order</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">

                {customers.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">

                    {/* Customer */}
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm text-[#111111]">
                        {c.customer_name}
                      </p>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{c.phone_number}</p>
                      <p className="text-xs text-gray-400">{c.email || '—'}</p>
                    </td>

                    {/* Orders */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {c.total_orders}
                    </td>

                    {/* Total spent */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      MK {c.total_spent || 0}
                    </td>

                    {/* Last order */}
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {c.last_order
                        ? new Date(c.last_order).toLocaleDateString()
                        : '—'}
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
