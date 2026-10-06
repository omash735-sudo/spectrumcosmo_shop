'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ArrowRight, Shield, Truck, Star,
  ShoppingBag, CheckCircle, Send,
  Heart, Plus, Palette, Package, MessageCircle,
  Lock, CreditCard, Home, User,
} from 'lucide-react';
import EventAnnouncementBar from '@/components/storefront/EventAnnouncementBar';
import CategoriesSection from '@/components/storefront/CategoriesSection';
import FeaturedProducts from '@/components/storefront/FeaturedProducts';
import HomepagePopup from '@/components/storefront/HomepagePopup';
import RecentlyViewed from '@/components/storefront/RecentlyViewed';
import ContinueShopping from '@/components/storefront/ContinueShopping';
import FirstLaunchGuard from '@/components/FirstLaunchGuard';
import CurrencyPrice from '@/components/storefront/CurrencyPrice';
import { useCart } from '@/components/storefront/CartProvider';
import { useWishlist } from '@/components/storefront/WishlistProvider';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface HeroSection {
  id: string;
  badge_text: string;
  heading_prefix: string;
  highlighted_word: string;
  description: string;
  button1_text: string;
  button1_link: string;
  bg_image_url?: string;
  bg_image_url_dark?: string;
}

interface HeroSlide {
  badge: string;
  heading_prefix: string;
  highlighted_word: string;
  description: string;
  cta_text: string;
  cta_link: string;
  image: string;
}

