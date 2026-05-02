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

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        setUser(null)
        setLoading(false)
        return
      }

      const data = await res.json()
      setUser(data.user)
    } catch {
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
