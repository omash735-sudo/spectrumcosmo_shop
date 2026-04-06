export const dynamic = 'force-dynamic'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/db'
import AdminOrdersClient from '@/components/admin/AdminOrdersClient'

export default async function AdminOrdersPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token || !verifyToken(token)) redirect('/admin/login')

  const sql = getDb()
  const orders = await sql`SELECT * FROM orders ORDER BY created_at DESC`
  return <AdminOrdersClient initialOrders={JSON.parse(JSON.stringify(orders))} />
}
