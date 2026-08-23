'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function MobileSearchBar() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { theme, systemTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'light';
  const isDark = currentTheme === 'dark';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setIsFocused(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsFocused(false);
  };

  return (
    <div className="md:hidden bg-[var(--background-card)] px-4 pb-3">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Search for anime, merch, apparel..."
            className={`w-full border ${
              isFocused
                ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
                : 'border-[var(--border)]'
            } bg-[var(--background)] rounded-xl py-3 pl-12 pr-12 text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none transition-all`}
          />
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--background-secondary)] transition-colors"
            >
              <X size={16} className="text-[var(--foreground-muted)]" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
