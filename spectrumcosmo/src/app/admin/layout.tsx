'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Star,
  CreditCard,
  Truck,
  Users,
  TrendingUp,
  Mail,
  Settings,
  Menu,
  X,
  LogOut,
  Layout,
  FileText,
  Shield,
  Home,
  Wallet,
  Database,
  CheckCircle,
  Tag,
  Sliders,
  HelpCircle,
  MessageSquare,
  Smartphone,
  Heart,
  Blocks,
  ImageIcon,
  Activity,
  Eye,
  Ban,
  Zap,
  Bell,
  Key,
  Verified,
  Lock,
  AlertTriangle,
  Percent,
  Gift,
  MapPin,
  Send,
  Clock,
  RefreshCw,
  CalendarDays, // Added for Events
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, section: 'CORE' },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag, section: 'CORE' },
  { name: 'Products', href: '/admin/products', icon: Package, section: 'CORE' },
  { name: 'Inventory', href: '/admin/inventory', icon: Package, section: 'CORE' },
  { name: 'Reviews', href: '/admin/reviews', icon: Star, section: 'CORE' },
  { name: 'Product Requests', href: '/admin/requests', icon: Heart, section: 'CORE' },
  { name: 'Promo Codes', href: '/admin/promo-codes', icon: Percent, section: 'CORE' },
  { name: 'Referrals', href: '/admin/referrals', icon: Gift, section: 'CORE' },
  { name: 'Content Blocks', href: '/admin/content-blocks', icon: Blocks, section: 'CORE' },
  { name: 'Hero Slides', href: '/admin/hero-slides', icon: Layout, section: 'CORE' },
  { name: 'Inspiration Gallery', href: '/admin/inspiration', icon: ImageIcon, section: 'CORE' },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell, section: 'CORE' },
  
  // EVENTS SECTION - NEW
  { name: 'Events', href: '/admin/events', icon: CalendarDays, section: 'CORE' },
  
  // DELIVERY SECTION
  { name: 'Delivery Areas', href: '/admin/delivery-areas', icon: MapPin, section: 'DELIVERY' },
  { name: 'Delivery Quotes', href: '/admin/delivery-quotes', icon: Send, section: 'DELIVERY' },
  { name: 'Delivery Methods', href: '/admin/delivery', icon: Truck, section: 'DELIVERY' },
  
  // SECURITY SECTION
  { name: 'Security Dashboard', href: '/admin/security/dashboard', icon: Activity, section: 'SECURITY' },
  { name: 'Security Center', href: '/admin/security', icon: Shield, section: 'SECURITY' },
  { name: 'Threat Logs', href: '/admin/security/logs', icon: Eye, section: 'SECURITY' },
  { name: 'Blocked IPs', href: '/admin/security/blocked-ips', icon: Ban, section: 'SECURITY' },
  { name: 'Protection Rules', href: '/admin/security/rules', icon: Sliders, section: 'SECURITY' },
  { name: '2FA Settings', href: '/admin/security/2fa', icon: Key, section: 'SECURITY' },
  
  { name: 'Payments', href: '/admin/payments', icon: CreditCard, section: 'OPERATIONS' },
  { name: 'Payment Verifications', href: '/admin/payment-verifications', icon: CheckCircle, section: 'OPERATIONS' },
  { name: 'Payment Settings', href: '/admin/payment-settings', icon: Wallet, section: 'OPERATIONS' },
  { name: 'Payment Providers', href: '/admin/payment-providers', icon: Database, section: 'OPERATIONS' },
  { name: 'Order Statuses', href: '/admin/order-statuses', icon: Tag, section: 'OPERATIONS' },
  { name: 'Customers', href: '/admin/customers', icon: Users, section: 'OPERATIONS' },
  
  { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp, section: 'GROWTH' },
  { name: 'Newsletter', href: '/admin/newsletter', icon: Mail, section: 'GROWTH' },
  { name: 'Email Templates', href: '/admin/email-templates', icon: Mail, section: 'GROWTH' },
  { name: 'Customer Messages', href: '/admin/customer-messages', icon: MessageSquare, section: 'GROWTH' },
  { name: 'SMS Templates', href: '/admin/sms-templates', icon: Smartphone, section: 'GROWTH' },
  { name: 'FAQ', href: '/admin/faqs', icon: HelpCircle, section: 'GROWTH' },
  
  { name: 'Settings', href: '/admin/settings', icon: Settings, section: 'SYSTEM' },
  { name: 'Alert Settings', href: '/admin/alert-settings', icon: Bell, section: 'SYSTEM' },
  { name: 'Hero', href: '/admin/hero', icon: Layout, section: 'SYSTEM' },
  { name: 'Homepage', href: '/admin/homepage', icon: Home, section: 'SYSTEM' },
  { name: 'About Page', href: '/admin/about', icon: FileText, section: 'SYSTEM' },
  { name: 'Contact Page', href: '/admin/contact', icon: FileText, section: 'SYSTEM' },
  { name: 'Terms', href: '/admin/terms', icon: FileText, section: 'SYSTEM' },
  { name: 'Privacy', href: '/admin/privacy', icon: Shield, section: 'SYSTEM' },
];

function SecurityAlertBadge() {
  const [alertCount, setAlertCount] = useState(0);
  
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/admin/security/alerts/count');
        if (res.ok) {
          const data = await res.json();
          setAlertCount(data.count || 0);
        }
      } catch (err) {
        console.warn('Could not fetch alert count');
      }
    };
    
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);
  
  if (alertCount === 0) return null;
  
  return (
    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
      {alertCount > 99 ? '99+' : alertCount}
    </span>
  );
}

