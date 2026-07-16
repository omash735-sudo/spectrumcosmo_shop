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
  Smartphone,
  Handshake,  // Cash payment icon
  AlertCircle
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

type SocialLinks = {
  instagram: string
  twitter: string
  facebook: string
  tiktok: string
  whatsapp: string
  email: string
}

export default function Footer() {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
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

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'light'
  
  const logoSrc = currentTheme === 'dark'
    ? "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png"
    : "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png"

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
        setSubStatus({ type: 'success', msg: 'Subscribed! Check your inbox.' })
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
    { href: '/reviews', label: 'Reviews' },
    { href: '/account', label: 'Account' },
    { href: '/contact', label: 'Contact' },
    { href: '/faq', label: 'FAQ' },
  ]

  const socialLinks = [
    { key: 'instagram', icon: Instagram, color: 'hover:bg-gradient-to-br from-pink-500 to-orange-500' },
    { key: 'twitter', icon: Twitter, color: 'hover:bg-blue-400' },
    { key: 'facebook', icon: Facebook, color: 'hover:bg-blue-600' },
    { key: 'tiktok', icon: Music2, color: 'hover:bg-black' },
    { key: 'whatsapp', icon: MessageCircle, color: 'hover:bg-green-500' },
  ]

  // Updated payment icons - Cash instead of Apple Pay
  const paymentIcons = [
    { icon: CreditCard, name: 'Card' },
    { icon: Smartphone, name: 'Mobile Money' },
    { icon: Handshake, name: 'Cash' },  // Handshake icon for cash payments
  ]

  const trustFeatures = [
    { icon: Heart, text: 'Authentic Products' },
    { icon: Truck, text: 'Fast Delivery' },
    { icon: Shield, text: 'Secure Payments' },
  ]

  return (
    <>
      <footer className="bg-[var(--background-secondary)] dark:bg-[var(--background-secondary)] text-[var(--foreground)] mt-20 border-t border-[var(--border)]">
        {/* Newsletter Section */}
        <div className="border-b border-[var(--border)]">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-[var(--primary)]/20 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full mb-2 sm:mb-3">
                  <Sparkles size={12} className="sm:w-3.5 sm:h-3.5 text-[var(--primary)]" />
                  <span className="text-[10px] sm:text-xs font-medium text-[var(--primary)]">Get 10% off</span>
                </div>
                <h3 className="text-base sm:text-xl font-bold text-[var(--foreground)]">Subscribe for exclusive offers</h3>
                <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5 sm:mt-1">Anime news, drops & 10% off your first order</p>
              </div>
              
              <form onSubmit={handleSubscribe} className="w-full sm:w-80 md:w-72 lg:w-80">
                <div className="flex">
                  <input
                    type="email"
                    value={emailSub}
                    onChange={(e) => setEmailSub(e.target.value)}
                    onBlur={() => checkSubscriptionStatus(emailSub)}
                    placeholder="Your email address"
                    className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-l-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder-[var(--foreground-muted)] min-h-[44px]"
                    required
                    disabled={submitting}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 sm:px-5 rounded-r-xl transition disabled:opacity-50 text-white min-h-[44px] flex items-center justify-center"
                  >
                    {submitting ? <Loader2 size={16} className="sm:w-[18px] sm:h-[18px] animate-spin" /> : <Send size={16} className="sm:w-[18px] sm:h-[18px]" />}
                  </button>
                </div>
                {(checking || submitting) && !subStatus && (
                  <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] mt-1.5">Checking...</p>
                )}
                {subStatus && (
                  <p className={`text-[10px] sm:text-xs mt-1.5 ${subStatus.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {subStatus.msg}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Main Footer */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8">
            
            {/* Brand - 4 columns */}
            <div className="lg:col-span-4 space-y-3 sm:space-y-4">
              <Image
                src={logoSrc}
                alt="SpectrumCosmo"
                width={140}
                height={48}
                className="object-contain"
                priority
              />
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
                Wear your excitement with pride. Premium custom apparel and anime merchandise for those who live boldly.
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1 sm:pt-2">
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
                      className={`w-8 h-8 sm:w-9 sm:h-9 bg-[var(--background)] rounded-full flex items-center justify-center transition-all hover:scale-110 text-[var(--foreground-muted)] hover:text-white ${social.color}`}
                      aria-label={social.key}
                    >
                      <Icon size={14} className="sm:w-4 sm:h-4" />
                    </a>
                  )
                })}
                <a
                  href={`mailto:${links.email}`}
                  className="w-8 h-8 sm:w-9 sm:h-9 bg-[var(--background)] rounded-full flex items-center justify-center transition-all hover:scale-110 text-[var(--foreground-muted)] hover:text-white hover:bg-[var(--primary)]"
                  aria-label="Email"
                >
                  <Mail size={14} className="sm:w-4 sm:h-4" />
                </a>
              </div>
            </div>

            {/* Quick Links - 2 columns */}
            <div className="lg:col-span-2">
              <h3 className="font-semibold text-xs sm:text-sm uppercase text-[var(--foreground-muted)] mb-3 sm:mb-4">Shop</h3>
              <ul className="space-y-1.5 sm:space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-xs sm:text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] transition">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support - 3 columns */}
            <div className="lg:col-span-3">
              <h3 className="font-semibold text-xs sm:text-sm uppercase text-[var(--foreground-muted)] mb-3 sm:mb-4">Support</h3>
              <ul className="space-y-1.5 sm:space-y-2">
                <li>
                  <Link href="/shipping" className="text-xs sm:text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] transition">
                    Shipping Info
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="text-xs sm:text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] transition">
                    Returns & Exchanges
                  </Link>
                </li>
                <li>
                  <Link href="/size-guide" className="text-xs sm:text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] transition">
                    Size Guide
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-xs sm:text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] transition">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-xs sm:text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] transition">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Trust & Payment - 3 columns */}
            <div className="lg:col-span-3">
              <h3 className="font-semibold text-xs sm:text-sm uppercase text-[var(--foreground-muted)] mb-3 sm:mb-4">Why Shop With Us</h3>
              <ul className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                {trustFeatures.map((feature, idx) => {
                  const Icon = feature.icon
                  return (
                    <li key={idx} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[var(--foreground-muted)]">
                      <Icon size={12} className="sm:w-3.5 sm:h-3.5 text-[var(--primary)]" />
                      {feature.text}
                    </li>
                  )
                })}
              </ul>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1 sm:pt-2">
                {paymentIcons.map((payment, idx) => {
                  const Icon = payment.icon
                  return (
                    <div key={idx} className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                      <Icon size={12} className="sm:w-3.5 sm:h-3.5 text-[var(--foreground-muted)]" />
                      <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">{payment.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-[var(--border)] mt-6 sm:mt-8 pt-4 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] text-center sm:text-left">
              © {new Date().getFullYear()} SpectrumCosmo. All rights reserved.
            </p>
            <div className="flex gap-3 sm:gap-5 text-[10px] sm:text-xs">
              <Link href="/terms" className="text-[var(--foreground-muted)] hover:text-[var(--primary)] transition">Terms</Link>
              <Link href="/privacy" className="text-[var(--foreground-muted)] hover:text-[var(--primary)] transition">Privacy</Link>
              <Link href="/shipping" className="text-[var(--foreground-muted)] hover:text-[var(--primary)] transition">Shipping</Link>
            </div>
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] italic text-center sm:text-left">
              "Wear your excitement with pride"
            </p>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 bg-[var(--primary)] text-white p-2.5 sm:p-3 rounded-full shadow-lg hover:bg-[var(--primary-hover)] transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
          aria-label="Back to top"
        >
          <ArrowUp size={16} className="sm:w-5 sm:h-5" />
        </button>
      )}
    </>
  )
}
