export const dynamic = 'force-dynamic'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/db'
import AdminProductsClient from '@/components/admin/AdminProductsClient'

export default async function AdminProductsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token || !verifyToken(token)) redirect('/admin/login')

  const sql = getDb()
  const products = await sql`SELECT * FROM products ORDER BY created_at DESC`
  return <AdminProductsClient initialProducts={JSON.parse(JSON.stringify(products))} />
}
