'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { CurrencyCode } from '@/lib/currency'

type Settings = {
  name: string
  phone: string
  newsletterSubscribed: boolean
  currency: CurrencyCode
}

type SettingsContextType = {
  settings: Settings | null
  updateSettings: (data: Partial<Settings>) => Promise<void>
  loading: boolean
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  // LOAD SETTINGS ON APP START
  useEffect(() => {
    fetch('/api/account/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data)

        // sync currency globally
        if (data?.currency) {
          localStorage.setItem('currency', data.currency)
        }

        setLoading(false)
      })
  }, [])

  // UPDATE SETTINGS
  const updateSettings = async (data: Partial<Settings>) => {
    const res = await fetch('/api/account/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const updated = await res.json()

    setSettings(updated.settings)

    if (updated.settings?.currency) {
      localStorage.setItem('currency', updated.settings.currency)
    }
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider')
  return ctx
}
