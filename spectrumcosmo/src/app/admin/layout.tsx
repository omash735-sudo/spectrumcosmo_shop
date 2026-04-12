import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-4">

        <h2 className="text-xl font-bold mb-6">Spectrum Admin</h2>

        <nav className="space-y-1 text-sm">

          {/* Core */}
          <p className="text-xs text-gray-400 mt-2 mb-1">CORE</p>

          <Link href="/admin/dashboard" className="block p-2 rounded hover:bg-gray-100">
            Dashboard
          </Link>

          <Link href="/admin/orders" className="block p-2 rounded hover:bg-gray-100">
            Orders
          </Link>

          <Link href="/admin/products" className="block p-2 rounded hover:bg-gray-100">
            Products
          </Link>

          <Link href="/admin/reviews" className="block p-2 rounded hover:bg-gray-100">
            Reviews
          </Link>

          {/* Business Flow */}
          <p className="text-xs text-gray-400 mt-4 mb-1">OPERATIONS</p>

          <Link href="/admin/payments" className="block p-2 rounded hover:bg-gray-100">
            Payments
          </Link>

          <Link href="/admin/delivery" className="block p-2 rounded hover:bg-gray-100">
            Delivery
          </Link>

          <Link href="/admin/customers" className="block p-2 rounded hover:bg-gray-100">
            Customers
          </Link>

          {/* Growth / Insights */}
          <p className="text-xs text-gray-400 mt-4 mb-1">GROWTH</p>

          <Link href="/admin/analytics" className="block p-2 rounded hover:bg-gray-100">
            Analytics
          </Link>

          <Link href="/admin/newsletter" className="block p-2 rounded hover:bg-gray-100">
            Newsletter
          </Link>

          {/* System */}
          <p className="text-xs text-gray-400 mt-4 mb-1">SYSTEM</p>

          <Link href="/admin/settings" className="block p-2 rounded hover:bg-gray-100">
            Settings
          </Link>

        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>

    </div>
  )
}
