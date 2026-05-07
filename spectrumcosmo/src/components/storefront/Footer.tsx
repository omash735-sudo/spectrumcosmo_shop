'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Twitter, Mail, Facebook, MessageCircle, Music2, Send, Loader2 } from 'lucide-react'
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

  // Logo for dark background (navbar dark mode logo)
  const logoSrc = "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png"

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

  // Check subscription status on email blur
  const checkSubscriptionStatus = async (email: string) => {
    if (!email || !email.includes('@')) return
    setChecking(true)
    try {
      const res = await fetch(`/api/subscribe?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      if (data.subscribed) {
        setSubStatus({ type: 'error', msg: 'This email is already subscribed!' })
      } else {
        // Clear error only if previous error was about duplicate
        if (subStatus?.type === 'error' && subStatus.msg.includes('already subscribed')) {
          setSubStatus(null)
        }
      }
    } catch (err) {
      // Silently ignore – we'll rely on POST error
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
      // Final check before sending (in case user changed email after blur)
      const checkRes = await fetch(`/api/subscribe?email=${encodeURIComponent(emailSub)}`)
      const checkData = await checkRes.json()
      if (checkData.subscribed) {
        setSubStatus({ type: 'error', msg: 'This email is already subscribed!' })
        setSubmitting(false)
        return
      }

      // Submit subscription
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailSub }),
      })

      if (res.ok) {
        setSubStatus({ type: 'success', msg: 'Subscribed! Check your inbox.' })
        setEmailSub('')
        // Clear the checking error if any
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

  return (
    <footer className="bg-[#111111] text-white" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand + About */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <Image
                src={logoSrc}
                alt="SpectrumCosmo"
                width={140}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Wear your excitement with pride. Custom apparel and anime merchandise crafted for those who live boldly.
            </p>
            <div className="flex gap-3 mt-5">
              {links.instagram && (
                <a href={links.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#F97316] transition-colors">
                  <Instagram size={16} />
                </a>
              )}
              {links.twitter && (
                <a href={links.twitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#F97316] transition-colors">
                  <Twitter size={16} />
                </a>
              )}
              {links.facebook && (
                <a href={links.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#F97316] transition-colors">
                  <Facebook size={16} />
                </a>
              )}
              {links.tiktok && (
                <a href={links.tiktok} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#F97316] transition-colors">
                  <Music2 size={16} />
                </a>
              )}
              {links.whatsapp && (
                <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#F97316] transition-colors">
                  <MessageCircle size={16} />
                </a>
              )}
              <a href={`mailto:${links.email}`} className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-[#F97316] transition-colors">
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm tracking-wider uppercase text-gray-400 mb-5">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { href: '/', label: 'Home' },
                { href: '/products', label: 'Products' },
                { href: '/reviews/submit', label: 'Write a Review' },
                { href: '/#reviews', label: 'Customer Reviews' },
                { href: '/account', label: 'My Account' },
                { href: '/contact', label: 'Contact' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-400 hover:text-[#FDBA74] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-sm tracking-wider uppercase text-gray-400 mb-5">Newsletter</h3>
            <p className="text-sm text-gray-400 mb-3">
              Get the latest drops, discounts & anime news.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <div className="flex">
                <input
                  type="email"
                  value={emailSub}
                  onChange={(e) => setEmailSub(e.target.value)}
                  onBlur={() => checkSubscriptionStatus(emailSub)}
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 rounded-l-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                  required
                  disabled={submitting}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#F97316] px-3 rounded-r-lg hover:bg-[#ea6c0f] transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
              {(checking || submitting) && !subStatus && (
                <p className="text-xs text-gray-400">Checking...</p>
              )}
              {subStatus && (
                <p className={`text-xs ${subStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {subStatus.msg}
                </p>
              )}
            </form>
          </div>

          {/* Contact / CTA */}
          <div>
            <h3 className="font-semibold text-sm tracking-wider uppercase text-gray-400 mb-5">Get in Touch</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Mail size={14} />
                <a href={`mailto:${links.email}`} className="hover:text-white transition">
                  {links.email}
                </a>
              </li>
              <li>Mon–Fri, 9am–6pm WAT</li>
              <li className="pt-2">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-[#F97316] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#ea6c0f] transition-colors"
                >
                  Shop the Collection
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} SpectrumCosmo. All rights reserved.</p>
          <p className="text-xs text-gray-500 italic">"Wear your excitement with pride."</p>
        </div>
      </div>
    </footer>
  )
}