function StockAlertBadge() {
  const [alertCount, setAlertCount] = useState(0);
  
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/admin/inventory/alerts');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.summary) {
            setAlertCount(data.summary.total_alerts || 0);
          }
        }
      } catch (err) {
        console.warn('Could not fetch stock alerts');
      }
    };
    
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);
  
  if (alertCount === 0) return null;
  
  return (
    <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
      {alertCount > 99 ? '99+' : alertCount}
    </span>
  );
}

function DeliveryQuoteBadge() {
  const [quoteCount, setQuoteCount] = useState(0);
  
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const res = await fetch('/api/admin/quote-requests?status=pending');
        if (res.ok) {
          const data = await res.json();
          setQuoteCount(data.length || 0);
        }
      } catch (err) {
        console.warn('Could not fetch quote count');
      }
    };
    
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 30000);
    return () => clearInterval(interval);
  }, []);
  
  if (quoteCount === 0) return null;
  
  return (
    <span className="ml-auto bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
      {quoteCount > 99 ? '99+' : quoteCount}
    </span>
  );
}

function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/admin/notifications/unread/count');
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch (err) {
        console.warn('Could not fetch notification count');
      }
    };
    
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);
  
  if (unreadCount === 0) return null;
  
  return (
    <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    setMobileMenuOpen(false);
    
    const fetchAdminInfo = async () => {
      if (isLoginPage) {
        setIsLoading(false);
        return;
      }
      
      try {
        const res = await fetch('/api/admin/me');
        if (res.ok) {
          const data = await res.json();
          setTwoFactorEnabled(data.twoFactorEnabled || false);
          setAdminName(data.name || 'Admin');
        } else if (res.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
      } catch (err) {
        console.warn('Could not fetch admin info:', err);
        setAdminName('Admin');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAdminInfo();
  }, [isLoginPage]);

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 dark:text-gray-500">Loading...</div>
      </div>
    );
  }

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 mb-6 sm:mb-8 px-2">
        <div className="relative w-8 h-8 sm:w-10 sm:h-10">
          <img
            src="https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png"
            alt="SpectrumCosmo"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 className="font-bold text-gray-800 dark:text-white text-base sm:text-lg">SpectrumCosmo</h1>
          <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">Admin Panel</p>
        </div>
      </div>

      <div className="mb-5 sm:mb-6 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Users size={12} className="text-orange-500 sm:w-3.5 sm:h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{adminName || 'Admin User'}</p>
            <div className="flex items-center gap-1">
              <Lock size={8} className={twoFactorEnabled ? 'text-green-500' : 'text-gray-400'} />
              <span className={`text-[9px] sm:text-xs ${twoFactorEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                2FA {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1">
        {['CORE', 'DELIVERY', 'SECURITY', 'OPERATIONS', 'GROWTH', 'SYSTEM'].map((section) => {
          const sectionItems = navItems.filter((item) => item.section === section);
          if (sectionItems.length === 0) return null;
          
          return (
            <div key={section}>
              <p className="text-[9px] sm:text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-3 sm:mt-4 mb-1.5 sm:mb-2 px-2">
                {section}
              </p>
              {sectionItems.map((item) => {
                const Icon = item.icon;
                const showStockAlert = item.name === 'Inventory';
                const showSecurityAlert = item.name === 'Security Center';
                const showQuoteAlert = item.name === 'Delivery Quotes';
                const showNotificationAlert = item.name === 'Notifications';
                const isEvents = item.name === 'Events';
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 mb-0.5 sm:mb-1 ${
                      isActive(item.href)
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-100 dark:shadow-orange-900/30'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon size={14} className={`sm:w-[18px] sm:h-[18px] ${isEvents ? 'text-orange-500' : ''}`} />
                    {item.name}
                    {showStockAlert && <StockAlertBadge />}
                    {showSecurityAlert && <SecurityAlertBadge />}
                    {showQuoteAlert && <DeliveryQuoteBadge />}
                    {showNotificationAlert && <NotificationBadge />}
                    {isActive(item.href) && (
                      <span className="ml-auto w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/70"></span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={async () => {
            await fetch('/api/admin/logout', { method: 'POST' });
            window.location.href = '/admin/login';
          }}
          className="flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition w-full"
        >
          <LogOut size={14} className="sm:w-[18px] sm:h-[18px]" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 z-50 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <img
            src="https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png"
            alt="Logo"
            className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
          />
          <span className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">Admin</span>
          {!twoFactorEnabled && (
            <span className="text-[8px] sm:text-[10px] bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 px-1 sm:px-1.5 py-0.5 rounded-full ml-0.5 sm:ml-1">
              No 2FA
            </span>
          )}
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <Menu size={18} className="text-gray-600 dark:text-gray-300 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-[260px] sm:w-[280px] max-w-[85%] bg-white dark:bg-gray-800 shadow-2xl flex flex-col">
            <div className="flex justify-end p-2.5 sm:p-3">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X size={16} className="text-gray-600 dark:text-gray-300 sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-5 sm:pb-6">
              <NavContent />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      <div className="hidden md:flex">
        <aside className="w-64 lg:w-72 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 min-h-screen sticky top-0 flex flex-col p-4 lg:p-5 shadow-sm">
          <NavContent />
        </aside>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Main Content */}
      <div className="md:hidden pt-14 sm:pt-16">
        <main className="p-3 sm:p-4">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
