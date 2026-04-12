export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { revalidatePath } from 'next/cache'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  confirmed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
}

async function confirmPayment(orderId: string) {
  'use server'

  const sql = getDb()

  await sql`
    UPDATE orders
    SET status = 'confirmed'
    WHERE id = ${orderId}
  `

  await sql`
    UPDATE orders
    SET delivery_status = 'processing'
    WHERE id = ${orderId}
  `

  revalidatePath('/admin/payments')
  revalidatePath('/admin/delivery')
}

async function rejectPayment(orderId: string) {
  'use server'

  const sql = getDb()

  await sql`
    UPDATE orders
    SET status = 'failed'
    WHERE id = ${orderId}
  `

  revalidatePath('/admin/payments')
}

export default async function PaymentsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token || !verifyToken(token)) redirect('/admin/login')

  const sql = getDb()

  let orders: any[] = []

  try {
    orders = await sql`
      SELECT *
      FROM orders
      WHERE proof_of_payment IS NOT NULL
         OR payment_method IS NOT NULL
      ORDER BY created_at DESC
    `
  } catch (err) {
    console.error(err)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111111]">Payments</h1>
        <p className="text-gray-500 text-sm mt-1">
          Approve or reject payments. Confirmed payments trigger delivery.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#111111]">Payment Approvals</h2>
        </div>

        {orders.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No payment records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                  <th className="text-left px-6 py-3">Customer</th>
                  <th className="text-left px-6 py-3">Product</th>
                  <th className="text-left px-6 py-3">Amount</th>
                  <th className="text-left px-6 py-3">Method</th>
                  <th className="text-left px-6 py-3">Proof</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50">

                    <td className="px-6 py-4">
                      <p className="font-medium text-sm text-[#111111]">
                        {o.customer_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {o.phone_number}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {o.product_name}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      MK {o.total_amount || o.total_price}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {o.payment_method || '—'}
                    </td>

                    <td className="px-6 py-4">
                      {o.proof_of_payment ? (
                        <a
                          href={o.proof_of_payment}
                          target="_blank"
                          className="text-[#F97316] text-xs hover:underline"
                        >
                          View Proof
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">No proof</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 flex gap-2">
                      <form action={confirmPayment.bind(null, o.id)}>
                        <button className="px-3 py-1 text-xs rounded-lg bg-green-500 text-white hover:bg-green-600">
                          Confirm
                        </button>
                      </form>

                      <form action={rejectPayment.bind(null, o.id)}>
                        <button className="px-3 py-1 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600">
                          Reject
                        </button>
                      </form>
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
