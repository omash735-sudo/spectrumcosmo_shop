'use client'

import Link from 'next/link'
import Image from 'next/image'
import { 
  Instagram, 
  Twitter, 
  Mail, 
  Facebook, 
  MessageCircle, 
  Music2, 
  Send, 
  Loader2, 
  ArrowUp,
  Sparkles,
  Heart,
  Shield,
  Truck,
  CreditCard,
  Apple,
  Smartphone
} from 'lucide-react'
import { useEffect, useState } from 'react'

type SocialLinks = {
  instagram: string
  twitter: string
  facebook: string
  tiktok: string
  whatsapp: string
  email: string
}

export default function Footer() {
  const [links, setLinks] = useState<SocialLinks>({
    instagram: '',
    twitter: '',
    facebook: '',
    tiktok: '',
    whatsapp: '',
    email: 'spectrumcosmo01@gmail.com',
  })
  const [emailSub, setEmailSub] = useState('')
  const [subStatus, setSubStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [checking, setChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)

  const logoSrc = "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png"

  // Back to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Fetch social links
  useEffect(() => {
    fetch('/api/admin/social-links')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        setLinks((prev) => ({ ...prev, ...data }))
      })
      .catch(() => null)
  }, [])

  const checkSubscriptionStatus = async (email: string) => {
    if (!email || !email.includes('@')) return
    setChecking(true)
    try {
      const res = await fetch(`/api/subscribe?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      if (data.subscribed) {
        setSubStatus({ type: 'error', msg: 'This email is already subscribed!' })
      } else {
        if (subStatus?.type === 'error' && subStatus.msg.includes('already subscribed')) {
          setSubStatus(null)
        }
      }
    } catch (err) {
      // Silent fail
    } finally {
      setChecking(false)
    }
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailSub.trim()) {
      setSubStatus({ type: 'error', msg: 'Please enter an email address' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailSub)) {
      setSubStatus({ type: 'error', msg: 'Invalid email format' })
      return
    }

    setSubmitting(true)
    setSubStatus(null)

    try {
      const checkRes = await fetch(`/api/subscribe?email=${encodeURIComponent(emailSub)}`)
      const checkData = await checkRes.json()
      if (checkData.subscribed) {
        setSubStatus({ type: 'error', msg: 'This email is already subscribed!' })
        setSubmitting(false)
        return
      }

      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailSub }),
      })

      if (res.ok) {
        setSubStatus({ type: 'success', msg: '🎉 Subscribed! Check your inbox.' })
        setEmailSub('')
      } else {
        const err = await res.json()
        setSubStatus({ type: 'error', msg: err.error || 'Subscription failed' })
      }
    } catch {
      setSubStatus({ type: 'error', msg: 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const quickLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/reviews', label: 'Customer Reviews' },
    { href: '/account', label: 'My Account' },
    { href: '/contact', label: 'Contact Us' },
    { href: '/faq', label: 'FAQ' },
  ]

  const socialLinks = [
    { key: 'instagram', icon: Instagram, color: 'hover:bg-gradient-to-br from-pink-500 to-orange-500' },
    { key: 'twitter', icon: Twitter, color: 'hover:bg-blue-400' },
    { key: 'facebook', icon: Facebook, color: 'hover:bg-blue-600' },
    { key: 'tiktok', icon: Music2, color: 'hover:bg-black' },
    { key: 'whatsapp', icon: MessageCircle, color: 'hover:bg-green-500' },
  ]

  const paymentIcons = [
    { icon: CreditCard, name: 'Credit Card' },
    { icon: Smartphone, name: 'Mobile Money' },
    { icon: Apple, name: 'Apple Pay' },
  ]

  return (
    <>
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white mt-20">
        {/* Newsletter Banner */}
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-orange-500/20 px-3 py-1 rounded-full mb-3">
                  <Sparkles size={14} className="text-orange-400" />
                  <span className="text-xs font-medium text-orange-400">Stay Updated</span>
                </div>
                <h3 className="text-xl font-bold text-white">Get 10% off your first order</h3>
                <p className="text-gray-400 text-sm mt-1">Subscribe to get exclusive offers and anime news</p>
              </div>
              <form onSubmit={handleSubscribe} className="w-full md:w-auto min-w-[300px]">
                <div className="flex">
                  <input
                    type="email"
                    value={emailSub}
                    onChange={(e) => setEmailSub(e.target.value)}
                    onBlur={() => checkSubscriptionStatus(emailSub)}
                    placeholder="Your email address"
                    className="flex-1 px-4 py-3 rounded-l-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-400"
                    required
                    disabled={submitting}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 rounded-r-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
                {(checking || submitting) && !subStatus && (
                  <p className="text-xs text-gray-400 mt-2">Checking...</p>
                )}
                {subStatus && (
                  <p className={`text-xs mt-2 ${subStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {subStatus.msg}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Brand Column */}
            <div className="md:col-span-4">
              <div className="mb-4">
                <Image
                  src={logoSrc}
                  alt="SpectrumCosmo"
                  width={140}
                  height={48}
                  className="object-contain brightness-0 invert"
                  priority
                />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Wear your excitement with pride. Custom apparel and anime merchandise crafted for those who live boldly.
              </p>
              <div className="flex gap-2">
                {socialLinks.map((social) => {
                  const url = links[social.key as keyof SocialLinks]
                  if (!url) return null
                  const Icon = social.icon
                  return (
                    <a
                      key={social.key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-9 h-9 bg-white/10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${social.color}`}
                    >
                      <Icon size={16} />
                    </a>
                  )
                })}
                <a
                  href={`mailto:${links.email}`}
                  className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-orange-500"
                >
                  <Mail size={16} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm tracking-wider uppercase text-gray-400 mb-5">Quick Links</h3>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-orange-400 transition-colors duration-200 flex items-center gap-1 group"
                    >
                      <span className="w-0 group-hover:w-2 h-0.5 bg-orange-500 transition-all duration-200"></span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div className="md:col-span-3">
              <h3 className="font-semibold text-sm tracking-wider uppercase text-gray-400 mb-5">Support</h3>
              <ul className="space-y-3">
                <li>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Heart size={14} className="text-orange-500" />
                    <span>100% Authentic Products</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Truck size={14} className="text-orange-500" />
                    <span>Free Shipping Over 50,000 MWK</span>
                  </div>
                </li>
                <li>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Shield size={14} className="text-orange-500" />
                    <span>Secure Payments</span>
                  </div>
                </li>
                <li className="pt-2">
                  <a
                    href={`mailto:${links.email}`}
                    className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition"
                  >
                    <Mail size={14} />
                    {links.email}
                  </a>
                </li>
              </ul>
            </div>

            {/* Payment Methods */}
            <div className="md:col-span-3">
              <h3 className="font-semibold text-sm tracking-wider uppercase text-gray-400 mb-5">We Accept</h3>
              <div className="flex flex-wrap gap-3">
                {paymentIcons.map((payment, idx) => {
                  const Icon = payment.icon
                  return (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
                      <Icon size={18} className="text-gray-300" />
                      <span className="text-xs text-gray-400">{payment.name}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Sparkles size={14} className="text-orange-500" />
                  <span>Anime Merchandise Since 2024</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} SpectrumCosmo. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-gray-500">
              <Link href="/terms" className="hover:text-orange-400 transition">Terms</Link>
              <Link href="/privacy" className="hover:text-orange-400 transition">Privacy</Link>
              <Link href="/shipping" className="hover:text-orange-400 transition">Shipping</Link>
              <Link href="/returns" className="hover:text-orange-400 transition">Returns</Link>
            </div>
            <p className="text-xs text-gray-500 italic">
              "Wear your excitement with pride"
            </p>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-orange-500 text-white p-3 rounded-full shadow-lg hover:bg-orange-600 transition-all duration-300 hover:scale-110 group"
          aria-label="Back to top"
        >
          <ArrowUp size={20} className="group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}
    </>
  )
}
