// components/storefront/Footer.tsx
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
  Heart,
  Shield,
  Truck,
  CreditCard,
  Smartphone,
  Handshake,
  MapPin
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useSettings } from './SettingsProvider'

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
  const { settings } = useSettings()
  const [mounted, setMounted] = useState(false)
  const [links, setLinks] = useState<SocialLinks>({
    instagram: '',
    twitter: '',
    facebook: '',
    tiktok: '',
    whatsapp: '',
    email: settings?.store_email || 'spectrumcosmo01@gmail.com',
  })
  const [emailSub, setEmailSub] = useState('')
  const [subStatus, setSubStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [checking, setChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'light'
  
  const logoSrc = currentTheme === 'dark'
    ? settings?.company_logo_dark || "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png"
    : settings?.company_logo || "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png"

  useEffect(() => {
    fetch('/api/admin/social-links')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        setLinks((prev) => ({ ...prev, ...data }))
      })
      .catch(() => null)
  }, [])

  useEffect(() => {
    if (settings?.store_email) {
      setLinks(prev => ({ ...prev, email: settings.store_email }))
    }
  }, [settings?.store_email])

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
    { href: '/newsletter', label: 'Newsletter' },
  ]

  const socialLinks = [
    { key: 'instagram', icon: Instagram, color: 'hover:bg-gradient-to-br from-pink-500 to-orange-500' },
    { key: 'twitter', icon: Twitter, color: 'hover:bg-blue-400' },
    { key: 'facebook', icon: Facebook, color: 'hover:bg-blue-600' },
    { key: 'tiktok', icon: Music2, color: 'hover:bg-black' },
    { key: 'whatsapp', icon: MessageCircle, color: 'hover:bg-green-500' },
  ]

  const paymentIcons = [
    { icon: CreditCard, name: 'Card' },
    { icon: Smartphone, name: 'Mobile Money' },
    { icon: Handshake, name: 'Cash' },
  ]

  const companyName = settings?.store_name || 'SpectrumCosmo'
  const companyAddress = settings?.store_address || 'Lilongwe, Malawi'
  const companyEmail = settings?.store_email || 'spectrumcosmo01@gmail.com'
  const companyPhone = settings?.store_phone || '+265 893 16 02 02'
  const footerCopyright = settings?.footer_copyright || 'All rights reserved.'

  return (
    <>
      <footer className="bg-[var(--background-secondary)] dark:bg-[var(--background-secondary)] text-[var(--foreground)] mt-20 border-t border-[var(--border)]">
        {/* Newsletter Section */}
        <div className="border-b border-[var(--border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 md:py-16">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-[var(--primary)]/20 px-3 sm:px-4 py-1 rounded-full mb-3 sm:mb-4">
                  <span className="text-sm sm:text-base font-medium font-kanit text-[var(--primary)]">
                    Get 10% off on your first purchase
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold font-anton text-[var(--foreground)] tracking-wider">
                  Subscribe for exclusive offers
                </h3>
                <p className="text-base sm:text-lg md:text-xl font-kanit text-[var(--foreground-muted)] mt-1 sm:mt-2">
                  Anime news, drops & 10% off your first order
                </p>
              </div>
              
              <form onSubmit={handleSubscribe} className="w-full sm:w-96 md:w-80 lg:w-96">
                <div className="flex">
                  <input
                    type="email"
                    value={emailSub}
                    onChange={(e) => setEmailSub(e.target.value)}
                    onBlur={() => checkSubscriptionStatus(emailSub)}
                    placeholder="Your email address"
                    className="flex-1 px-4 sm:px-5 py-3 sm:py-4 rounded-l-xl bg-[var(--background)] border border-[var(--border)] font-kanit text-base sm:text-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder-[var(--foreground-muted)] min-h-[48px] sm:min-h-[52px]"
                    required
                    disabled={submitting}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-5 sm:px-6 rounded-r-xl transition disabled:opacity-50 text-white min-h-[48px] sm:min-h-[52px] flex items-center justify-center"
                  >
                    {submitting ? <Loader2 size={20} className="sm:w-6 sm:h-6 animate-spin" /> : <Send size={20} className="sm:w-6 sm:h-6" />}
                  </button>
                </div>
                {(checking || submitting) && !subStatus && (
                  <p className="text-xs sm:text-sm font-kanit text-[var(--foreground-muted)] mt-2">Checking...</p>
                )}
                {subStatus && (
                  <p className={`text-xs sm:text-sm font-kanit mt-2 ${subStatus.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {subStatus.msg}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 md:gap-12">
            
            {/* Brand Section */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-5">
              <Image
                src={logoSrc}
                alt={companyName}
                width={160}
                height={55}
                className="object-contain"
                priority
              />
              <p className="text-base sm:text-lg md:text-xl font-kanit text-[var(--foreground-muted)] leading-relaxed">
                Wear your excitement with pride. Premium custom apparel and anime merchandise for those who live boldly.
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3 pt-1 sm:pt-2">
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
                      className={`w-10 h-10 sm:w-12 sm:h-12 bg-[var(--background)] rounded-full flex items-center justify-center transition-all hover:scale-110 text-[var(--foreground-muted)] hover:text-white ${social.color}`}
                      aria-label={social.key}
                    >
                      <Icon size={18} className="sm:w-5 sm:h-5" />
                    </a>
                  )
                })}
                <a
                  href={`mailto:${companyEmail}`}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--background)] rounded-full flex items-center justify-center transition-all hover:scale-110 text-[var(--foreground-muted)] hover:text-white hover:bg-[var(--primary)]"
                  aria-label="Email"
                >
                  <Mail size={18} className="sm:w-5 sm:h-5" />
                </a>
              </div>
            </div>

            {/* SHOP SECTION */}
            <div className="lg:col-span-2">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold font-anton text-[var(--foreground)] mb-4 sm:mb-5 tracking-wider uppercase">
                Shop
              </h3>
              <ul className="space-y-3 sm:space-y-4">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-lg sm:text-xl md:text-2xl font-kanit text-[var(--foreground-muted)] hover:text-[var(--primary)] transition">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* SUPPORT SECTION */}
            <div className="lg:col-span-3">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold font-anton text-[var(--foreground)] mb-4 sm:mb-5 tracking-wider uppercase">
                Support
              </h3>
              <ul className="space-y-3 sm:space-y-4">
                <li>
                  <Link href="/shipping" className="text-lg sm:text-xl md:text-2xl font-kanit text-[var(--foreground-muted)] hover:text-[var(--primary)] transition">
                    Shipping Info
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="text-lg sm:text-xl md:text-2xl font-kanit text-[var(--foreground-muted)] hover:text-[var(--primary)] transition">
                    Returns & Exchanges
                  </Link>
                </li>
                <li>
                  <Link href="/size-guide" className="text-lg sm:text-xl md:text-2xl font-kanit text-[var(--foreground-muted)] hover:text-[var(--primary)] transition">
                    Size Guide
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-lg sm:text-xl md:text-2xl font-kanit text-[var(--foreground-muted)] hover:text-[var(--primary)] transition">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-lg sm:text-xl md:text-2xl font-kanit text-[var(--foreground-muted)] hover:text-[var(--primary)] transition">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* CONTACT US SECTION */}
            <div className="lg:col-span-3">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold font-anton text-[var(--foreground)] mb-4 sm:mb-5 tracking-wider uppercase">
                Contact Us
              </h3>
              <ul className="space-y-3 sm:space-y-4 mb-4 sm:mb-5">
                <li className="flex items-start gap-3 text-lg sm:text-xl md:text-2xl font-kanit text-[var(--foreground-muted)]">
                  <Mail size={20} className="sm:w-6 sm:h-6 text-[var(--primary)] flex-shrink-0 mt-1" />
                  <a href={`mailto:${companyEmail}`} className="hover:text-[var(--primary)] transition">
                    {companyEmail}
                  </a>
                </li>
                <li className="flex items-start gap-3 text-lg sm:text-xl md:text-2xl font-kanit text-[var(--foreground-muted)]">
                  <Smartphone size={20} className="sm:w-6 sm:h-6 text-[var(--primary)] flex-shrink-0 mt-1" />
                  <a href={`tel:${companyPhone}`} className="hover:text-[var(--primary)] transition">
                    {companyPhone}
                  </a>
                </li>
                <li className="flex items-start gap-3 text-lg sm:text-xl md:text-2xl font-kanit text-[var(--foreground-muted)]">
                  <MapPin size={20} className="sm:w-6 sm:h-6 text-[var(--primary)] flex-shrink-0 mt-1" />
                  <span>{companyAddress}</span>
                </li>
              </ul>
              <div className="flex flex-wrap gap-2 sm:gap-3 pt-1 sm:pt-2">
                {paymentIcons.map((payment, idx) => {
                  const Icon = payment.icon
                  return (
                    <div key={idx} className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                      <Icon size={16} className="sm:w-5 sm:h-5 text-[var(--foreground-muted)]" />
                      <span className="text-sm sm:text-base font-kanit text-[var(--foreground-muted)]">{payment.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-[var(--border)] mt-8 sm:mt-10 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-sm sm:text-base md:text-lg font-kanit text-[var(--foreground-muted)] text-center sm:text-left">
              © {new Date().getFullYear()} {companyName}. {footerCopyright}
            </p>
            <div className="flex gap-4 sm:gap-6 text-sm sm:text-base md:text-lg font-kanit">
              <Link href="/terms" className="text-[var(--foreground-muted)] hover:text-[var(--primary)] transition">Terms</Link>
              <Link href="/privacy" className="text-[var(--foreground-muted)] hover:text-[var(--primary)] transition">Privacy</Link>
              <Link href="/shipping" className="text-[var(--foreground-muted)] hover:text-[var(--primary)] transition">Shipping</Link>
            </div>
            <p className="text-sm sm:text-base md:text-lg font-kanit text-[var(--foreground-muted)] italic text-center sm:text-left">
              "Wear your excitement with pride"
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
