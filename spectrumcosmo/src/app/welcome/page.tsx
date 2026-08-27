'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

const WELCOME_CAROUSEL_IMAGES = [
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714751/f09477c9aef7e70ff0a559489fac4dcd_mffof9.jpg',
    alt: 'SpectrumCosmo T-Shirt',
  },
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714750/d98193c851d049a19cf7de400ec47132_fepxrd.jpg',
    alt: 'SpectrumCosmo Hat',
  },
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1779458747/vi5qhouqm7f92q2ghzka.jpg',
    alt: 'SpectrumCosmo Pendant',
  },
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714751/f09477c9aef7e70ff0a559489fac4dcd_mffof9.jpg',
    alt: 'SpectrumCosmo Collection',
  },
];

export default function WelcomePage() {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % WELCOME_CAROUSEL_IMAGES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  const currentImage = WELCOME_CAROUSEL_IMAGES[currentIndex];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      {/* Background Image Carousel */}
      <div className="absolute inset-0">
        {WELCOME_CAROUSEL_IMAGES.map((img, idx) => (
          <div
            key={idx}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{
              opacity: idx === currentIndex ? 1 : 0,
            }}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              className="object-cover"
              priority={idx === 0}
              sizes="100vw"
            />
          </div>
        ))}
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70" />
        
        {/* Blur overlay */}
        <div className="absolute inset-0 backdrop-blur-md" />
        
        {/* Burnt orange atmospheric overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(ellipse at center, var(--primary) 0%, transparent 70%)' }}
        />
        
        {/* Edge fade gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-transparent to-transparent opacity-40" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="max-w-sm w-full text-center">
          {/* Logo */}
          <div className="mb-6">
            <img
              src="https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426888/spectrumcosmo_mark_white_1024px_mppdiq.png"
              alt="SpectrumCosmo"
              className="h-16 mx-auto mb-3"
            />
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-anton text-white tracking-tight">
              Welcome
            </h1>
            <p className="text-[var(--foreground-muted)] mt-2 text-base font-body">
              Are you new here?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/signup"
              className="block w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="block w-full border border-white/20 text-white font-semibold py-3.5 rounded-xl transition-colors hover:bg-white/5"
            >
              Log In
            </Link>
            <Link
              href="/"
              className="block w-full text-[var(--foreground-muted)] text-sm py-3 hover:text-white transition-colors font-body"
            >
              Continue as a guest →
            </Link>
          </div>

          {/* Footer */}
          <p className="text-[10px] text-[var(--foreground-muted)] mt-8 font-body">
            By continuing you agree to our{' '}
            <Link href="/terms" className="text-white/60 hover:text-white transition-colors">
              Terms
            </Link>
            {' & '}
            <Link href="/privacy" className="text-white/60 hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
