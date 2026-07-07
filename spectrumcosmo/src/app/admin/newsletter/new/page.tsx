'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Loader2, Upload, X, Users, Target, Settings,
  Send, Clock, CheckCircle, Sparkles,
  Zap, Bell, Tag, Star, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';

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

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Mail size={24} className="text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Newsletter</h1>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Campaign Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Summer Anime Collection Drop"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="Write your newsletter content here... (HTML supported)"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Supports HTML: &lt;strong&gt;, &lt;em&gt;, &lt;a href=&quot;...&quot;&gt;, &lt;img&gt;, etc.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Header Image (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
                <label className="cursor-pointer">
                  <div className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-2">
                    <Upload size={18} className="text-gray-500" />
                    <span className="text-sm hidden sm:inline">Upload</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              {uploadingImage && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                  <Loader2 className="animate-spin" size={16} />
                  Uploading to Cloudinary...
                </div>
              )}
              {imagePreview && (
                <div className="mt-3 relative w-48 h-48 rounded-lg overflow-hidden bg-gray-100 border">
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
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-black/80 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Target size={20} className="text-orange-500" />
              Audience Targeting
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Who should receive this?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setAudience('all');
                    setSelectedSegment(null);
                  }}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition text-center ${
                    audience === 'all'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800'
                  }`}
                >
                  <Users size={16} className="inline mr-2" />
                  All Subscribers
                  <p className="text-xs text-gray-400 font-normal mt-1">
                    {previewCount?.total || 0} subscribers
                  </p>
                </button>

                <button
                  onClick={() => {
                    setAudience('active');
                    setSelectedSegment(null);
                  }}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition text-center ${
                    audience === 'active'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800'
                  }`}
                >
                  <CheckCircle size={16} className="inline mr-2" />
                  Active Subscribers
                  <p className="text-xs text-gray-400 font-normal mt-1">
                    Opened in last 90 days
                  </p>
                </button>

                <button
                  onClick={() => setAudience('segment')}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition text-center ${
                    audience === 'segment'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800'
                  }`}
                >
                  <Settings size={16} className="inline mr-2" />
                  Custom Segment
                  <p className="text-xs text-gray-400 font-normal mt-1">
                    {loadingCount ? '...' : `${previewCount?.count || 0} subscribers match`}
                  </p>
                </button>
              </div>
            </div>

            {audience === 'segment' && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Topics
                  </label>
                  <div className="flex flex-wrap gap-2">
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          <Icon size={14} className={isSelected ? 'text-white' : topic.color} />
                          {topic.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frequency Preference
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {frequencyOptions.map((freq) => (
                      <button
                        key={freq}
                        onClick={() => setFrequencyFilter(freq === frequencyFilter ? '' : freq)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${
                          frequencyFilter === freq
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Promotions & Offers
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setPromotionsFilter(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        promotionsFilter === true
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setPromotionsFilter(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        promotionsFilter === false
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      No
                    </button>
                    <button
                      onClick={() => setPromotionsFilter(null)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        promotionsFilter === null
                          ? 'bg-gray-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      All
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-2xl text-orange-500">{previewCount?.count || 0}</span>
                    {' '}subscribers will receive this email
                  </p>
                  {loadingCount && (
                    <Loader2 size={16} className="animate-spin inline ml-2 text-orange-500" />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Clock size={20} className="text-orange-500" />
              Schedule
            </h3>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setSendNow(true)}
                className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition text-center ${
                  sendNow
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800'
                }`}
              >
                <Send size={16} className="inline mr-2" />
                Send Now
              </button>

              <button
                onClick={() => setSendNow(false)}
                className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition text-center ${
                  !sendNow
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800'
                }`}
              >
                <Clock size={16} className="inline mr-2" />
                Schedule Later
              </button>
            </div>

            {!sendNow && (
              <div className="mt-3">
                <input
                  type="datetime-local"
                  value={scheduleFor}
                  onChange={(e) => setScheduleFor(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-orange-500 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
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

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            {sendNow ? 'This will send immediately to the selected audience' : 'This will be queued for the selected time'}
          </p>
        </div>
      </div>
    </div>
  );
}
