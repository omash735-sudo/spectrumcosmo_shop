'use client'

import { useEffect } from 'react'
import { useSettings } from './SettingsProvider'

export default function ThemeSync({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings()

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [settings.darkMode])

  return <>{children}</>
}
