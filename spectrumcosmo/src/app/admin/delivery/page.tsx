export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/db'

export default async function DeliveryPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token || !verifyToken(token)) redirect('/admin/login')

  const sql = getDb()

  const deliveries = await sql`
    SELECT *
    FROM orders
    ORDER BY created_at DESC
  `

  return (
    <div className="pt-16 lg:pt-0">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111111]">Delivery</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage order delivery status.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#111111]">Delivery Queue</h2>
        </div>

        {deliveries.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No delivery records found.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>
                <tr className="text-xs text-gray-400 uppercase bg-gray-50">
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Payment</th>
                  <th className="px-6 py-3 text-left">Date</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">

                {deliveries.map((d: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">

                    <td className="px-6 py-4">
                      <p className="font-medium text-sm">{d.customer_name}</p>
                      <p className="text-xs text-gray-400">{d.phone_number}</p>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {d.product_name}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <span className="text-orange-500 font-medium">
                        {d.delivery_status || 'pending'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {d.payment_method}
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(d.created_at).toLocaleDateString()}
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
