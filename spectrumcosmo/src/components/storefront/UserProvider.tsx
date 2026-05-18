'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

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
  // Clear any stale localStorage items
  localStorage.removeItem('spectrumcosmo_cart')
  sessionStorage.clear()
  // Note: clearing cookies is not possible from client side for httpOnly cookies,
  // but the backend will reject them anyway. The user will be logged out gracefully.
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/auth/me')
      
      // Safely parse JSON – if response is not JSON, treat as not logged in
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
        // If the API returned null user or an error, clear stale auth data
        clearStaleAuthData()
        setUser(null)
      }
    } catch (networkError) {
      console.error('Network error loading user:', networkError)
      setUser(null)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadUser()
  }, [])

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
