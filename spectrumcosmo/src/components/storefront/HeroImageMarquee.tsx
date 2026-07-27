// components/storefront/HeroImageMarquee.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import CategoryPopup from './CategoryPopup';

interface MarqueeImage {
  url: string;
  alt: string;
  category: string;
}

interface HeroImageMarqueeProps {
  images: MarqueeImage[];
}

export default function HeroImageMarquee({ images }: HeroImageMarqueeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [images.length]);

  const handleImageClick = (category: string, url: string) => {
    setSelectedCategory(category);
    setSelectedImage(url);
  };

  const handleClosePopup = () => {
    setSelectedCategory(null);
    setSelectedImage(null);
  };

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="relative w-full overflow-hidden">
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleImageClick(image.category, image.url)}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out cursor-pointer ${
                index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
              aria-label={`View ${image.category}`}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </button>
          ))}
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {selectedCategory && selectedImage && (
        <CategoryPopup
          category={selectedCategory}
          imageUrl={selectedImage}
          onClose={handleClosePopup}
        />
      )}
    </>
  );
}
