'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Shield, Truck, Star,
  ShoppingBag, Zap, CheckCircle,
  CreditCard, Headphones, Send, Shirt,
  Heart, Plus, ChevronLeft, ChevronRight,
  RefreshCw, Lock, Palette, Sparkles
} from 'lucide-react';
import EventAnnouncementBar from '@/components/storefront/EventAnnouncementBar';
import CategoriesSection from '@/components/storefront/CategoriesSection';
import HeroImageMarquee from '@/components/storefront/HeroImageMarquee';
import FeaturedProducts from '@/components/storefront/FeaturedProducts';
import HomepagePopup from '@/components/storefront/HomepagePopup';
import RecentlyViewed from '@/components/storefront/RecentlyViewed';
import ContinueShopping from '@/components/storefront/ContinueShopping';
import FirstLaunchGuard from '@/components/FirstLaunchGuard';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface HeroSection {
  id: string;
  badge_text: string;
  badge_link: string;
  heading_prefix: string;
  highlighted_word: string;
  description: string;
  button1_text: string;
  button1_link: string;
  feature1: string;
  feature2: string;
  feature3: string;
  cat_image1_url: string;
  cat_image1_alt: string;
  cat_image2_url: string;
  cat_image2_alt: string;
  cat_image3_url: string;
  cat_image3_alt: string;
  cat_image4_url: string;
  cat_image4_alt: string;
  bg_image_url?: string;
  bg_image_url_dark?: string;
}

interface HeroSlide {
  label: string;
  heading_prefix: string;
  highlighted_word: string;
  trailing: string;
  description: string;
  cta_text: string;
  cta_link: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price?: number;
  image_url: string;
  status: string;
  created_at: Date;
  category?: string;
  rating?: number;
  review_count?: number;
  badge?: 'new' | 'best-seller' | 'low-stock' | null;
}

interface Review {
  id: string;
  customer_name: string;
  user_name?: string;
  name?: string;
  review_text: string;
  comment?: string;
  rating: number;
}

interface Category {
  id: string;
  name: string;
  image_url: string | null;
}

/* ------------------------------------------------------------------ */
/* Fallbacks                                                           */
/* ------------------------------------------------------------------ */

const fallbackHero: HeroSection = {
  id: 'fallback',
  badge_text: 'Trending Now',
  badge_link: '/products',
  heading_prefix: 'Style that fits',
  highlighted_word: 'your vibe',
  description:
    'Quality clothing. Modern styles. Made for everyday you — custom apparel and anime merchandise handcrafted for those who live boldly.',
  button1_text: 'Shop Now',
  button1_link: '/products',
  feature1: 'Quality Guaranteed',
  feature2: 'Fast Shipping',
  feature3: 'Unique Designs',
  cat_image1_url:
    'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_16.15.36_ubl2ww.jpg',
  cat_image1_alt: 'T-Shirt collection',
  cat_image2_url:
    'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-04_at_23.58.16_a0z7ns.jpg',
  cat_image2_alt: 'Hoodie collection',
  cat_image3_url:
    'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.34_c2lzfq.jpg',
  cat_image3_alt: 'Pendant collection',
  cat_image4_url:
    'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.16_rkdwvc.jpg',
  cat_image4_alt: 'Bracelet collection',
  bg_image_url: '',
  bg_image_url_dark: '',
};

const extraHeroSlides: HeroSlide[] = [
  {
    label: 'New Collection',
    heading_prefix: 'Fresh drops.',
    highlighted_word: 'Same energy.',
    trailing: '',
    description:
      'New tees, hoodies and accessories just landed. Limited runs — once they are gone, they are gone.',
    cta_text: 'Shop New Arrivals',
    cta_link: '/products?sort=newest',
  },
  {
    label: 'Seasonal Sale',
    heading_prefix: 'Up to',
    highlighted_word: '40% off',
    trailing: 'this season.',
    description:
      'Selected hoodies, jackets and accessories at reduced prices while stock lasts.',
    cta_text: 'Shop the Sale',
    cta_link: '/products?sale=true',
  },
  {
    label: 'Custom Orders',
    heading_prefix: 'Your design.',
    highlighted_word: 'Our quality.',
    trailing: '',
    description:
      'Custom apparel made to your spec — sizes, colours, prints and bulk orders welcome.',
    cta_text: 'Request a Quote',
    cta_link: '/custom-orders',
  },
];

