'use client'

import { useSettings } from './SettingsProvider'
import { Sun, Moon, Monitor } from 'lucide-react'

export function ThemeToggle() {
  const { settings, setTheme, resolvedTheme } = useSettings()

  const cycleTheme = () => {
    if (settings.theme === 'light') setTheme('dark')
    else if (settings.theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const getIcon = () => {
    if (settings.theme === 'light') return <Sun size={18} />
    if (settings.theme === 'dark') return <Moon size={18} />
    return <Monitor size={18} />
  }

  const getLabel = () => {
    if (settings.theme === 'light') return 'Light'
    if (settings.theme === 'dark') return 'Dark'
    return 'System'
  }

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label={`Theme: ${getLabel()}`}
    >
      {getIcon()}
      <span className="text-sm font-medium">{getLabel()}</span>
    </button>
  )
}
