'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { CurrencyCode } from '@/lib/currency'

type ThemeMode = 'light' | 'dark' | 'system'
type LanguageCode = 'English' | 'Chichewa'

type Settings = {
  currency: CurrencyCode
  language: LanguageCode
  theme: ThemeMode
  emailNotifications: boolean
  smsAlerts: boolean
  twoFactor: boolean
  store_name: string
  store_email: string
  store_phone: string
  store_address: string
  company_logo: string
  company_logo_dark: string
  footer_copyright: string
  invoice_logo_url: string
  default_delivery_days: number
  data_retention_days: number
  discount_banner_default: string
}

type SettingsContextType = {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  setCurrency: (c: CurrencyCode) => void
  setLanguage: (l: LanguageCode) => void
  setTheme: (t: ThemeMode) => void
  resetSettings: () => void
  hydrated: boolean
  resolvedTheme: 'light' | 'dark'
}

const STORAGE_KEY = 'spectrumcosmo_settings'

const defaultSettings: Settings = {
  currency: 'USD',
  language: 'English',
  theme: 'system',
  emailNotifications: true,
  smsAlerts: false,
  twoFactor: false,
  store_name: 'SpectrumCosmo',
  store_email: 'spectrumcosmo01@gmail.com',
  store_phone: '+265 893 16 02 02',
  store_address: 'Lilongwe, Malawi',
  company_logo: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png',
  company_logo_dark: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png',
  footer_copyright: 'All rights reserved.',
  invoice_logo_url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png',
  default_delivery_days: 5,
  data_retention_days: 2555,
  discount_banner_default: 'Get 25% off your next order with code: WELCOME25',
}

const validCurrencies: CurrencyCode[] = ['USD', 'MWK', 'ZAR', 'EUR', 'NGN', 'GBP', 'KES', 'TZS', 'ZMW', 'ZWL']
const validLanguages: LanguageCode[] = ['English', 'Chichewa']
const validThemes: ThemeMode[] = ['light', 'dark', 'system']

function isValidSettings(data: unknown): data is Settings {
  if (!data || typeof data !== 'object') return false
  
  const s = data as Partial<Settings>
  
  return (
    (!s.currency || validCurrencies.includes(s.currency)) &&
    (!s.language || validLanguages.includes(s.language)) &&
    (!s.theme || validThemes.includes(s.theme)) &&
    (s.emailNotifications === undefined || typeof s.emailNotifications === 'boolean') &&
    (s.smsAlerts === undefined || typeof s.smsAlerts === 'boolean') &&
    (s.twoFactor === undefined || typeof s.twoFactor === 'boolean')
  )
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [hydrated, setHydrated] = useState(false)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Load saved settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (isValidSettings(parsed)) {
          setSettings({ ...defaultSettings, ...parsed })
        } else {
          console.warn('Invalid settings in localStorage, using defaults')
        }
      }
    } catch {
      console.log('Settings parse error, using defaults')
    }
    setHydrated(true)
  }, [])

  // Fetch store settings from database after hydration
  useEffect(() => {
    if (!hydrated) return

    const fetchStoreSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings')
        if (res.ok) {
          const data = await res.json()
          
          // Map database keys to settings object
          setSettings(prev => ({
            ...prev,
            store_name: data.store_name || data.company_name || prev.store_name,
            store_email: data.store_email || data.company_email || prev.store_email,
            store_phone: data.store_phone || data.company_phone || prev.store_phone,
            store_address: data.store_address || data.company_address || prev.store_address,
            company_logo: data.company_logo || prev.company_logo,
            company_logo_dark: data.company_logo_dark || prev.company_logo_dark,
            footer_copyright: data.footer_copyright || prev.footer_copyright,
            invoice_logo_url: data.invoice_logo_url || prev.invoice_logo_url,
            default_delivery_days: data.default_delivery_days ? parseInt(data.default_delivery_days) : prev.default_delivery_days,
            data_retention_days: data.data_retention_days ? parseInt(data.data_retention_days) : prev.data_retention_days,
            discount_banner_default: data.discount_banner_default || prev.discount_banner_default,
          }))
        }
      } catch (err) {
        console.error('Failed to fetch store settings:', err)
      }
    }

    fetchStoreSettings()
  }, [hydrated])

  // Cross-tab sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (isValidSettings(parsed)) {
            setSettings({ ...defaultSettings, ...parsed })
          }
        } catch {
          // Ignore invalid JSON
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Apply theme to DOM
  useEffect(() => {
    if (!hydrated) return

    let currentTheme: 'light' | 'dark'
    
    if (settings.theme === 'system') {
      currentTheme = getSystemTheme()
    } else {
      currentTheme = settings.theme
    }
    
    setResolvedTheme(currentTheme)

    const html = document.documentElement
    if (currentTheme === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }, [settings.theme, hydrated])

  // Listen for system theme changes
  useEffect(() => {
    if (!hydrated || settings.theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      const newTheme = getSystemTheme()
      setResolvedTheme(newTheme)
      
      const html = document.documentElement
      if (newTheme === 'dark') {
        html.classList.add('dark')
      } else {
        html.classList.remove('dark')
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [hydrated, settings.theme])

  // Persist to localStorage
  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings, hydrated])

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }, [])

  const setCurrency = useCallback((currency: CurrencyCode) => update({ currency }), [update])
  const setLanguage = useCallback((language: LanguageCode) => update({ language }), [update])
  const setTheme = useCallback((theme: ThemeMode) => update({ theme }), [update])
  const resetSettings = useCallback(() => setSettings(defaultSettings), [])

  return (
    <SettingsContext.Provider
      value={{
        settings,
        update,
        setCurrency,
        setLanguage,
        setTheme,
        resetSettings,
        hydrated,
        resolvedTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
