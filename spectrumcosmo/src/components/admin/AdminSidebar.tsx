'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingCart, Star, LogOut, ShoppingBag, Menu, X, Settings } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminSidebar({ username }: { username: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center"><ShoppingBag size={16} className="text-white" /></div>
          <div>
            <p className="font-bold text-sm text-[#111111]" style={{fontFamily:'var(--font-display)'}}>SpectrumCosmo</p>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={() => setMobileOpen(false)}
            className={clsx('flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
              pathname===href ? 'bg-[#F97316] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-[#111111]')}>
            <Icon size={18} />{label}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-4 py-2 mb-2">
          <p className="text-xs text-gray-400">Signed in as</p>
          <p className="text-sm font-medium text-[#111111]">{username}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all">
          <LogOut size={18} />Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 z-30"><SidebarContent /></aside>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#F97316] rounded-lg flex items-center justify-center"><ShoppingBag size={14} className="text-white" /></div>
          <span className="font-bold text-sm">SpectrumCosmo Admin</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-100"><Menu size={20} /></button>
      </div>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-white h-full">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
