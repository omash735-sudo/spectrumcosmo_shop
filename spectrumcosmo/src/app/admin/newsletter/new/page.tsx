'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Loader2, Upload, X, Users, Target, Settings,
  Send, Clock, CheckCircle, Sparkles,
  Zap, Bell, Tag, Star, Mail, ArrowLeft,
  AlertCircle, Check, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Segment {
  id: string;
  name: string;
  count: number;
  filters: any;
}

interface SubscriberCount {
  count: number;
  total: number;
}

// ===== SKELETON =====
function CreateNewsletterSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-4 bg-[var(--background-secondary)] rounded w-24" />
        <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
      </div>
      <div className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] p-6">
        <div className="space-y-6">
          <div className="h-12 bg-[var(--background-secondary)] rounded" />
          <div className="h-40 bg-[var(--background-secondary)] rounded" />
          <div className="h-12 bg-[var(--background-secondary)] rounded" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-[var(--background-secondary)] rounded-xl" />
            ))}
          </div>
          <div className="flex gap-3">
            <div className="flex-1 h-12 bg-[var(--background-secondary)] rounded" />
            <div className="flex-1 h-12 bg-[var(--background-secondary)] rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewNewsletterPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  const [audience, setAudience] = useState<'all' | 'active' | 'segment'>('all');
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [previewCount, setPreviewCount] = useState<SubscriberCount | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  const [topicFilters, setTopicFilters] = useState<string[]>([]);
  const [frequencyFilter, setFrequencyFilter] = useState<string>('');
  const [promotionsFilter, setPromotionsFilter] = useState<boolean | null>(null);

  const [sendNow, setSendNow] = useState(true);
  const [scheduleFor, setScheduleFor] = useState('');

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const res = await fetch('/api/admin/newsletter/segments');
        if (res.ok) {
          const data = await res.json();
          setSegments(data);
        }
      } catch (error) {
        console.error('Failed to load segments:', error);
      }
    };
    fetchSegments();
  }, []);

  useEffect(() => {
    const getCount = async () => {
      setLoadingCount(true);
      try {
        const res = await fetch('/api/admin/newsletter/preview-count', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audience,
            segment: selectedSegment,
            topicFilters,
            frequencyFilter,
            promotionsFilter,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setPreviewCount(data);
        }
      } catch (error) {
        console.error('Failed to get count:', error);
      } finally {
        setLoadingCount(false);
      }
    };

    const timeout = setTimeout(getCount, 500);
    return () => clearTimeout(timeout);
  }, [audience, selectedSegment, topicFilters, frequencyFilter, promotionsFilter]);

  const uploadToCloudinary = async (file: File) => {
    setUploadingImage(true);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      toast.error('Cloudinary not configured');
      setUploadingImage(false);
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setImagePreview(data.secure_url);
        setImageUrl(data.secure_url);
        toast.success('Image uploaded successfully');
        return data.secure_url;
      }
      throw new Error('Upload failed');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Image upload failed. Please try again.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadToCloudinary(file);
    }
  };

  const handleSubmit = async () => {
    if (!title || !content) {
      toast.error('Title and content are required');
      return;
    }

    if (!sendNow && !scheduleFor) {
      toast.error('Please select a schedule time');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          image_url: imageUrl || null,
          audience,
          segment: selectedSegment,
          topic_filters: topicFilters,
          frequency_filter: frequencyFilter,
          promotions_filter: promotionsFilter,
          schedule_for: sendNow ? null : scheduleFor,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(
          sendNow
            ? `Newsletter sent to ${data.totalRecipients} subscribers`
            : 'Newsletter scheduled'
        );
        router.push('/admin/newsletter');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to send newsletter');
      }
    } catch (error) {
      console.error('Failed to send:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const topicOptions = [
    { id: 'anime_news', label: 'Anime News', icon: Sparkles, color: 'text-purple-500' },
    { id: 'new_arrivals', label: 'New Arrivals', icon: Zap, color: 'text-blue-500' },
    { id: 'sales', label: 'Sales & Discounts', icon: Tag, color: 'text-green-500' },
    { id: 'exclusive', label: 'Exclusive Drops', icon: Star, color: 'text-yellow-500' },
  ];

  const frequencyOptions = ['daily', 'weekly', 'biweekly', 'monthly'];

  if (loading && !title) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl mx-auto">
          <CreateNewsletterSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Link
            href="/admin/newsletter"
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition mb-2"
          >
            <ArrowLeft size={16} />
            Back to Newsletter Hub
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Create Newsletter</h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
            Craft engaging emails and target the right audience
          </p>
        </div>

        <div className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] p-4 sm:p-6 shadow-sm">
          <div className="space-y-5 sm:space-y-6">
            {/* Campaign Details */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                  Campaign Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Summer Anime Collection Drop"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-[10px] text-[var(--foreground-muted)]">{title.length} characters</span>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  placeholder="Write your newsletter content here... (HTML supported)"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition resize-none font-mono text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[10px] text-[var(--foreground-muted)]">
                    Supports HTML: <code className="bg-[var(--background)] px-1.5 py-0.5 rounded text-[10px]">&lt;strong&gt;</code>, <code className="bg-[var(--background)] px-1.5 py-0.5 rounded text-[10px]">&lt;em&gt;</code>, <code className="bg-[var(--background)] px-1.5 py-0.5 rounded text-[10px]">&lt;a&gt;</code>
                  </p>
                  <span className="text-[10px] text-[var(--foreground-muted)]">{content.length} characters</span>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                  Header Image (optional)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                  />
                  <label className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl hover:bg-[var(--background)] transition min-h-[44px] sm:min-h-[42px]">
                      <Upload size={16} className="text-[var(--foreground-muted)]" />
                      <span className="text-sm hidden xs:inline">Upload</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                {uploadingImage && (
                  <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)] mt-2">
                    <Loader2 className="animate-spin" size={14} />
                    Uploading to Cloudinary...
                  </div>
                )}
                {imagePreview && (
                  <div className="mt-3 relative w-32 h-32 sm:w-48 sm:h-48 rounded-lg overflow-hidden bg-[var(--background-secondary)] border border-[var(--border)]">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => {
                        setImagePreview('');
                        setImageUrl('');
                      }}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 rounded-full p-1 text-white transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Audience Targeting */}
            <div className="border-t border-[var(--border)] pt-4 sm:pt-6">
              <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)] flex items-center gap-2 mb-3 sm:mb-4">
                <Target size={18} className="sm:w-5 sm:h-5 text-[var(--primary)]" />
                Audience Targeting
              </h3>

              <div className="mb-3 sm:mb-4">
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-2">
                  Who should receive this?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setAudience('all');
                      setSelectedSegment(null);
                    }}
                    className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm font-medium transition text-center min-h-[60px] sm:min-h-[72px] ${
                      audience === 'all'
                        ? 'border-[var(--primary)] bg-orange-50 dark:bg-orange-950/30 text-[var(--primary)]'
                        : 'border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--foreground-muted)]'
                    }`}
                  >
                    <Users size={16} className="inline mr-1.5" />
                    All Subscribers
                    <p className="text-[10px] text-[var(--foreground-muted)] font-normal mt-1">
                      {previewCount?.total || 0} subscribers
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setAudience('active');
                      setSelectedSegment(null);
                    }}
                    className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm font-medium transition text-center min-h-[60px] sm:min-h-[72px] ${
                      audience === 'active'
                        ? 'border-[var(--primary)] bg-orange-50 dark:bg-orange-950/30 text-[var(--primary)]'
                        : 'border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--foreground-muted)]'
                    }`}
                  >
                    <CheckCircle size={16} className="inline mr-1.5" />
                    Active Subscribers
                    <p className="text-[10px] text-[var(--foreground-muted)] font-normal mt-1">
                      Opened in last 90 days
                    </p>
                  </button>

                  <button
                    onClick={() => setAudience('segment')}
                    className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm font-medium transition text-center min-h-[60px] sm:min-h-[72px] ${
                      audience === 'segment'
                        ? 'border-[var(--primary)] bg-orange-50 dark:bg-orange-950/30 text-[var(--primary)]'
                        : 'border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--foreground-muted)]'
                    }`}
                  >
                    <Settings size={16} className="inline mr-1.5" />
                    Custom Segment
                    <p className="text-[10px] text-[var(--foreground-muted)] font-normal mt-1">
                      {loadingCount ? '...' : `${previewCount?.count || 0} subscribers match`}
                    </p>
                  </button>
                </div>
              </div>

              {audience === 'segment' && (
                <div className="bg-[var(--background-secondary)] rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-2">
                      Topics
                    </label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {topicOptions.map((topic) => {
                        const Icon = topic.icon;
                        const isSelected = topicFilters.includes(topic.id);
                        return (
                          <button
                            key={topic.id}
                            onClick={() => {
                              setTopicFilters(prev =>
                                prev.includes(topic.id)
                                  ? prev.filter(t => t !== topic.id)
                                  : [...prev, topic.id]
                              );
                            }}
                            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition flex items-center gap-1 sm:gap-1.5 min-h-[32px] ${
                              isSelected
                                ? 'bg-[var(--primary)] text-white'
                                : 'bg-[var(--background)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                            }`}
                          >
                            <Icon size={12} className={isSelected ? 'text-white' : topic.color} />
                            {topic.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-2">
                      Frequency Preference
                    </label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {frequencyOptions.map((freq) => (
                        <button
                          key={freq}
                          onClick={() => setFrequencyFilter(freq === frequencyFilter ? '' : freq)}
                          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition capitalize min-h-[32px] ${
                            frequencyFilter === freq
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-[var(--background)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                          }`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-2">
                      Promotions & Offers
                    </label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      <button
                        onClick={() => setPromotionsFilter(true)}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition min-h-[32px] ${
                          promotionsFilter === true
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--background)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setPromotionsFilter(false)}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition min-h-[32px] ${
                          promotionsFilter === false
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--background)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                        }`}
                      >
                        No
                      </button>
                      <button
                        onClick={() => setPromotionsFilter(null)}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition min-h-[32px] ${
                          promotionsFilter === null
                            ? 'bg-[var(--foreground-muted)] text-white'
                            : 'bg-[var(--background)] text-[var(--foreground-muted)] hover:bg-[var(--background)]'
                        }`}
                      >
                        All
                      </button>
                    </div>
                  </div>

                  <div className="bg-[var(--background-card)] rounded-xl p-3 text-center border border-[var(--border)]">
                    <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                      <span className="font-bold text-xl sm:text-2xl text-[var(--primary)]">
                        {previewCount?.count || 0}
                      </span>
                      {' '}subscribers will receive this email
                    </p>
                    {loadingCount && (
                      <Loader2 size={14} className="animate-spin inline ml-2 text-[var(--primary)]" />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="border-t border-[var(--border)] pt-4 sm:pt-6">
              <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)] flex items-center gap-2 mb-3 sm:mb-4">
                <Clock size={18} className="sm:w-5 sm:h-5 text-[var(--primary)]" />
                Schedule
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={() => setSendNow(true)}
                  className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm font-medium transition text-center min-h-[48px] ${
                    sendNow
                      ? 'border-[var(--primary)] bg-orange-50 dark:bg-orange-950/30 text-[var(--primary)]'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--foreground-muted)]'
                  }`}
                >
                  <Send size={16} className="inline mr-1.5" />
                  Send Now
                </button>

                <button
                  onClick={() => setSendNow(false)}
                  className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm font-medium transition text-center min-h-[48px] ${
                    !sendNow
                      ? 'border-[var(--primary)] bg-orange-50 dark:bg-orange-950/30 text-[var(--primary)]'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--foreground-muted)]'
                  }`}
                >
                  <Clock size={16} className="inline mr-1.5" />
                  Schedule Later
                </button>
              </div>

              {!sendNow && (
                <div className="mt-3">
                  <input
                    type="datetime-local"
                    value={scheduleFor}
                    onChange={(e) => setScheduleFor(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)]"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => router.back()}
                className="px-4 py-2.5 border border-[var(--border)] rounded-xl text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition text-sm min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 py-2.5 rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm min-h-[44px]"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : sendNow ? (
                  <>
                    <Send size={18} />
                    Send Newsletter
                  </>
                ) : (
                  <>
                    <Clock size={18} />
                    Schedule Newsletter
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-[10px] sm:text-xs text-[var(--foreground-muted)]">
              {sendNow ? 'This will send immediately to the selected audience' : 'This will be queued for the selected time'}
            </p>
          </div>
        </div>

        {/* Pro Tips */}
        <div className="mt-4 sm:mt-6 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400">
                <strong>💡 Pro Tips:</strong>
              </p>
              <ul className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 mt-1 space-y-0.5 list-disc list-inside">
                <li>Keep subject lines under 50 characters for better open rates</li>
                <li>Use personalization tags like {'{{customer_name}}'} in content</li>
                <li>Test your email on different devices before sending</li>
                <li>Schedule campaigns for Tuesday-Thursday mornings for best engagement</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
