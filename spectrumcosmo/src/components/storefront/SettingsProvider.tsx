'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { CurrencyCode } from '@/lib/currency'

type Settings = {
  currency: CurrencyCode
  darkMode: boolean
  language: string
}

type SettingsContextType = {
  settings: Settings
  setCurrency: (c: CurrencyCode) => void
  setDarkMode: (v: boolean) => void
  setLanguage: (v: string) => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

const DEFAULT_SETTINGS: Settings = {
  currency: 'USD',
  darkMode: false,
  language: 'English',
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  // load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sc-settings')
    if (saved) {
      setSettings(JSON.parse(saved))
    }
  }, [])

  // persist
  useEffect(() => {
    localStorage.setItem('sc-settings', JSON.stringify(settings))
  }, [settings])

  const setCurrency = (currency: CurrencyCode) => {
    setSettings(prev => ({ ...prev, currency }))
  }

  const setDarkMode = (darkMode: boolean) => {
    setSettings(prev => ({ ...prev, darkMode }))
    document.documentElement.classList.toggle('dark', darkMode)
  }

  const setLanguage = (language: string) => {
    setSettings(prev => ({ ...prev, language }))
  }

  return (
    <SettingsContext.Provider
      value={{ settings, setCurrency, setDarkMode, setLanguage }}
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
