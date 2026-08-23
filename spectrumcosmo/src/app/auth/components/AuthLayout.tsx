'use client';

import { useState, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';

const desktopSlides = [
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714751/b9b5c0ea33a39be2b0aa420ba5d665ce.webp_n59npa.webp',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714751/f09477c9aef7e70ff0a559489fac4dcd_mffof9.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714751/d06ebcc93b8c82b1af5eaeb992d8113f_jy0lt0.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714750/a8695ea4a7d8d41af342b506893c8f66_hqawc8.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714750/7d489dc0932a70d5c13a49eb6a04b3d5.webp_ic8mhb.webp',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1784714750/d98193c851d049a19cf7de400ec47132_fepxrd.jpg'
];

const MANGA_BG = 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1783775798/9b8e69a00494ab278c6f3f1e8d1a4f0c_vkjyhx.jpg';

const LOGOS = {
  light: {
    svg: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426888/spectrumcosmo_mark_black_fahcqs.svg',
    png: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426890/spectrumcosmo_mark_black_1024px_cwui04.png',
  },
  dark: {
    svg: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426887/spectrumcosmo_mark_white_lnavri.svg',
    png: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1787426888/spectrumcosmo_mark_white_1024px_mppdiq.png',
  },
};

interface AuthLayoutProps {
  children: ReactNode;
  isDark: boolean;
}

export default function AuthLayout({ children, isDark }: AuthLayoutProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % desktopSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const LogoImage = ({ className, alt = "SpectrumCosmo" }: { className?: string; alt?: string }) => {
    const logo = isDark ? LOGOS.dark : LOGOS.light;
    return (
      <img
        src={logo.svg}
        alt={alt}
        className={className}
        onError={(e) => {
          e.currentTarget.src = logo.png;
        }}
        style={{
          display: 'block',
          width: 'auto',
          height: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        }}
      />
    );
  };

  const BrandName = ({ className = '', textClassName = '' }: { className?: string; textClassName?: string }) => (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-8 sm:h-10">
        <LogoImage className="h-full w-auto" />
      </div>
      <span className={`font-bold tracking-tight ${textClassName}`}>
        <span className={isDark ? 'text-white' : 'text-gray-900'}>SPECTRUM</span>
        <span className="text-orange-500">COSMO</span>
      </span>
    </div>
  );

  if (isDesktop) {
    return (
      <div className="flex h-screen overflow-hidden bg-black">
        <div className="relative flex-[3] bg-black overflow-hidden">
          {desktopSlides.map((img, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                i === index ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div 
                className="absolute inset-0 bg-center bg-cover" 
                style={{ backgroundImage: `url(${img})` }} 
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-black/60" />

          <div className="relative h-full flex flex-col justify-center px-10 z-10">
            <div className="mb-6">
              <BrandName textClassName="text-2xl" />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-white max-w-md"
            >
              <h1 className="text-4xl font-bold mb-3 leading-tight">
                Welcome to the
                <br />
                <span className="text-orange-400">anime marketplace</span>
              </h1>
              <p className="text-gray-300 text-base mb-6 leading-relaxed">
                Sign in to access exclusive anime merch, track orders, and connect with fellow fans.
              </p>
            </motion.div>

            <div className="absolute bottom-8 left-10 flex gap-1.5">
              {desktopSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === index
                      ? 'w-6 bg-orange-500'
                      : 'w-1.5 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div 
          className="relative flex-[2] flex items-center justify-center p-6 overflow-hidden"
          style={{
            backgroundImage: `url(${MANGA_BG})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className={`absolute inset-0 ${isDark ? 'bg-black/70' : 'bg-white/80'}`} />
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative z-10 w-full max-w-sm"
          >
            <div className={`rounded-2xl p-6 shadow-2xl ${
              isDark 
                ? 'bg-gray-900/95 backdrop-blur-sm border border-gray-800' 
                : 'bg-white/95 backdrop-blur-sm border border-gray-200'
            }`}>
              {children}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen flex items-center justify-center px-3 relative overflow-hidden"
      style={{
        backgroundImage: `url(${MANGA_BG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className={`absolute inset-0 ${isDark ? 'bg-black/70' : 'bg-white/80'}`} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="text-center mb-3">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block"
          >
            <div className="flex items-center justify-center gap-1.5">
              <div className="h-7 w-auto">
                <LogoImage className="h-full w-auto" />
              </div>
              <span className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                SPECTRUM<span className="text-orange-500">COSMO</span>
              </span>
            </div>
          </motion.div>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Welcome to the anime marketplace
          </p>
        </div>

        <div className={`rounded-2xl p-4 shadow-xl ${
          isDark 
            ? 'bg-gray-900/80 backdrop-blur-xl border border-gray-800' 
            : 'bg-white/95 backdrop-blur-xl border border-gray-200'
        }`}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
