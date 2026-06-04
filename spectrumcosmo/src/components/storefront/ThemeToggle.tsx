'use client'

import { useSettings } from './SettingsProvider'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { useState } from 'react'

type ThemeMode = 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const { settings, setTheme, resolvedTheme } = useSettings()
  const [isChanging, setIsChanging] = useState(false)

  const cycleTheme = async () => {
    if (isChanging) return
    
    setIsChanging(true)
    
    let nextTheme: ThemeMode
    if (settings.theme === 'light') nextTheme = 'dark'
    else if (settings.theme === 'dark') nextTheme = 'system'
    else nextTheme = 'light'
    
    setTheme(nextTheme)
    
    // Small delay to prevent rapid clicking
    setTimeout(() => setIsChanging(false), 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      cycleTheme()
    }
  }

  // Icon based on RESOLVED theme (what user actually sees)
  const getIcon = () => {
    if (resolvedTheme === 'light') return <Sun size={18} />
    if (resolvedTheme === 'dark') return <Moon size={18} />
    return <Monitor size={18} />
  }

  // Label based on USER SETTING (what mode they selected)
  const getLabel = () => {
    if (settings.theme === 'light') return 'Light mode'
    if (settings.theme === 'dark') return 'Dark mode'
    return 'Auto (follows device)'
  }

  // Short label for display
  const getShortLabel = () => {
    if (settings.theme === 'light') return 'Light'
    if (settings.theme === 'dark') return 'Dark'
    return 'System'
  }

  const isActive = (mode: ThemeMode) => settings.theme === mode

  return (
    <div className="relative">
      {/* Single button for cycling (simple version) */}
      <button
        onClick={cycleTheme}
        onKeyDown={handleKeyDown}
        disabled={isChanging}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg 
          bg-gray-100 dark:bg-gray-800 
          hover:bg-gray-200 dark:hover:bg-gray-700 
          focus:ring-2 focus:ring-orange-500 focus:outline-none
          transition-all duration-200
          ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={`Theme: ${getLabel()}. Current: ${resolvedTheme} mode. Click to change.`}
        aria-live="polite"
      >
        {getIcon()}
        <span className="text-sm font-medium">{getShortLabel()}</span>
      </button>

      {/* Optional: Dropdown version for more control */}
    </div>
  )
}
