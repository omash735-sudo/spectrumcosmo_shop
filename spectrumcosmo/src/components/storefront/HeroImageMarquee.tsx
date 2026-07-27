// components/storefront/HeroImageMarquee.tsx
'use client';

import { useState } from 'react';
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

const marqueeKeyframes = `
  @keyframes scrollUp {
    from { transform: translateY(0); }
    to { transform: translateY(-50%); }
  }
  @keyframes scrollDown {
    from { transform: translateY(-50%); }
    to { transform: translateY(0); }
  }
  @keyframes scrollLeft {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  @keyframes scrollRight {
    from { transform: translateX(-50%); }
    to { transform: translateX(0); }
  }
  .marquee-col-a { animation: scrollUp 22s linear infinite; }
  .marquee-col-b { animation: scrollDown 22s linear infinite; }
  .marquee-row-a { animation: scrollLeft 18s linear infinite; }
  .marquee-row-b { animation: scrollRight 18s linear infinite; }
  .marquee-fade-vertical {
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent 0%,
      black 12%,
      black 88%,
      transparent 100%
    );
    mask-image: linear-gradient(
      to bottom,
      transparent 0%,
      black 12%,
      black 88%,
      transparent 100%
    );
  }
  .marquee-fade-horizontal {
    -webkit-mask-image: linear-gradient(
      to right,
      transparent 0%,
      black 8%,
      black 92%,
      transparent 100%
    );
    mask-image: linear-gradient(
      to right,
      transparent 0%,
      black 8%,
      black 92%,
      transparent 100%
    );
  }
  @media (prefers-reduced-motion: reduce) {
    .marquee-col-a, .marquee-col-b, .marquee-row-a, .marquee-row-b {
      animation: none;
    }
  }
`;

function Tile({ url, alt, category, onClick }: { 
  url: string; 
  alt: string; 
  category: string; 
  onClick: (category: string, url: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(category, url)}
      className="relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-2xl cursor-pointer group focus:outline-none"
      aria-label={`View ${category}`}
    >
      <Image 
        src={url} 
        alt={alt} 
        fill 
        sizes="200px" 
        className="object-cover transition-transform duration-500 group-hover:scale-105" 
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
    </button>
  );
}

export default function HeroImageMarquee({ images }: HeroImageMarqueeProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  const handleTileClick = (category: string, url: string) => {
    setSelectedCategory(category);
    setSelectedImage(url);
  };

  const handleClosePopup = () => {
    setSelectedCategory(null);
    setSelectedImage(null);
  };

  const colA = [images[0], images[1]].filter(Boolean);
  const colB = [images[2], images[3]].filter(Boolean);
  const doubledColA = [...colA, ...colA];
  const doubledColB = [...colB, ...colB];
  const doubledAll = [...images, ...images];

  return (
    <>
      <div className="relative">
        <style>{marqueeKeyframes}</style>

        <div className="hidden sm:grid grid-cols-2 gap-4 h-[420px] lg:h-[520px] overflow-hidden marquee-fade-vertical">
          <div className="flex flex-col gap-4 marquee-col-a">
            {doubledColA.map((img, i) => (
              <Tile
                key={`a-${i}`}
                url={img.url}
                alt={img.alt}
                category={img.category}
                onClick={handleTileClick}
              />
            ))}
          </div>
          <div className="flex flex-col gap-4 marquee-col-b">
            {doubledColB.map((img, i) => (
              <Tile
                key={`b-${i}`}
                url={img.url}
                alt={img.alt}
                category={img.category}
                onClick={handleTileClick}
              />
            ))}
          </div>
        </div>

        <div className="flex sm:hidden flex-col gap-3 overflow-hidden">
          <div className="flex gap-3 w-max marquee-row-a marquee-fade-horizontal">
            {doubledAll.map((img, i) => (
              <div key={`row1-${i}`} className="w-24 flex-shrink-0">
                <Tile
                  url={img.url}
                  alt={img.alt}
                  category={img.category}
                  onClick={handleTileClick}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 w-max marquee-row-b marquee-fade-horizontal">
            {doubledAll.map((img, i) => (
              <div key={`row2-${i}`} className="w-24 flex-shrink-0">
                <Tile
                  url={img.url}
                  alt={img.alt}
                  category={img.category}
                  onClick={handleTileClick}
                />
              </div>
            ))}
          </div>
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
