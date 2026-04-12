export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { revalidatePath } from 'next/cache'

const STATUS_COLORS: Record<string, string> = {
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
}

async function markShipped(orderId: string) {
  'use server'

  const sql = getDb()

  await sql`
    UPDATE orders
    SET delivery_status = 'shipped'
    WHERE id = ${orderId}
  `

  revalidatePath('/admin/delivery')
}

async function markDelivered(orderId: string) {
  'use server'

  const sql = getDb()

  await sql`
    UPDATE orders
    SET delivery_status = 'delivered'
    WHERE id = ${orderId}
  `

  revalidatePath('/admin/delivery')
}

export default async function DeliveryPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token || !verifyToken(token)) redirect('/admin/login')

  const sql = getDb()

  let orders: any[] = []

  try {
    orders = await sql`
      SELECT *
      FROM orders
      WHERE delivery_status IS NOT NULL
         OR status = 'confirmed'
      ORDER BY created_at DESC
    `
  } catch (err) {
    console.error(err)
  }

  return (
    <div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111111]">Delivery</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage order fulfillment and delivery status.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#111111]">Delivery Management</h2>
        </div>

        {orders.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No delivery orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                  <th className="text-left px-6 py-3">Customer</th>
                  <th className="text-left px-6 py-3">Product</th>
                  <th className="text-left px-6 py-3">Location</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Date</th>
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
                      {o.delivery_method || '—'}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLORS[o.delivery_status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {o.delivery_status || 'pending'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 flex gap-2">

                      <form action={markShipped.bind(null, o.id)}>
                        <button className="px-3 py-1 text-xs rounded-lg bg-blue-500 text-white hover:bg-blue-600">
                          Mark Shipped
                        </button>
                      </form>

                      <form action={markDelivered.bind(null, o.id)}>
                        <button className="px-3 py-1 text-xs rounded-lg bg-green-500 text-white hover:bg-green-600">
                          Mark Delivered
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
