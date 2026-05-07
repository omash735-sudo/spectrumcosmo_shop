export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import StarRating from '@/components/ui/StarRating';
import CurrencyPrice from '@/components/storefront/CurrencyPrice';
import AddToCartButton from '@/components/storefront/AddToCartButton';
import { getDb } from '@/lib/db';

// Icons for share buttons
import { Twitter, Facebook, Share2, Copy } from 'lucide-react';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let product: any = null;
  let reviews: any[] = [];
  let relatedProducts: any[] = [];

  try {
    const sql = getDb();
    const [products, revs] = await Promise.all([
      sql`SELECT * FROM products WHERE id = ${id}`,
      sql`SELECT * FROM reviews WHERE product_id = ${id} AND approved = true ORDER BY created_at DESC LIMIT 5`,
    ]);
    product = products[0];
    reviews = revs;

    if (product) {
      // Related products: same category, excluding current
      relatedProducts = await sql`
        SELECT * FROM products 
        WHERE category = ${product.category} AND id != ${id} 
        ORDER BY created_at DESC LIMIT 3
      `;
    }
  } catch (err) {
    console.error(err);
  }

  if (!product) notFound();

  const avgRating =
    reviews.length > 0
      ? Math.round(reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length)
      : 0;

  // We'll need a client component for the review form & share buttons.
  // To keep the page mostly server-rendered, we'll import those as separate client components.

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-6 flex flex-wrap items-center gap-2">
            <Link href="/" className="hover:text-[#F97316] transition">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-[#F97316] transition">Products</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium truncate">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Left column – Image (sticky on desktop) */}
            <div className="relative lg:sticky lg:top-24 h-[400px] sm:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden bg-gray-100">
              <Image
                src={product.image_url || '/placeholder-image.jpg'}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {product.category && (
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 px-3 py-1.5 rounded-full shadow-sm">
                    {product.category}
                  </span>
                </div>
              )}
            </div>

            {/* Right column – Details */}
            <div className="flex flex-col">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>

              {/* Ratings */}
              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={avgRating} />
                {reviews.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="text-3xl sm:text-4xl font-bold text-[#F97316] mb-6">
                <CurrencyPrice amountUsd={Number(product.price ?? 0)} />
              </div>

              {/* Description */}
              {product.description && (
                <div className="prose prose-sm text-gray-600 mb-6">
                  <p>{product.description}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <AddToCartButton
                  productId={String(product.id)}
                  productName={product.name}
                  imageUrl={product.image_url}
                  priceUsd={Number(product.price ?? 0)}
                />
                <Link
                  href="/checkout"
                  className="btn-secondary text-center inline-flex items-center justify-center"
                >
                  Buy Now
                </Link>
              </div>

              {/* Shipping / Payment Info */}
              <div className="bg-orange-50 rounded-xl p-5 mb-8">
                <h3 className="font-semibold text-gray-800 mb-1">🚚 Fast Delivery & Easy Payment</h3>
                <p className="text-sm text-gray-600">
                  Choose Airtel Money, TNM Mpamba, or bank transfer at checkout.
                </p>
              </div>

              {/* Social Share */}
              <div className="border-t border-gray-100 pt-6">
                <p className="text-sm text-gray-500 mb-3">Share this product:</p>
                <div className="flex gap-3">
                  <ShareButton
                    platform="twitter"
                    url={`https://spectrumcosmo.shop/products/${product.id}`}
                    title={product.name}
                  />
                  <ShareButton
                    platform="facebook"
                    url={`https://spectrumcosmo.shop/products/${product.id}`}
                  />
                  <ShareButton
                    platform="whatsapp"
                    url={`https://spectrumcosmo.shop/products/${product.id}`}
                    text={`Check out ${product.name} on SpectrumCosmo!`}
                  />
                  <ShareButton platform="copy" url={`https://spectrumcosmo.shop/products/${product.id}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section with submission form */}
          <div className="mt-16 border-t border-gray-100 pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

            {/* Review form – use client component */}
            <div className="mb-10 bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">Write a review</h3>
              <ReviewForm productId={product.id} />
            </div>

            {/* Existing reviews */}
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No reviews yet. Be the first!</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {reviews.map((review: any) => (
                  <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                    <StarRating rating={review.rating} />
                    <p className="text-gray-700 text-sm mt-3 leading-relaxed">
                      “{review.review_text}”
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <p className="text-xs font-medium text-gray-800">
                        — {review.customer_name || 'Anonymous'}
                      </p>
                      <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* You May Also Like */}
          {relatedProducts.length > 0 && (
            <div className="mt-20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProducts.map((rel: any) => (
                  <div key={rel.id} className="group relative bg-white border rounded-xl overflow-hidden hover:shadow-lg transition">
                    <Link href={`/products/${rel.id}`}>
                      <div className="relative h-64 bg-gray-100">
                        <Image
                          src={rel.image_url || '/placeholder-image.jpg'}
                          alt={rel.name}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800">{rel.name}</h3>
                        <div className="mt-1 text-[#F97316] font-bold">
                          <CurrencyPrice amountUsd={Number(rel.price ?? 0)} />
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

// ---------- Client Components ----------

// ShareButton – inline client component
import { useState } from 'react';

function ShareButton({ platform, url, title, text }: { platform: string; url: string; title?: string; text?: string }) {
  const handleShare = () => {
    let shareUrl = '';
    if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title || 'Check this out')}&url=${encodeURIComponent(url)}`;
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    } else if (platform === 'whatsapp') {
      shareUrl = `https://wa.me/?text=${encodeURIComponent(text || `Check out ${url}`)}`;
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
      return;
    }
    if (shareUrl) window.open(shareUrl, '_blank');
  };

  const Icon = platform === 'twitter' ? Twitter : platform === 'facebook' ? Facebook : platform === 'copy' ? Copy : Share2;
  return (
    <button
      onClick={handleShare}
      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
      aria-label={`Share on ${platform}`}
    >
      <Icon size={18} />
    </button>
  );
}

// ReviewForm – client component (requires StarRatingInput – create a simple version if missing)
import StarRatingInput from '@/components/ui/StarRatingInput';

function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setMessage('Please select a rating');
      return;
    }
    setSubmitting(true);
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, rating, reviewText }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('Review submitted! It will appear after approval.');
      setRating(0);
      setReviewText('');
    } else {
      setMessage(data.error || 'Failed to submit review');
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Rating</label>
        <StarRatingInput rating={rating} setRating={setRating} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Your review</label>
        <textarea
          rows={3}
          className="w-full border rounded-lg p-2 text-sm"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          required
        />
      </div>
      {message && <p className="text-sm text-orange-600">{message}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="bg-[#F97316] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