const fallbackMarqueeImages = [
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_16.15.36_ubl2ww.jpg',
    alt: 'T-Shirts',
    category: 'T-Shirts',
  },
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-04_at_23.58.16_a0z7ns.jpg',
    alt: 'Hoodies',
    category: 'Hoodies',
  },
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.34_c2lzfq.jpg',
    alt: 'Accessories',
    category: 'Accessories',
  },
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.16_rkdwvc.jpg',
    alt: 'Anime Jerseys',
    category: 'Anime Jerseys',
  },
];

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const marqueeStyles = `
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .animate-marquee {
    animation: marquee 25s linear infinite;
    will-change: transform;
  }
  .hover\\:animation-pause:hover {
    animation-play-state: paused;
  }
  @keyframes heroFade {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .hero-fade { animation: heroFade 0.5s ease-out both; }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

function HomePageSkeleton() {
  return (
    <main>
      <section className="relative min-h-[70vh] md:min-h-[88vh] flex items-center bg-[var(--background)] overflow-x-hidden py-8 md:py-12">
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-start lg:items-center">
            <div className="text-center lg:text-left w-full min-w-0">
              <div className="h-7 w-32 bg-[var(--background-card)] rounded-full animate-pulse mx-auto lg:mx-0 mb-5" />
              <div className="h-12 md:h-16 bg-[var(--background-card)] rounded-lg animate-pulse w-full mb-3" />
              <div className="h-12 md:h-16 bg-[var(--background-card)] rounded-lg animate-pulse w-2/3 mx-auto lg:mx-0 mb-6" />
              <div className="h-5 bg-[var(--background-card)] rounded-lg animate-pulse w-full max-w-lg mx-auto lg:mx-0 mb-8" />
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-8">
                <div className="h-12 w-40 bg-[var(--background-card)] rounded-full animate-pulse" />
                <div className="h-12 w-40 bg-[var(--background-card)] rounded-full animate-pulse" />
              </div>
            </div>
            <div className="mt-6 lg:mt-0 overflow-hidden w-full max-w-full">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-square bg-[var(--background-card)] rounded-xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-[var(--background-secondary)] py-3 border-y border-[var(--border)]">
        <div className="flex justify-around max-w-7xl mx-auto px-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-6 w-32 bg-[var(--background-card)] rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>

      {[1, 2].map((section) => (
        <div
          key={section}
          className="bg-[var(--background-card)] py-10 md:py-16 border-b border-[var(--border)]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 md:mb-12">
              <div className="h-3 w-28 bg-[var(--background-secondary)] rounded-full animate-pulse mb-3" />
              <div className="h-8 w-56 bg-[var(--background-secondary)] rounded-lg animate-pulse" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-[var(--background-secondary)] rounded-xl mb-3" />
                  <div className="h-3 bg-[var(--background-secondary)] rounded w-1/3 mb-2" />
                  <div className="h-4 bg-[var(--background-secondary)] rounded w-3/4 mb-2" />
                  <div className="h-4 bg-[var(--background-secondary)] rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <div className="bg-[var(--background-secondary)] py-14 md:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="h-10 w-64 bg-[var(--background-card)] rounded-lg animate-pulse mx-auto mb-4" />
          <div className="h-5 w-80 bg-[var(--background-card)] rounded-lg animate-pulse mx-auto mb-8" />
          <div className="h-12 w-48 bg-[var(--background-card)] rounded-full animate-pulse mx-auto" />
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  href = '/products',
  linkLabel = 'View All',
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 md:mb-10">
      <div className="min-w-0">
        <span className="inline-block text-[var(--burnt-orange)] text-[11px] md:text-xs font-kanit font-bold uppercase tracking-[0.18em] mb-1.5">
          {eyebrow}
        </span>
        <h2 className="manga-subtitle text-2xl md:text-3xl lg:text-4xl text-[var(--foreground)] leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="font-body text-sm md:text-base text-[var(--foreground-muted)] mt-2 max-w-xl">
            {subtitle}
          </p>
        )}
      </div>
      <Link
        href={href}
        className="group hidden sm:inline-flex items-center gap-1.5 shrink-0 font-heading font-semibold text-sm text-[var(--foreground-muted)] hover:text-[var(--burnt-orange)] transition-colors pb-1"
      >
        {linkLabel}
        <ArrowRight
          size={16}
          className="group-hover:translate-x-1 transition-transform"
        />
      </Link>
    </div>
  );
}

function TrustBar() {
  const trustItems = [
    { icon: CheckCircle, text: '100% Authentic Products' },
    { icon: Truck, text: 'Free Shipping Over 50,000 MWK' },
    { icon: CreditCard, text: 'Secure Payments' },
    { icon: Headphones, text: '24/7 Customer Support' },
    { icon: Shield, text: 'Buyer Protection' },
    { icon: Zap, text: 'Fast Delivery' },
  ];
  const doubledItems = [...trustItems, ...trustItems];
  return (
    <div className="bg-[var(--background-secondary)] text-[var(--foreground)] overflow-hidden py-3 border-y border-[var(--border)]">
      <div className="relative w-full">
        <div
          className="flex whitespace-nowrap animate-marquee hover:animation-pause"
          style={{ animation: 'marquee 25s linear infinite' }}
        >
          {doubledItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-2 mx-6 text-xs md:text-sm font-medium font-body"
              >
                <Icon
                  size={15}
                  className="text-[var(--burnt-orange)] flex-shrink-0"
                />
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero carousel                                                       */
/* ------------------------------------------------------------------ */

function HeroCarousel({
  slides,
  images,
  features,
}: {
  slides: HeroSlide[];
  images: { url: string; alt: string; category: string }[];
  features: string[];
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      6500
    );
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[index];
  const go = (dir: number) =>
    setIndex((i) => (i + dir + slides.length) % slides.length);

  return (
    <section className="relative min-h-[68vh] md:min-h-[88vh] flex items-center bg-[var(--background)] overflow-x-hidden manga-bg hero-manga py-6 md:py-10">
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-start lg:items-center">
          {/* Copy column */}
          <div className="text-center lg:text-left w-full min-w-0">
            <div key={index} className="hero-fade">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--background-card)]/70 backdrop-blur-sm text-[11px] md:text-xs font-kanit font-bold uppercase tracking-[0.14em] text-[var(--foreground-muted)] mb-4 md:mb-6">
                <Sparkles size={13} className="text-[var(--burnt-orange)]" />
                {slide.label}
              </span>

              <h1 className="manga-title text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[var(--foreground)] leading-[1.1] mb-4 md:mb-6 tracking-tight">
                <span>{slide.heading_prefix}</span>{' '}
                <span className="text-[var(--burnt-orange)] font-black-han">
                  {slide.highlighted_word}
                </span>
                {slide.trailing ? <span> {slide.trailing}</span> : null}
              </h1>

              <p className="font-kanit text-sm sm:text-base md:text-lg text-[var(--foreground-muted)] leading-relaxed max-w-lg mx-auto lg:mx-0 mb-6 md:mb-8">
                {slide.description}
              </p>

              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Link
                  href={slide.cta_link}
                  className="btn-primary font-anton tracking-wider"
                >
                  {slide.cta_text}
                  <ArrowRight
                    size={17}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
                <Link
                  href="#categories"
                  className="btn-secondary font-kanit font-bold"
                >
                  Browse Categories
                  <ShoppingBag size={17} />
                </Link>
              </div>
            </div>

            {/* Feature strip */}
            <div className="flex flex-wrap gap-x-5 gap-y-3 justify-center lg:justify-start mt-8 md:mt-12 pt-6 md:pt-8 border-t border-[var(--border)]">
              {features.map((feature, i) => {
                const icons = [Shield, Truck, Shirt];
                const Icon = icons[i % icons.length];
                return (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-[var(--foreground-muted)] whitespace-nowrap font-body"
                  >
                    <Icon
                      size={16}
                      className="text-[var(--burnt-orange)] flex-shrink-0"
                    />
                    <span className="text-xs sm:text-sm">{feature}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual column */}
          <div className="mt-6 lg:mt-0 overflow-hidden w-full max-w-full">
            <div className="relative -mx-4 sm:mx-0 px-4 sm:px-0">
              <HeroImageMarquee images={images} />
            </div>
          </div>
        </div>

        {/* Slide controls */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center lg:justify-start gap-4 mt-8 md:mt-10">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous promotion"
              className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--background-card)]/70 backdrop-blur-sm flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--burnt-orange)] hover:border-[var(--burnt-orange)]/50 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.label + i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index
                      ? 'w-7 bg-[var(--burnt-orange)]'
                      : 'w-1.5 bg-[var(--border)] hover:bg-[var(--foreground-muted)]'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next promotion"
              className="w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--background-card)]/70 backdrop-blur-sm flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--burnt-orange)] hover:border-[var(--burnt-orange)]/50 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Product card                                                        */
/* ------------------------------------------------------------------ */

function ProductCard({
  product,
  wishlisted,
  onToggleWishlist,
}: {
  product: Product;
  wishlisted: boolean;
  onToggleWishlist: (id: string) => void;
}) {
  const hasDiscount =
    !!product.compare_price && product.compare_price > product.price;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.compare_price! - product.price) / product.compare_price!) * 100
      )
    : 0;

  const badge =
    product.badge === 'best-seller'
      ? { text: 'Best Seller', className: 'bg-[var(--burnt-orange)] text-white' }
      : product.badge === 'new'
      ? { text: 'New', className: 'bg-[var(--foreground)] text-[var(--background)]' }
      : product.badge === 'low-stock'
      ? { text: 'Low Stock', className: 'bg-red-500 text-white' }
      : product.status === 'out_of_stock'
      ? { text: 'Sold Out', className: 'bg-[var(--foreground-muted)] text-[var(--background)]' }
      : null;

  const outOfStock = product.status === 'out_of_stock';

  return (
    <div className="group relative flex flex-col bg-[var(--background-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--burnt-orange)]/40 transition-colors duration-300">
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-[4/5] overflow-hidden bg-[var(--background-secondary)]"
      >
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
          className={`object-cover transition-transform duration-500 group-hover:scale-[1.04] ${
            outOfStock ? 'opacity-60' : ''
          }`}
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          {badge && (
            <span
              className={`px-2 py-1 rounded-md text-[10px] font-anton uppercase tracking-wider ${badge.className}`}
            >
              {badge.text}
            </span>
          )}
          {hasDiscount && (
            <span className="px-2 py-1 rounded-md text-[10px] font-anton uppercase tracking-wider bg-white text-[#111] border border-[var(--border)]">
              -{discountPct}%
            </span>
          )}
        </div>
      </Link>

      {/* Wishlist */}
      <button
        type="button"
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        onClick={() => onToggleWishlist(product.id)}
        className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center border border-[var(--border)] transition-transform active:scale-90"
      >
        <Heart
          size={16}
          className={
            wishlisted
              ? 'fill-[var(--burnt-orange)] text-[var(--burnt-orange)]'
              : 'text-[var(--foreground-muted)]'
          }
        />
      </button>

      <div className="flex flex-col gap-1.5 p-3 md:p-4 flex-1">
        {product.category && (
          <span className="text-[10px] md:text-[11px] font-kanit uppercase tracking-wider text-[var(--foreground-muted)]">
            {product.category}
          </span>
        )}

        <Link
          href={`/products/${product.id}`}
          className="font-heading font-semibold text-sm md:text-[15px] text-[var(--foreground)] leading-snug line-clamp-2 hover:text-[var(--burnt-orange)] transition-colors"
        >
          {product.name}
        </Link>

        {typeof product.rating === 'number' && (
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={11}
                  className={
                    i < Math.round(product.rating!)
                      ? 'fill-[var(--burnt-orange)] text-[var(--burnt-orange)]'
                      : 'text-[var(--border)]'
                  }
                />
              ))}
            </div>
            <span className="text-[11px] font-body text-[var(--foreground-muted)]">
              {product.rating.toFixed(1)}
              {product.review_count ? ` (${product.review_count})` : ''}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 mt-auto pt-1.5">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="font-anton text-base md:text-lg text-[var(--foreground)] whitespace-nowrap">
              MK {product.price.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="font-body text-xs text-[var(--foreground-muted)] line-through truncate">
                MK {product.compare_price!.toLocaleString()}
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label="Add to cart"
            disabled={outOfStock}
            className="w-9 h-9 shrink-0 rounded-full bg-[var(--burnt-orange)] text-white flex items-center justify-center transition-transform active:scale-90 disabled:opacity-40 disabled:active:scale-100"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Promotional banner                                                  */
/* ------------------------------------------------------------------ */

function PromoBanner({
  image,
  eyebrow,
  title,
  highlight,
  description,
  ctaText,
  ctaLink,
  reverse = false,
  dark = false,
}: {
  image: string;
  eyebrow: string;
  title: string;
  highlight?: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  reverse?: boolean;
  dark?: boolean;
}) {
  return (
    <section
      className={`relative overflow-hidden ${
        dark ? 'bg-[#111111]' : 'bg-[var(--background-secondary)]'
      }`}
    >
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 items-stretch">
        <div
          className={`relative min-h-[220px] sm:min-h-[280px] md:min-h-[400px] ${
            reverse ? 'md:order-2' : ''
          }`}
        >
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 md:px-14 md:py-16">
          <span className="inline-block text-[var(--burnt-orange)] text-[11px] md:text-xs font-kanit font-bold uppercase tracking-[0.18em] mb-3">
            {eyebrow}
          </span>
          <h3
            className={`manga-display text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4 ${
              dark ? 'text-[#F5F5F5]' : 'text-[var(--foreground)]'
            }`}
          >
            {title}{' '}
            {highlight && (
              <span className="text-[var(--burnt-orange)] font-black-han">
                {highlight}
              </span>
            )}
          </h3>
          <p
            className={`font-body text-sm md:text-base mb-7 max-w-md ${
              dark ? 'text-[#9A9A9A]' : 'text-[var(--foreground-muted)]'
            }`}
          >
            {description}
          </p>
          <Link
            href={ctaLink}
            className="btn-primary font-anton tracking-wider self-start"
          >
            {ctaText}
            <ArrowRight
              size={17}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Service benefits                                                    */
/* ------------------------------------------------------------------ */

function ServiceBenefits() {
  const benefits = [
    {
      icon: Lock,
      title: 'Secure Payments',
      text: 'Safe & trusted checkout',
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      text: 'Across Malawi',
    },
    {
      icon: RefreshCw,
      title: 'Easy Returns',
      text: 'Hassle-free returns',
    },
    {
      icon: Headphones,
      title: 'Customer Support',
      text: "We're here to help",
    },
  ];

  return (
    <section className="bg-[var(--background-card)] py-10 md:py-16 border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3"
              >
                <div className="w-11 h-11 shrink-0 rounded-full bg-[var(--burnt-orange)]/10 flex items-center justify-center">
                  <Icon size={19} className="text-[var(--burnt-orange)]" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-sm text-[var(--foreground)]">
                    {b.title}
                  </p>
                  <p className="font-body text-xs text-[var(--foreground-muted)] mt-0.5">
                    {b.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Homepage content                                                    */
/* ------------------------------------------------------------------ */

function HomePageContent() {
  const [hero, setHero] = useState<HeroSection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState('');
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/homepage-data');
        const data = await response.json();

        if (response.ok) {
          setHero(data.hero);
          setProducts(data.products ?? []);
          setReviews(data.reviews ?? []);
          setCategories(data.categories ?? []);
        } else {
          console.error('API error:', data.error);
        }
      } catch (error) {
        console.error('Failed to fetch homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNewsletterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const emailInput = form.elements.namedItem('email') as HTMLInputElement;
    const email = emailInput?.value || '';
    if (!email) return;

    setSubscribing(true);
    setSubscribeMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok) {
        setSubscribeMessage('Subscribed successfully!');
        form.reset();
      } else {
        setSubscribeMessage(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setSubscribeMessage('Network error. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return <HomePageSkeleton />;
  }

  const h = hero || fallbackHero;

  const marqueeImages =
    categories && categories.length > 0
      ? categories
          .filter((cat) => cat.image_url)
          .map((cat) => ({
            url: cat.image_url as string,
            alt: cat.name,
            category: cat.name,
          }))
      : fallbackMarqueeImages;

  const heroSlides: HeroSlide[] = [
    {
      label: h.badge_text || 'Trending Now',
      heading_prefix: h.heading_prefix,
      highlighted_word: h.highlighted_word,
      trailing: 'with pride.',
      description: h.description,
      cta_text: h.button1_text,
      cta_link: h.button1_link,
    },
    ...extraHeroSlides,
  ];

  const heroFeatures = [h.feature1, h.feature2, h.feature3].filter(Boolean);

  const bestSellers = products.slice(0, 8);
  const newArrivalsImage =
    marqueeImages[1]?.url ?? fallbackMarqueeImages[1].url;
  const collectionImage = marqueeImages[0]?.url ?? fallbackMarqueeImages[0].url;
  const customImage = marqueeImages[2]?.url ?? fallbackMarqueeImages[2].url;

  return (
    <>
      <FirstLaunchGuard />
      <style>{marqueeStyles}</style>
      <EventAnnouncementBar />

      {/* Bottom-nav clearance on mobile */}
      <main className="pb-20 md:pb-0">
        {/* ---------------------------------------------------------- */}
        {/* 1. Hero                                                    */}
        {/* ---------------------------------------------------------- */}
        <HeroCarousel
          slides={heroSlides}
          images={marqueeImages}
          features={heroFeatures}
        />

        <TrustBar />

        {/* ---------------------------------------------------------- */}
        {/* 2. Shop by category                                        */}
        {/* ---------------------------------------------------------- */}
        <section
          id="categories"
          className="bg-[var(--background-card)] py-10 md:py-16 manga-bg cards-manga scroll-mt-20"
        >
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Browse"
              title="Shop by Category"
              subtitle="Find the perfect piece that matches your style and passion."
              href="/categories"
            />
            <CategoriesSection />
            <Link
              href="/categories"
              className="sm:hidden mt-6 inline-flex items-center gap-1.5 font-heading font-semibold text-sm text-[var(--burnt-orange)]"
            >
              View All Categories
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 3. Featured products                                       */}
        {/* ---------------------------------------------------------- */}
        <section
          id="featured"
          className="bg-[var(--background-secondary)] py-10 md:py-16 scroll-mt-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Trending Now"
              title="Featured Products"
              subtitle="Handpicked items our customers love."
              href="/products?sort=featured"
            />
            <FeaturedProducts />
            <Link
              href="/products?sort=featured"
              className="sm:hidden mt-6 inline-flex items-center gap-1.5 font-heading font-semibold text-sm text-[var(--burnt-orange)]"
            >
              View All Products
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 4. New arrivals banner                                     */}
        {/* ---------------------------------------------------------- */}
        <PromoBanner
          image={newArrivalsImage}
          eyebrow="Just Landed"
          title="New"
          highlight="Arrivals"
          description="Fresh drops. Same energy. New tees, hoodies and accessories added weekly — limited runs only."
          ctaText="Explore Collection"
          ctaLink="/products?sort=newest"
        />

        {/* ---------------------------------------------------------- */}
        {/* 5. Best sellers                                            */}
        {/* ---------------------------------------------------------- */}
        <section className="bg-[var(--background-card)] py-10 md:py-16 border-t border-[var(--border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Customer Favourites"
              title="Best Sellers"
              subtitle="The pieces everyone keeps coming back for."
              href="/products?sort=best-sellers"
            />
          </div>

          {bestSellers.length > 0 ? (
            <>
              {/* Mobile: swipeable rail */}
              <div className="md:hidden">
                <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 pb-2">
                  {bestSellers.map((product) => (
                    <div
                      key={product.id}
                      className="snap-start shrink-0 w-[46%] max-w-[190px]"
                    >
                      <ProductCard
                        product={{ ...product, badge: product.badge ?? 'best-seller' }}
                        wishlisted={wishlist.has(product.id)}
                        onToggleWishlist={toggleWishlist}
                      />
                    </div>
                  ))}
                  <div className="snap-start shrink-0 w-8" aria-hidden />
                </div>
              </div>

              {/* Desktop: grid */}
              <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {bestSellers.slice(0, 4).map((product) => (
                    <ProductCard
                      key={product.id}
                      product={{ ...product, badge: product.badge ?? 'best-seller' }}
                      wishlisted={wishlist.has(product.id)}
                      onToggleWishlist={toggleWishlist}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="rounded-xl border border-dashed border-[var(--border)] py-12 text-center">
                <p className="font-body text-sm text-[var(--foreground-muted)]">
                  Best sellers will appear here once orders start rolling in.
                </p>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <Link
              href="/products?sort=best-sellers"
              className="inline-flex items-center gap-1.5 font-heading font-semibold text-sm text-[var(--burnt-orange)]"
            >
              View All Best Sellers
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 6. Custom orders                                           */}
        {/* ---------------------------------------------------------- */}
        <section className="bg-[var(--background-secondary)] py-10 md:py-16 border-y border-[var(--border)] manga-bg hero-manga">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
              <div className="relative aspect-[4/3] lg:aspect-[5/4] rounded-2xl overflow-hidden border border-[var(--border)]">
                <Image
                  src={customImage}
                  alt="Custom apparel orders"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              <div>
                <span className="inline-flex items-center gap-2 text-[var(--burnt-orange)] text-[11px] md:text-xs font-kanit font-bold uppercase tracking-[0.18em] mb-3">
                  <Palette size={14} />
                  Made For You
                </span>

                <h2 className="manga-display text-3xl sm:text-4xl lg:text-5xl text-[var(--foreground)] leading-tight mb-4">
                  Custom Orders
                </h2>

                <p className="font-body text-[var(--foreground-muted)] text-sm md:text-base mb-6 max-w-lg">
                  Your design. Our quality. Tell us the garment, size, colour,
                  quantity and artwork — we handle the rest.
                </p>

                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mb-8">
                  {[
                    'Any garment type',
                    'Your sizes & colours',
                    'Upload your artwork',
                    'Bulk & team orders',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 font-body text-sm text-[var(--foreground-muted)]"
                    >
                      <CheckCircle
                        size={15}
                        className="text-[var(--burnt-orange)] shrink-0"
                      />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/custom-orders"
                    className="btn-primary font-anton tracking-wider"
                  >
                    Request Now
                    <ArrowRight
                      size={17}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </Link>
                  <Link
                    href="/contact"
                    className="btn-secondary font-kanit font-bold"
                  >
                    Talk to Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 7. Collection / sale banner                                */}
        {/* ---------------------------------------------------------- */}
        <PromoBanner
          image={collectionImage}
          eyebrow="Limited Stock"
          title="Seasonal"
          highlight="Sale"
          description="Selected hoodies, jackets and accessories at reduced prices. While stock lasts — no restocks."
          ctaText="Shop the Sale"
          ctaLink="/products?sale=true"
          reverse
          dark
        />

        {/* ---------------------------------------------------------- */}
        {/* 8. Testimonials                                            */}
        {/* ---------------------------------------------------------- */}
        {reviews && reviews.length > 0 && (
          <section className="bg-[var(--background)] py-10 md:py-16 border-y border-[var(--border)] manga-bg hero-manga">
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionHeading
                eyebrow="Testimonials"
                title="What Our Customers Say"
                subtitle="Join thousands of happy customers who love their SpectrumCosmo gear."
                href="/reviews"
                linkLabel="Read All"
              />

              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                {reviews.slice(0, 3).map((review, idx) => (
                  <div
                    key={idx}
                    className="bg-[var(--background-card)] rounded-2xl p-5 md:p-6 border border-[var(--border)] hover:border-[var(--burnt-orange)]/40 transition-colors duration-300"
                  >
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < (review.rating || 5)
                              ? 'fill-[var(--burnt-orange)] text-[var(--burnt-orange)]'
                              : 'text-[var(--border)]'
                          }
                        />
                      ))}
                    </div>

                    <p className="font-body text-[var(--foreground-muted)] text-sm leading-relaxed">
                      &ldquo;
                      {review.review_text ||
                        review.comment ||
                        'Amazing quality! The design is perfect.'}
                      &rdquo;
                    </p>

                    <div className="mt-5 flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--burnt-orange)]/10 rounded-full flex items-center justify-center">
                        <span className="text-[var(--burnt-orange)] font-anton">
                          {(
                            review.customer_name ||
                            review.user_name ||
                            review.name ||
                            'A'
                          ).charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-heading font-semibold text-[var(--foreground)] text-sm">
                          {review.customer_name ||
                            review.user_name ||
                            review.name ||
                            'Verified Buyer'}
                        </p>
                        <p className="font-body text-xs text-[var(--foreground-muted)]">
                          Verified Purchase
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ---------------------------------------------------------- */}
        {/* 9. Recently viewed                                         */}
        {/* ---------------------------------------------------------- */}
        <section className="bg-[var(--background-card)] py-10 md:py-16 manga-bg cards-manga">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RecentlyViewed />
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 10. Service benefits                                       */}
        {/* ---------------------------------------------------------- */}
        <ServiceBenefits />

        {/* ---------------------------------------------------------- */}
        {/* 11. Newsletter                                             */}
        {/* ---------------------------------------------------------- */}
        <section className="bg-[#111111] py-14 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="manga-display text-3xl md:text-4xl text-[#F5F5F5] mb-4">
              Stay in the Loop
            </h2>
            <p className="font-body text-[#9A9A9A] mb-8 max-w-lg mx-auto text-sm md:text-base">
              Get updates about new drops, promotions and collections delivered
              to your inbox.
            </p>

            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto w-full"
            >
              <input
                type="email"
                name="email"
                placeholder="Your email address"
                aria-label="Email address"
                className="font-body w-full sm:flex-1 px-5 py-3.5 rounded-full bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)] focus:border-transparent transition-all min-h-[48px]"
                required
                disabled={subscribing}
              />
              <button
                type="submit"
                className="btn-primary font-anton justify-center tracking-wider min-h-[48px]"
                disabled={subscribing}
              >
                {subscribing ? 'Subscribing…' : 'Subscribe'}
                <Send size={16} />
              </button>
            </form>

            {subscribeMessage && (
              <p
                className={`font-body text-sm mt-4 ${
                  subscribeMessage.includes('successfully')
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                {subscribeMessage}
              </p>
            )}

            <p className="font-body text-[var(--foreground-muted)] text-xs mt-4">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 12. Final CTA                                              */}
        {/* ---------------------------------------------------------- */}
        <section className="bg-[var(--background-secondary)] py-16 lg:py-24 border-y border-[var(--border)] manga-bg hero-manga">
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <h2 className="manga-display text-3xl sm:text-4xl lg:text-5xl text-[var(--foreground)] mb-5">
              Ready to wear your{' '}
              <span className="text-[var(--burnt-orange)] font-black-han">
                excitement?
              </span>
            </h2>
            <p className="font-body text-[var(--foreground-muted)] text-base md:text-lg mb-9 max-w-xl mx-auto">
              Browse our full collection and find the piece that speaks to your
              passion.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/products"
                className="btn-primary font-anton tracking-wider"
              >
                Explore Products
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/reviews/submit"
                className="btn-secondary font-kanit font-bold"
              >
                Share Your Story
              </Link>
            </div>
          </div>
        </section>
      </main>

      <HomepagePopup />
      <ContinueShopping />
    </>
  );
}

export default function HomePage() {
  return <HomePageContent />;
}
