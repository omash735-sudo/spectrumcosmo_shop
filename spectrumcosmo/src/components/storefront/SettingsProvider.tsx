'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { CurrencyCode } from '@/lib/currency'

type Settings = {
  currency: CurrencyCode
  darkMode: boolean
  language: string
  emailNotifications: boolean
  smsAlerts: boolean
  twoFactor: boolean
}

type SettingsContextType = {
  settings: Settings
  setSettings: (s: Settings) => void
  update: (patch: Partial<Settings>) => void
  setCurrency: (c: CurrencyCode) => void
  setDarkMode: (v: boolean) => void
  setLanguage: (v: string) => void
  hydrated: boolean
}

const STORAGE_KEY = 'spectrumcosmo_settings'

const defaultSettings: Settings = {
  currency: 'USD',
  darkMode: false,
  language: 'English',
  emailNotifications: true,
  smsAlerts: false,
  twoFactor: false,
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) })
      }
    } catch {
      console.log('Settings parse error, using defaults')
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings, hydrated])

  const update = (patch: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }

  const setCurrency = (currency: CurrencyCode) => update({ currency })

  const setDarkMode = (darkMode: boolean) => update({ darkMode })

  const setLanguage = (language: string) => update({ language })

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setSettings,
        update,
        setCurrency,
        setDarkMode,
        setLanguage,
        hydrated,
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
