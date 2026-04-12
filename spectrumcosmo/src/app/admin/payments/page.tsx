export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/db'

export default async function PaymentsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token || !verifyToken(token)) redirect('/admin/login')

  const sql = getDb()

  const payments = await sql`
    SELECT *
    FROM orders
    WHERE payment_method IS NOT NULL
  `

  return (
    <div className="pt-16 lg:pt-0">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111111]">Payments</h1>
        <p className="text-gray-500 text-sm mt-1">
          Approve or reject customer payments.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#111111]">Payment Records</h2>
        </div>

        {payments.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No payment records found.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>
                <tr className="text-xs text-gray-400 uppercase bg-gray-50">
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left">Method</th>
                  <th className="px-6 py-3 text-left">Amount</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">

                {payments.map((p: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">

                    <td className="px-6 py-4">
                      <p className="font-medium text-sm">{p.customer_name}</p>
                      <p className="text-xs text-gray-400">{p.phone_number}</p>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {p.payment_method}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      MK {p.total_amount || p.total_price}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <span className="text-yellow-600">
                        {p.status || 'pending'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">

                        <button className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs">
                          Approve
                        </button>

                        <button className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs">
                          Reject
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
    </div>
  )
}
