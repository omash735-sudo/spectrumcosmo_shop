'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type User = {
  id: string
  name: string
  email: string
  phone?: string
  profileImage?: string
  newsletterSubscribed?: boolean
}

type UserContextType = {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
  setUser: (u: User | null) => void
}

const UserContext = createContext<UserContextType | null>(null)

function clearStaleAuthData() {
  localStorage.removeItem('spectrumcosmo_cart')
  sessionStorage.clear()
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  const loadUser = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/auth/me')
      
      let data
      try {
        data = await res.json()
      } catch (parseError) {
        console.warn('Invalid JSON from /api/auth/me, treating as not logged in')
        setUser(null)
        setLoading(false)
        return
      }

      if (data?.user) {
        setUser(data.user)
      } else {
        clearStaleAuthData()
        setUser(null)
      }
    } catch (networkError) {
      console.error('Network error loading user:', networkError)
      setUser(null)
    }

    setLoading(false)
  }

  // Initial load
  useEffect(() => {
    loadUser()
  }, [])

  // Re-fetch user when pathname changes (navigation between pages)
  useEffect(() => {
    // Only re-fetch if we're on a protected route or account page
    if (pathname?.startsWith('/account') || pathname?.startsWith('/checkout')) {
      loadUser()
    }
  }, [pathname])

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        setUser,
        refreshUser: loadUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be inside UserProvider')
  return ctx
}