interface Product {
  id: string;
  name: string;
  price: number; // MWK base
  compare_price?: number | null;
  image_url: string | null;
  status: string;
  created_at: string | Date;
  is_featured?: boolean;
  stock_quantity?: number;
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
/* Static assets                                                       */
/* ------------------------------------------------------------------ */

const HERO_FALLBACK_IMAGE =
  'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-04_at_23.58.16_a0z7ns.jpg';

const HERO_NEW_ARRIVALS_IMAGE =
  'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_16.15.36_ubl2ww.jpg';

const fallbackHero: HeroSection = {
  id: 'fallback',
  badge_text: 'Trending Now',
  heading_prefix: 'Style that',
  highlighted_word: 'fits your vibe',
  description:
    'Quality clothing. Modern styles. Made for everyday you. Custom apparel and pop-culture merchandise handcrafted in Malawi.',
  button1_text: 'Shop Now',
  button1_link: '/products',
  bg_image_url: HERO_FALLBACK_IMAGE,
  bg_image_url_dark: HERO_FALLBACK_IMAGE,
};

const promoBanners = [
  {
    eyebrow: 'New Arrivals',
    title: 'Fresh drops. Same energy.',
    description: 'New tees, hoodies and accessories added regularly.',
    cta: 'Explore Collection',
    href: '/products?sort=newest',
    image:
      'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-04_at_23.58.16_a0z7ns.jpg',
  },
  {
    eyebrow: 'Custom Orders',
    title: 'Your design. Our quality.',
    description:
      'Made to your spec — sizes, colours, prints and bulk orders.',
    cta: 'Request Now',
    href: '/custom-orders',
    image:
      'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_16.15.36_ubl2ww.jpg',
  },
];

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

function HomePageSkeleton() {
  return (
    <main>
      <section className="bg-[var(--background)] py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <div className="h-6 w-28 bg-[var(--background-card)] rounded-full animate-pulse mb-5" />
              <div className="h-10 md:h-14 bg-[var(--background-card)] rounded-lg animate-pulse w-full mb-3" />
              <div className="h-10 md:h-14 bg-[var(--background-card)] rounded-lg animate-pulse w-2/3 mb-6" />
              <div className="h-5 bg-[var(--background-card)] rounded-lg animate-pulse w-full max-w-md mb-6" />
              <div className="h-12 w-40 bg-[var(--background-card)] rounded-full animate-pulse" />
            </div>
            <div className="aspect-[4/3] lg:aspect-square bg-[var(--background-card)] rounded-2xl animate-pulse" />
          </div>
        </div>
      </section>

      <div className="bg-[var(--background-card)] py-10 md:py-16 border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-56 bg-[var(--background-secondary)] rounded-lg animate-pulse mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-[var(--background-secondary)] rounded-xl mb-2" />
                <div className="h-3 bg-[var(--background-secondary)] rounded w-2/3 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* SectionHeading                                                      */
/* ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  href,
  linkLabel = 'View All',
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
      <div className="min-w-0">
        {eyebrow && (
          <span className="inline-block text-[var(--primary)] text-[11px] md:text-xs font-kanit font-bold uppercase tracking-[0.18em] mb-1.5">
            {eyebrow}
          </span>
        )}
        <h2 className="font-anton text-2xl md:text-3xl lg:text-4xl text-[var(--foreground)] leading-tight tracking-wide uppercase">
          {title}
        </h2>
        {subtitle && (
          <p className="font-body text-sm md:text-base text-[var(--foreground-muted)] mt-2 max-w-xl">
            {subtitle}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="group hidden sm:inline-flex items-center gap-1.5 shrink-0 font-heading font-semibold text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors pb-1"
        >
          {linkLabel}
          <ArrowRight
            size={16}
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero — manual carousel                                              */
/* ------------------------------------------------------------------ */

function Hero({ hero }: { hero: HeroSection }) {
  // Two slides max — each slide is one image request.
  // Slide 1: brand hero (from /api/homepage-data, fallback in code)
  // Slide 2: New Arrivals campaign
  const slides: HeroSlide[] = [
    {
      badge: hero.badge_text || 'Trending Now',
      heading_prefix: hero.heading_prefix,
      highlighted_word: hero.highlighted_word,
      description: hero.description,
      cta_text: hero.button1_text || 'Shop Now',
      cta_link: hero.button1_link || '/products',
      image: hero.bg_image_url || HERO_FALLBACK_IMAGE,
    },
    {
      badge: 'New Arrivals',
      heading_prefix: 'Fresh drops,',
      highlighted_word: 'added regularly.',
      description:
        'New tees, hoodies and accessories added regularly. Explore the latest.',
      cta_text: 'Shop New Arrivals',
      cta_link: '/products?sort=newest',
      image: HERO_NEW_ARRIVALS_IMAGE,
    },
  ];

  const [index, setIndex] = useState(0);
  const slide = slides[index];

  return (
    <section className="relative bg-[var(--background)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center py-8 md:py-14 lg:py-16">
          {/* Copy */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--background-card)] text-[10px] md:text-xs font-kanit font-bold uppercase tracking-[0.16em] text-[var(--foreground-muted)] mb-4 md:mb-5">
              {slide.badge}
            </span>

            <h1 className="font-anton text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[var(--foreground)] leading-[1.05] tracking-wide uppercase mb-4 md:mb-5">
              {slide.heading_prefix}{' '}
              <span className="text-[var(--primary)]">
                {slide.highlighted_word}
              </span>
            </h1>

            <p className="font-body text-sm sm:text-base md:text-lg text-[var(--foreground-muted)] leading-relaxed max-w-md mx-auto lg:mx-0 mb-6 md:mb-7">
              {slide.description}
            </p>

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
          </div>

          {/* Image */}
          <div className="order-1 lg:order-2">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-square rounded-2xl overflow-hidden border border-[var(--border)]">
              <Image
                key={index}
                src={slide.image}
                alt="Featured collection"
                fill
                priority={index === 0}
                loading={index === 0 ? undefined : 'lazy'}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Dots */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-2 pb-6 md:pb-8 -mt-2 md:-mt-4">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === index
                    ? 'w-7 bg-[var(--primary)]'
                    : 'w-1.5 bg-[var(--border)] hover:bg-[var(--foreground-muted)]'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* HomeProductCard                                                     */
/* ------------------------------------------------------------------ */

function HomeProductCard({
  product,
  wishlisted,
  onToggleWishlist,
}: {
  product: Product;
  wishlisted: boolean;
  onToggleWishlist: (id: string) => void;
}) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const hasDiscount =
    typeof product.compare_price === 'number' &&
    product.compare_price > product.price;

  const discountPct = hasDiscount
    ? Math.round(
        ((product.compare_price! - product.price) / product.compare_price!) * 100
      )
    : 0;

  const outOfStock = product.status === 'out_of_stock';

  const handleAdd = () => {
    if (outOfStock) return;
    addItem({
      id: product.id,
      name: product.name,
      image_url: product.image_url ?? undefined,
      priceUsd: product.price,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div className="group relative flex flex-col bg-[var(--background-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--primary)]/40 transition-colors duration-300">
      <Link
        href={`/products?id=${product.id}`}
        className="relative block aspect-square overflow-hidden bg-[var(--background-secondary)]"
      >
        <Image
          src={product.image_url || '/placeholder-product.jpg'}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
          className={`object-cover transition-transform duration-500 group-hover:scale-[1.04] ${
            outOfStock ? 'opacity-60' : ''
          }`}
        />

        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          {outOfStock && (
            <span className="px-2 py-1 rounded-md text-[10px] font-anton uppercase tracking-wider bg-[var(--foreground-muted)] text-[var(--background)]">
              Sold Out
            </span>
          )}
          {hasDiscount && !outOfStock && (
            <span className="px-2 py-1 rounded-md text-[10px] font-anton uppercase tracking-wider bg-white text-[#111] border border-[var(--border)]">
              -{discountPct}%
            </span>
          )}
        </div>
      </Link>

      <button
        type="button"
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        onClick={(e) => {
          e.preventDefault();
          onToggleWishlist(product.id);
        }}
        className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-[var(--background-card)]/95 flex items-center justify-center border border-[var(--border)] active:scale-90 transition-transform z-10"
      >
        <Heart
          size={16}
          className={
            wishlisted
              ? 'fill-[var(--primary)] text-[var(--primary)]'
              : 'text-[var(--foreground-muted)]'
          }
        />
      </button>

      <div className="flex flex-col gap-1 p-3 md:p-3.5 flex-1">
        <Link
          href={`/products?id=${product.id}`}
          className="font-heading font-semibold text-sm text-[var(--foreground)] leading-snug line-clamp-2 hover:text-[var(--primary)] transition-colors"
        >
          {product.name}
        </Link>

        <div className="flex items-center justify-between gap-2 mt-auto pt-2">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="font-anton text-base text-[var(--foreground)] whitespace-nowrap">
              <CurrencyPrice amountUsd={product.price} />
            </span>
            {hasDiscount && (
              <span className="font-body text-[11px] text-[var(--foreground-muted)] line-through truncate">
                <CurrencyPrice amountUsd={product.compare_price!} />
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label="Add to cart"
            onClick={handleAdd}
            disabled={outOfStock}
            className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-transform active:scale-90 disabled:opacity-40 disabled:active:scale-100 ${
              justAdded
                ? 'bg-green-500 text-white'
                : 'bg-[var(--primary)] text-white'
            }`}
          >
            {justAdded ? <CheckCircle size={15} /> : <Plus size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Promo card                                                          */
/* ------------------------------------------------------------------ */

function PromoCard({
  eyebrow,
  title,
  description,
  cta,
  href,
  image,
}: {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  image: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block aspect-[16/10] md:aspect-[16/9] rounded-2xl overflow-hidden border border-[var(--border)]"
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />

      <div className="absolute inset-0 p-5 md:p-7 flex flex-col justify-end">
        <span className="text-[10px] md:text-xs font-kanit font-bold uppercase tracking-[0.18em] text-white/75 mb-1.5">
          {eyebrow}
        </span>
        <h3 className="font-anton text-lg md:text-2xl text-white uppercase tracking-wide mb-1.5 leading-tight">
          {title}
        </h3>
        <p className="font-body text-xs md:text-sm text-white/80 mb-3 max-w-xs">
          {description}
        </p>
        <span className="inline-flex items-center gap-1.5 text-white font-heading font-semibold text-xs md:text-sm">
          {cta}
          <ArrowRight
            size={14}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </span>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Service & Trust strip                                               */
/* ------------------------------------------------------------------ */

function ServiceTrustStrip() {
  const items = [
    {
      icon: Lock,
      title: 'Secure Checkout',
      text: 'Protected payment process.',
    },
    {
      icon: Truck,
      title: 'Delivery Across Malawi',
      text: 'Nationwide coverage.',
    },
    {
      icon: Package,
      title: 'Pickup Available',
      text: 'Collect from us.',
    },
    {
      icon: MessageCircle,
      title: 'Customer Support',
      text: "We're here to help.",
    },
  ];

  return (
    <section className="bg-[var(--background-card)] border-y border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                  <Icon size={18} className="text-[var(--primary)]" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-xs md:text-sm text-[var(--foreground)] leading-tight">
                    {item.title}
                  </p>
                  <p className="font-body text-[11px] md:text-xs text-[var(--foreground-muted)] mt-0.5 truncate">
                    {item.text}
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
/* Mobile bottom nav                                                   */
/* NOTE: Rendered here for the homepage demo. When promoted to a       */
/* global layout, remove this block from page.tsx and mount it once    */
/* alongside <Navbar /> so it persists across routes.                  */
/* ------------------------------------------------------------------ */

function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/products', label: 'Shop', icon: ShoppingBag },
    { href: '/wishlist', label: 'Wishlist', icon: Heart },
    { href: '/cart', label: 'Cart', icon: ShoppingBag, badge: totalItems },
    { href: '/account', label: 'Account', icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[var(--background-card)] border-t border-[var(--border)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      <div className="flex items-stretch justify-around h-14">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            pathname === link.href ||
            (link.href !== '/' && pathname?.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--foreground-muted)]'
              }`}
            >
              <div className="relative">
                <Icon size={20} />
                {!!link.badge && link.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[var(--primary)] text-white text-[9px] font-bold min-w-[15px] h-3.5 px-1 rounded-full flex items-center justify-center">
                    {link.badge > 99 ? '99+' : link.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
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

  const { isInWishlist, toggleWishlist } = useWishlist();

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

  const handleToggleWishlist = (id: string) => {
    void toggleWishlist(id);
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

  // /api/homepage-data returns products ORDER BY created_at DESC,
  // so the leading items are the newest uploads.
  const justLanded = products.slice(0, 8);

  // Only show reviews that actually contain text — no fabricated fallbacks.
  const validReviews = reviews
    .filter((r) => {
      const text = r.review_text || r.comment;
      return typeof text === 'string' && text.trim().length > 0;
    })
    .slice(0, 3);

  return (
    <>
      <FirstLaunchGuard />
      <EventAnnouncementBar />

      <main className="pb-20 md:pb-0">
        {/* 1. Hero — manual carousel */}
        <Hero hero={h} />

        {/* 2. Categories (self-fetching) */}
        <section className="bg-[var(--background-card)] py-10 md:py-16 border-t border-[var(--border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <CategoriesSection />
          </div>
        </section>

        {/* 3. Featured Products (self-fetching) */}
        <section className="bg-[var(--background-secondary)] py-10 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FeaturedProducts />
          </div>
        </section>

        {/* 4. Two promo banners */}
        <section className="bg-[var(--background-card)] py-10 md:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              {promoBanners.map((banner) => (
                <PromoCard
                  key={banner.href}
                  eyebrow={banner.eyebrow}
                  title={banner.title}
                  description={banner.description}
                  cta={banner.cta}
                  href={banner.href}
                  image={banner.image}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 5. Just Landed */}
        {justLanded.length > 0 && (
          <section className="bg-[var(--background-secondary)] py-10 md:py-16 border-t border-[var(--border)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionHeading
                eyebrow="Fresh"
                title="Just Landed"
                subtitle="The most recent additions to our catalogue."
                href="/products?sort=newest"
              />

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                {justLanded.map((product) => (
                  <HomeProductCard
                    key={product.id}
                    product={product}
                    wishlisted={isInWishlist(product.id)}
                    onToggleWishlist={handleToggleWishlist}
                  />
                ))}
              </div>

              <div className="mt-6 sm:hidden">
                <Link
                  href="/products?sort=newest"
                  className="inline-flex items-center gap-1.5 font-heading font-semibold text-sm text-[var(--primary)]"
                >
                  View All Products
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 6. Service & Trust strip */}
        <ServiceTrustStrip />

        {/* 7. Recently Viewed */}
        <section className="bg-[var(--background-card)] py-10 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RecentlyViewed />
          </div>
        </section>

        {/* 8. Testimonials — real reviews only */}
        {validReviews.length > 0 && (
          <section className="bg-[var(--background-secondary)] py-10 md:py-16 border-t border-[var(--border)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionHeading
                eyebrow="Customer Reviews"
                title="What Our Customers Say"
                subtitle="Feedback shared by shoppers who ordered from Spectrum Cosmo."
                href="/reviews"
                linkLabel="Read All"
              />

              <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                {validReviews.map((review) => {
                  const displayName =
                    review.customer_name ||
                    review.user_name ||
                    review.name ||
                    'Customer';
                  const reviewText = (
                    review.review_text ||
                    review.comment ||
                    ''
                  ).trim();
                  const hasRating =
                    typeof review.rating === 'number' && review.rating > 0;

                  return (
                    <div
                      key={review.id}
                      className="bg-[var(--background-card)] rounded-2xl p-5 md:p-6 border border-[var(--border)]"
                    >
                      {hasRating && (
                        <div className="flex gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={
                                i < Math.round(review.rating)
                                  ? 'fill-[var(--primary)] text-[var(--primary)]'
                                  : 'text-[var(--border)]'
                              }
                            />
                          ))}
                        </div>
                      )}

                      <p className="font-body text-[var(--foreground-muted)] text-sm leading-relaxed">
                        &ldquo;{reviewText}&rdquo;
                      </p>

                      <div className="mt-5 flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
                          <span className="text-[var(--primary)] font-anton">
                            {displayName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-heading font-semibold text-[var(--foreground)] text-sm">
                            {displayName}
                          </p>
                          <p className="font-body text-xs text-[var(--foreground-muted)]">
                            Customer Review
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 9. Newsletter */}
        <section className="bg-[#111111] py-14 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="font-anton text-3xl md:text-4xl text-[#F5F5F5] mb-4 tracking-wide uppercase">
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
                className="font-body w-full sm:flex-1 px-5 py-3.5 rounded-full bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all min-h-[48px]"
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
      </main>

      <HomepagePopup />
      <ContinueShopping />
      <MobileBottomNav />
    </>
  );
}

export default function HomePage() {
  return <HomePageContent />;
}
