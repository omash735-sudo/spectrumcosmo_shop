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
    SELECT 
      id,
      customer_name,
      phone_number,
      customer_email,
      payment_method,
      total_amount,
      status,
      created_at,
      onekhusa_transaction_id
    FROM orders
    WHERE payment_method IS NOT NULL
    ORDER BY created_at DESC
  `

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-50',
    approved: 'text-green-600 bg-green-50',
    declined: 'text-red-600 bg-red-50',
  }

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 text-sm mt-1">
          Payment records are automatically updated by the payment gateway. Manual approval is not required.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Payment Records</h2>
        </div>

        {payments.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No payment records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                  <th className="text-left px-6 py-3">Customer</th>
                  <th className="text-left px-6 py-3">Method</th>
                  <th className="text-left px-6 py-3">Amount</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Transaction ID</th>
                  <th className="text-left px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm text-gray-900">{p.customer_name}</p>
                      <p className="text-xs text-gray-400">{p.phone_number}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.payment_method}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      MK {Number(p.total_amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColors[p.status] || 'text-gray-600 bg-gray-100'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-500">
                      {p.onekhusa_transaction_id || '—'}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString()}
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
