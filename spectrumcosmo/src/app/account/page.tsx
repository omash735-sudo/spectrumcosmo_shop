'use client'

import Link from 'next/link'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'

export default function AccountDashboard() {
  const sections = [
    {
      title: 'Orders',
      desc: 'View and track all your orders',
      href: '/account/orders',
    },
    {
      title: 'Payments',
      desc: 'Manage payments and upload proof',
      href: '/account/payments',
    },
    {
      title: 'Addresses',
      desc: 'Manage delivery addresses',
      href: '/account/addresses',
    },
    {
      title: 'Settings',
      desc: 'Profile and account settings',
      href: '/account/settings',
    },
    {
      title: 'Tracking',
      desc: 'Track delivery status in real time',
      href: '/account/tracking',
    },
  ]

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-12">

          {/* HEADER */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-[#111111]">
              Account Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage your SpectrumCosmo account
            </p>
          </div>

          {/* GRID */}
          <div className="grid md:grid-cols-3 gap-6">

            {sections.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition"
              >
                <h2 className="text-lg font-semibold text-[#111111]">
                  {item.title}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {item.desc}
                </p>

                <div className="mt-4 text-sm text-orange-500">
                  Open →
                </div>
              </Link>
            ))}

          </div>

        </div>
      </main>

      <Footer />
    </>
  )
}
