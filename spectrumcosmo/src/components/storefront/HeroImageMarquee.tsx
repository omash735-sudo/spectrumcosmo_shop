'use client';

import Image from 'next/image';

interface MarqueeImage {
  url: string;
  alt: string;
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
  @media (prefers-reduced-motion: reduce) {
    .marquee-col-a, .marquee-col-b, .marquee-row-a, .marquee-row-b {
      animation: none;
    }
  }
`;

function Tile({ url, alt }: MarqueeImage) {
  return (
    <div className="relative aspect-square w-full flex-shrink-0 rounded-2xl overflow-hidden">
      <Image src={url} alt={alt} fill sizes="200px" className="object-cover" />
    </div>
  );
}

export default function HeroImageMarquee({ images }: HeroImageMarqueeProps) {
  if (!images || images.length === 0) return null;

  const colA = [images[0], images[1]].filter(Boolean);
  const colB = [images[2], images[3]].filter(Boolean);
  const doubledColA = [...colA, ...colA];
  const doubledColB = [...colB, ...colB];
  const doubledAll = [...images, ...images];

  return (
    <div className="relative">
      <style>{marqueeKeyframes}</style>

      <div className="hidden sm:grid grid-cols-2 gap-4 h-[420px] lg:h-[520px] overflow-hidden">
        <div className="flex flex-col gap-4 marquee-col-a">
          {doubledColA.map((img, i) => (
            <Tile key={`a-${i}`} url={img.url} alt={img.alt} />
          ))}
        </div>
        <div className="flex flex-col gap-4 marquee-col-b">
          {doubledColB.map((img, i) => (
            <Tile key={`b-${i}`} url={img.url} alt={img.alt} />
          ))}
        </div>
      </div>

      <div className="flex sm:hidden flex-col gap-3 overflow-hidden">
        <div className="flex gap-3 w-max marquee-row-a">
          {doubledAll.map((img, i) => (
            <div key={`row1-${i}`} className="w-24 flex-shrink-0">
              <Tile url={img.url} alt={img.alt} />
            </div>
          ))}
        </div>
        <div className="flex gap-3 w-max marquee-row-b">
          {doubledAll.map((img, i) => (
            <div key={`row2-${i}`} className="w-24 flex-shrink-0">
              <Tile url={img.url} alt={img.alt} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
