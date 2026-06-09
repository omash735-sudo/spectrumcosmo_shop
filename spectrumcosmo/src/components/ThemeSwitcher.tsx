// components/ThemeSwitcher.tsx
'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor, X } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('system');
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme('system');
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    setShowModal(false);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Theme Toggle Button */}
      <button
        onClick={() => setShowModal(true)}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        aria-label="Change theme"
      >
        {theme === 'dark' ? (
          <Moon size={20} className="text-gray-700 dark:text-gray-300" />
        ) : theme === 'light' ? (
          <Sun size={20} className="text-gray-700 dark:text-gray-300" />
        ) : (
          <Monitor size={20} className="text-gray-700 dark:text-gray-300" />
        )}
      </button>

      {/* Theme Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b dark:border-gray-800">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Choose your theme
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Currently following {theme === 'system' ? 'system preference' : `${theme} mode`}
                  </p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                >
                  <X size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <button
                onClick={() => handleThemeChange('light')}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                  theme === 'light'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                }`}
              >
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <Sun size={24} className="text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Light Mode</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Bright and clean interface</p>
                </div>
                {theme === 'light' && (
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                )}
              </button>

              <button
                onClick={() => handleThemeChange('dark')}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                  theme === 'dark'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                }`}
              >
                <div className="p-2 rounded-full bg-gray-800 dark:bg-gray-700">
                  <Moon size={24} className="text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Dark Mode</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Easy on the eyes at night</p>
                </div>
                {theme === 'dark' && (
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                )}
              </button>

              <button
                onClick={() => handleThemeChange('system')}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                  theme === 'system'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                }`}
              >
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Monitor size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">System Default</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Follow your device settings</p>
                </div>
                {theme === 'system' && (
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                )}
              </button>
            </div>

            <div className="p-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Your preference is saved automatically
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
