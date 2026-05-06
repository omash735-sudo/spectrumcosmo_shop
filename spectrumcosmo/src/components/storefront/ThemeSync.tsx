'use client'

import { useEffect } from 'react'
import { useSettings } from './SettingsProvider'

export default function ThemeSync({ children }: { children: React.ReactNode }) {
  const { settings, hydrated } = useSettings()

  useEffect(() => {
    if (!hydrated) return

    const root = document.documentElement

    root.classList.remove('dark')

    if (settings.darkMode) {
      root.classList.add('dark')
    }
  }, [settings.darkMode, hydrated])

  return <>{children}</>
}
