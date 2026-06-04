'use client'

import { useSettings } from './SettingsProvider'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function ThemeDropdown() {
  const { settings, setTheme, resolvedTheme } = useSettings()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getIcon = () => {
    if (resolvedTheme === 'light') return <Sun size={18} />
    if (resolvedTheme === 'dark') return <Moon size={18} />
    return <Monitor size={18} />
  }

  const getCurrentLabel = () => {
    if (settings.theme === 'light') return 'Light'
    if (settings.theme === 'dark') return 'Dark'
    return 'System'
  }

  const options = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Always light mode' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Always dark mode' },
    { value: 'system', label: 'System', icon: Monitor, description: 'Follow device setting' },
  ] as const

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-colors"
        aria-label="Theme settings"
        aria-expanded={isOpen}
      >
        {getIcon()}
        <span className="text-sm font-medium">{getCurrentLabel()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          {options.map((option) => {
            const Icon = option.icon
            const isSelected = settings.theme === option.value
            
            return (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value)
                  setIsOpen(false)
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                  ${isSelected ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-700 dark:text-gray-300'}
                `}
                role="menuitem"
              >
                <Icon size={16} className={isSelected ? 'text-orange-500' : ''} />
                <span className="flex-1 text-left">{option.label}</span>
                {isSelected && <Check size={14} className="text-orange-500" />}
                <span className="text-xs text-gray-400 dark:text-gray-500">{option.description}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
