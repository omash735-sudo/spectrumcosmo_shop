import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  const admin = token ? verifyToken(token) : null

  // If not logged in and not on login page, redirect to login
  if (!admin) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar username={admin.username} />
      <main className="flex-1 min-w-0 p-6 lg:p-8 lg:ml-64">
        {children}
      </main>
    </div>
  )
}
