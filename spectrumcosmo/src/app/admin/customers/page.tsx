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

  let orders: any[] = []

  try {
    orders = await sql`
      SELECT * FROM orders
      LIMIT 20
    `
  } catch (err) {
    console.error("DB ERROR:", err)
  }

  console.log("ORDERS RESULT:", orders)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">TEST - Orders Data</h1>

      {orders.length === 0 ? (
        <p>No orders found (or DB not connected)</p>
      ) : (
        <div className="space-y-2">
          {orders.map((o, i) => (
            <div key={i} className="p-3 border rounded">
              <p><b>Name:</b> {o.customer_name}</p>
              <p><b>Email:</b> {o.customer_email}</p>
              <p><b>Phone:</b> {o.phone_number}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
