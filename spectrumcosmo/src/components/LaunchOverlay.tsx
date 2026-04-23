'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function LaunchOverlay() {
  const pathname = usePathname()

  // Launch date: 1 month + 2 weeks from setup (edit if needed)
  const LAUNCH_DATE = new Date('2026-07-07T00:00:00')

  const MASTER_KEY = '0000'

  const [locked, setLocked] = useState(true)
  const [input, setInput] = useState('')
  const [expired, setExpired] = useState(false)

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  // Do not block admin routes (future-safe)
  if (pathname.startsWith('/admin')) return null

  // Countdown + auto-expire logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const distance = LAUNCH_DATE.getTime() - now

      if (distance <= 0) {
        setExpired(true)
        setLocked(false)
        return
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((distance / 1000 / 60) % 60),
        seconds: Math.floor((distance / 1000) % 60),
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const unlock = () => {
    if (input === MASTER_KEY) {
      setLocked(false)
    }
  }

  // If unlocked or expired, show site normally
  if (!locked || expired) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black text-white overflow-hidden">

      {/* BACKGROUND VIDEO (construction animation) */}
      <div className="absolute inset-0 opacity-40">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/construction.mp4" type="video/mp4" />
        </video>
      </div>

      {/* DARK OVERLAY FOR READABILITY */}
      <div className="absolute inset-0 bg-black/60" />

      {/* CONTENT */}
      <div className="relative z-10 text-center px-6">

        <h1 className="text-4xl font-bold mb-2">
          Spectrum Cosmo
        </h1>

        <p className="text-gray-300 mb-6">
          Website under construction. We are building something premium.
        </p>

        {/* COUNTDOWN */}
        <div className="flex gap-6 justify-center mb-10">

          <div>
            <p className="text-3xl font-bold">{timeLeft.days}</p>
            <p className="text-xs text-gray-400">Days</p>
          </div>

          <div>
            <p className="text-3xl font-bold">{timeLeft.hours}</p>
            <p className="text-xs text-gray-400">Hours</p>
          </div>

          <div>
            <p className="text-3xl font-bold">{timeLeft.minutes}</p>
            <p className="text-xs text-gray-400">Minutes</p>
          </div>

          <div>
            <p className="text-3xl font-bold">{timeLeft.seconds}</p>
            <p className="text-xs text-gray-400">Seconds</p>
          </div>

        </div>

        {/* MASTER KEY INPUT */}
        <div className="flex gap-2 justify-center">

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter master key"
            className="px-3 py-2 rounded text-black"
          />

          <button
            onClick={unlock}
            className="bg-white text-black px-4 py-2 rounded"
          >
            Unlock
          </button>

        </div>

        <p className="text-xs text-gray-500 mt-4">
          System preview mode active
        </p>

      </div>
    </div>
  )
}
