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

  const orders = await sql`
    SELECT * FROM orders
  `

  const map = new Map()

  for (const o of orders) {
    const key = `${o.customer_name}-${o.phone_number}-${o.customer_email}`

    if (!map.has(key)) {
      map.set(key, {
        customer_name: o.customer_name,
        phone_number: o.phone_number,
        customer_email: o.customer_email,
        total_orders: 0,
        total_spent: 0,
        last_order: o.created_at,
      })
    }

    const c = map.get(key)
    c.total_orders += 1
    c.total_spent += Number(o.total_amount || o.total_price || 0)

    if (new Date(o.created_at) > new Date(c.last_order)) {
      c.last_order = o.created_at
    }
  }

  const customers = Array.from(map.values())

  return (
    <div className="pt-16 lg:pt-0">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111111]">Customers</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage and track all your customers.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-[#111111]">Customer List</h2>
          <span className="text-xs text-gray-400">
            {customers.length} customers
          </span>
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

                {customers.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">

                    {/* Customer */}
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm text-[#111111]">
                        {c.customer_name}
                      </p>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {c.phone_number}
                      </p>
                      <p className="text-xs text-gray-400">
                        {c.customer_email}
                      </p>
                    </td>

                    {/* Orders */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {c.total_orders}
                    </td>

                    {/* Total spent */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="font-medium text-[#F97316]">
                        MK {c.total_spent}
                      </span>
                    </td>

                    {/* Last order */}
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(c.last_order).toLocaleDateString()}
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
