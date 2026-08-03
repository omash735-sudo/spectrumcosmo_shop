'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, Heart, Calendar, Share2, Loader2, 
  User, ThumbsUp, CheckCircle, Clock, XCircle,
  AlertCircle, Package, TrendingUp
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import RequestStatusBadge from '@/components/requests/RequestStatusBadge';
import RequestProgress from '@/components/requests/RequestProgress';
import toast from 'react-hot-toast';

interface RequestDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  like_count: number;
  created_at: string;
  category_name: string;
  user_name?: string;
  user_liked: number;
  images: Array<{ id: string; image_url: string; display_order: number }>;
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const loadRequest = async () => {
      try {
        const res = await fetch(`/api/requests/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            router.push('/requests');
            return;
          }
          throw new Error('Failed to load request');
        }
        const data = await res.json();
        setRequest(data.data);
      } catch (err) {
        console.error('Failed to load request:', err);
        toast.error('Failed to load request');
      } finally {
        setLoading(false);
      }
    };
    loadRequest();
  }, [id, router]);

  const handleLike = async () => {
    if (!request) return;
    setLiking(true);
    
    try {
      const res = await fetch(`/api/requests/${id}/like`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to like');
      }
      
      const data = await res.json();
      
      setRequest(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          like_count: data.liked ? prev.like_count + 1 : prev.like_count - 1,
          user_liked: data.liked ? 1 : 0,
        };
      });
      
      toast.success(data.liked ? 'Liked!' : 'Unliked');
    } catch (err: any) {
      toast.error(err.message || 'Failed to like');
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 size={36} className="animate-spin text-[var(--primary)]" />
        </div>
        <Footer />
      </>
    );
  }

  if (!request) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <XCircle size={48} className="text-[var(--foreground-muted)] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Request not found</h2>
            <Link href="/requests" className="text-[var(--primary)] hover:underline mt-4 inline-block">
              Browse all requests →
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const isRejected = request.status === 'rejected';
  const isAvailable = request.status === 'available';

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--background)] py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Back Button */}
          <Link
            href="/requests"
            className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--primary)] mb-6 transition group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition" />
            Back to Requests
          </Link>

          {/* Request Card */}
          <div className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <RequestStatusBadge status={request.status} size="lg" />
                    {request.user_name && (
                      <span className="text-xs text-[var(--foreground-muted)] flex items-center gap-1">
                        <User size={14} />
                        by {request.user_name}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">
                    {request.title}
                  </h1>
                  {request.category_name && (
                    <p className="text-sm text-[var(--foreground-muted)] mt-1">
                      Category: {request.category_name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLike}
                    disabled={liking}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
                      request.user_liked
                        ? 'bg-red-50 dark:bg-red-950/30 text-red-500'
                        : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                    }`}
                  >
                    <Heart 
                      size={18} 
                      className={request.user_liked ? 'fill-red-500' : ''}
                    />
                    <span className="font-semibold">{request.like_count}</span>
                    <span className="text-xs hidden sm:inline">votes</span>
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={sharing}
                    className="p-2.5 rounded-xl bg-[var(--background-secondary)] hover:bg-[var(--background)] transition"
                    aria-label="Share"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              </div>

              {/* Status Progression */}
              {!isRejected && (
                <div className="mb-6">
                  <RequestProgress status={request.status} />
                </div>
              )}

              {/* Rejected State */}
              {isRejected && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-3">
                    <XCircle size={24} className="text-red-500" />
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-400">Request Not Approved</p>
                      <p className="text-sm text-red-600 dark:text-red-300">
                        This request was not approved for production at this time.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Available State */}
              {isAvailable && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <Package size={24} className="text-green-500" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">Now Available!</p>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        This request has been made into a real product.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="prose prose-sm max-w-none text-[var(--foreground)] mt-4">
                <p className="whitespace-pre-wrap">{request.description}</p>
              </div>

              {/* Images Gallery */}
              {request.images.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--foreground)] mb-3">Reference Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {request.images.map((image) => (
                      <div
                        key={image.id}
                        className="relative aspect-square rounded-xl overflow-hidden bg-[var(--background-secondary)] group"
                      >
                        <Image
                          src={image.image_url}
                          alt="Request reference"
                          fill
                          className="object-cover group-hover:scale-105 transition duration-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer - Date */}
              <div className="mt-6 pt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                  <Calendar size={16} />
                  <span>Submitted on {new Date(request.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3 justify-between">
            <Link
              href="/requests"
              className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--primary)] transition"
            >
              <ArrowLeft size={16} />
              Browse all requests
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
