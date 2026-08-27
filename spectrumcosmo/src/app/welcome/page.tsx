'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

const WELCOME_IMAGES = [
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_16.15.36_ubl2ww.jpg',
    alt: 'T-Shirt Collection',
  },
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-04_at_23.58.16_a0z7ns.jpg',
    alt: 'Hoodie Collection',
  },
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.34_c2lzfq.jpg',
    alt: 'Pendant Collection',
  },
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.16_rkdwvc.jpg',
    alt: 'Bracelet Collection',
  },
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.34_c2lzfq.jpg',
    alt: 'Accessories',
  },
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_16.15.36_ubl2ww.jpg',
    alt: 'Anime Collection',
  },
];

function AnimatedImageStrip({ 
  images, 
  direction = 'up', 
  speed = 20,
  offset = 0 
}: { 
  images: typeof WELCOME_IMAGES;
  direction?: 'up' | 'down';
  speed?: number;
  offset?: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const doubledImages = [...images, ...images];

  return (
    <div className="relative w-full overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
      <div 
        className="flex gap-3 py-2"
        style={{
          animation: `strip-scroll-${direction} ${speed}s linear infinite`,
          animationDelay: `${offset}s`,
          width: 'fit-content',
        }}
      >
        {doubledImages.map((img, idx) => (
          <div 
            key={idx}
            className="relative flex-shrink-0 rounded-2xl overflow-hidden"
            style={{ 
              width: '140px',
              height: '180px',
            }}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              className="object-cover"
              sizes="140px"
            />
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes strip-scroll-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes strip-scroll-down {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function WelcomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Image Strips - Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 opacity-30">
          <AnimatedImageStrip images={WELCOME_IMAGES} direction="up" speed={25} offset={0} />
        </div>
        
        <div className="absolute top-1/4 left-0 right-0 opacity-20">
          <AnimatedImageStrip images={WELCOME_IMAGES} direction="down" speed={30} offset={2} />
        </div>
        
        <div className="absolute top-1/2 left-0 right-0 opacity-25">
          <AnimatedImageStrip images={WELCOME_IMAGES} direction="up" speed={22} offset={4} />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 opacity-15">
          <AnimatedImageStrip images={WELCOME_IMAGES} direction="down" speed={28} offset={1} />
        </div>
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
              className="block w-full bg-[var(--primary)] text-white font-semibold py-3.5 rounded-xl transition-colors hover:bg-[var(--primary-hover)]"
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
