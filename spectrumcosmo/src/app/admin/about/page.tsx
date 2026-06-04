'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, Trash2, Upload, X, ChevronUp, ChevronDown, Save, Image as ImageIcon, Users, BarChart3, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

// Types
interface Stat {
  value: string;
  label: string;
}

interface TeamMember {
  name: string;
  role: string;
  image: string;
}

interface AboutContent {
  history: string;
  vision: string;
  mission: string;
  stats: Stat[];
  team: TeamMember[];
  future_plans: string;
  community_link: string;
  image_mode: 'single' | 'carousel';
  single_image_url: string;
  carousel_images: string[];
}

// Constants
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'spectrumcosmo';

const defaultContent: AboutContent = {
  history: '',
  vision: '',
  mission: '',
  stats: [],
  team: [],
  future_plans: '',
  community_link: '',
  image_mode: 'single',
  single_image_url: '',
  carousel_images: [],
};

export default function AdminAboutPage() {
  const [content, setContent] = useState<AboutContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'images'>('text');

  useEffect(() => {
    fetch('/api/admin/about')
      .then(res => res.json())
      .then(data => {
        setContent({ ...defaultContent, ...data });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load content:', err);
        toast.error('Failed to load about page content');
        setLoading(false);
      });
  }, []);

  const updateField = useCallback((path: string[], value: unknown) => {
    setContent((prev) => {
      const newContent = { ...prev };
      let cur: any = newContent;
      for (let i = 0; i < path.length - 1; i++) {
        if (!cur[path[i]]) cur[path[i]] = {};
        cur = cur[path[i]];
      }
      cur[path[path.length - 1]] = value;
      return newContent;
    });
  }, []);

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!CLOUDINARY_CLOUD_NAME) {
      toast.error('Cloudinary not configured');
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.secure_url) throw new Error('Upload failed');
      return data.secure_url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      console.error('Upload failed:', errorMessage);
      toast.error(errorMessage);
      return null;
    }
  };

  const handleSingleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    const url = await uploadImage(file);
    if (url) updateField(['single_image_url'], url);
    setUploadingImg(false);
  };

  const removeSingleImage = () => updateField(['single_image_url'], '');

  const addCarouselImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    const url = await uploadImage(file);
    if (url) {
      const images = [...(content.carousel_images || []), url];
      updateField(['carousel_images'], images);
    }
    setUploadingImg(false);
  };

  const removeCarouselImage = (idx: number) => {
    const images = [...(content.carousel_images || [])];
    images.splice(idx, 1);
    updateField(['carousel_images'], images);
  };

  const moveCarouselImage = (idx: number, direction: 'up' | 'down') => {
    const images = [...(content.carousel_images || [])];
    if (direction === 'up' && idx > 0) {
      [images[idx - 1], images[idx]] = [images[idx], images[idx - 1]];
    } else if (direction === 'down' && idx < images.length - 1) {
      [images[idx], images[idx + 1]] = [images[idx + 1], images[idx]];
    }
    updateField(['carousel_images'], images);
  };

  const addStat = () => {
    const stats = [...(content.stats || []), { value: '', label: '' }];
    updateField(['stats'], stats);
  };

  const removeStat = (idx: number) => {
    const stats = [...(content.stats || [])];
    stats.splice(idx, 1);
    updateField(['stats'], stats);
  };

  const updateStat = (idx: number, field: keyof Stat, val: string) => {
    const stats = [...(content.stats || [])];
    stats[idx] = { ...stats[idx], [field]: val };
    updateField(['stats'], stats);
  };

  const addTeam = () => {
    const team = [...(content.team || []), { name: '', role: '', image: '' }];
    updateField(['team'], team);
  };

  const removeTeam = (idx: number) => {
    const team = [...(content.team || [])];
    team.splice(idx, 1);
    updateField(['team'], team);
  };

  const updateTeam = (idx: number, field: keyof TeamMember, val: string) => {
    const team = [...(content.team || [])];
    team[idx] = { ...team[idx], [field]: val };
    updateField(['team'], team);
  };

  const uploadTeamImage = async (idx: number, file: File) => {
    setUploadingImg(true);
    const url = await uploadImage(file);
    if (url) updateTeam(idx, 'image', url);
    setUploadingImg(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success('About page content saved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Save failed';
      console.error('Save error:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="animate-spin text-orange-500 w-8 h-8 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Shopify-style Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">About Page Editor</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your brand story, team, and gallery</p>
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition disabled:opacity-50 shadow-sm"
            >
              {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation - Shopify Style */}
        <div className="flex gap-1 mb-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-1">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition ${
              activeTab === 'text'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Text & Content
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition ${
              activeTab === 'images'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Images & Gallery
          </button>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          {activeTab === 'text' ? (
            <div className="p-6 space-y-8">
              {/* Brand Story Section */}
              <section>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                  <ImageIcon className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Brand Story</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      History / About Us
                    </label>
                    <textarea
                      rows={8}
                      value={content.history || ''}
                      onChange={(e) => updateField(['history'], e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Tell your brand story..."
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Vision
                      </label>
                      <textarea
                        rows={3}
                        value={content.vision || ''}
                        onChange={(e) => updateField(['vision'], e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mission
                      </label>
                      <textarea
                        rows={3}
                        value={content.mission || ''}
                        onChange={(e) => updateField(['mission'], e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Stats Section */}
              <section>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Statistics</h2>
                  </div>
                  <button
                    onClick={addStat}
                    className="inline-flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700"
                  >
                    <Plus className="w-4 h-4" /> Add Stat
                  </button>
                </div>
                <div className="space-y-3">
                  {content.stats?.map((stat, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <input
                        type="text"
                        placeholder="Value (e.g., 1000+)"
                        value={stat.value}
                        onChange={(e) => updateStat(idx, 'value', e.target.value)}
                        className="w-36 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Label (e.g., Customers)"
                        value={stat.label}
                        onChange={(e) => updateStat(idx, 'label', e.target.value)}
                        className="flex-1 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2 text-sm"
                      />
                      <button
                        onClick={() => removeStat(idx)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(!content.stats || content.stats.length === 0) && (
                    <p className="text-sm text-gray-400 text-center py-4">No statistics added yet. Click "Add Stat" to start.</p>
                  )}
                </div>
              </section>

              {/* Team Section */}
              <section>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h2>
                  </div>
                  <button
                    onClick={addTeam}
                    className="inline-flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700"
                  >
                    <Plus className="w-4 h-4" /> Add Member
                  </button>
                </div>
                <div className="space-y-4">
                  {content.team?.map((member, idx) => (
                    <div key={idx} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                      <div className="flex gap-3 mb-3">
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={member.name}
                          onChange={(e) => updateTeam(idx, 'name', e.target.value)}
                          className="flex-1 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Role / Title"
                          value={member.role}
                          onChange={(e) => updateTeam(idx, 'role', e.target.value)}
                          className="flex-1 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-2 text-sm"
                        />
                        <button
                          onClick={() => removeTeam(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        {member.image ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                            <Image src={member.image} alt={member.name} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm transition">
                          <Upload className="w-3 h-3" />
                          {member.image ? 'Change Photo' : 'Upload Photo'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadTeamImage(idx, file);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                  {(!content.team || content.team.length === 0) && (
                    <p className="text-sm text-gray-400 text-center py-4">No team members added. Click "Add Member" to start.</p>
                  )}
                </div>
              </section>

              {/* Future Plans */}
              <section>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Future Plans</h2>
                </div>
                <textarea
                  rows={4}
                  value={content.future_plans || ''}
                  onChange={(e) => updateField(['future_plans'], e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Share your roadmap and future goals..."
                />
              </section>

              {/* Community Link */}
              <section>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
                  <LinkIcon className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Community Link</h2>
                </div>
                <div>
                  <input
                    type="url"
                    value={content.community_link || ''}
                    onChange={(e) => updateField(['community_link'], e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="https://chat.whatsapp.com/your-invite-link"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    This link will be used for the "Join Our Community" button on the About page.
                  </p>
                </div>
              </section>
            </div>
          ) : (
            <div className="p-6 space-y-8">
              {/* Image Mode Selection */}
              <section>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Image Display Mode
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="single"
                      checked={content.image_mode === 'single'}
                      onChange={() => updateField(['image_mode'], 'single')}
                      className="w-4 h-4 text-orange-500"
                    />
                    <span className="text-sm">Single Image</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="carousel"
                      checked={content.image_mode === 'carousel'}
                      onChange={() => updateField(['image_mode'], 'carousel')}
                      className="w-4 h-4 text-orange-500"
                    />
                    <span className="text-sm">Carousel / Slider</span>
                  </label>
                </div>
              </section>

              {/* Single Image Upload */}
              {content.image_mode === 'single' && (
                <section>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Main About Image
                  </label>
                  {content.single_image_url ? (
                    <div className="relative w-full max-w-md h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
                      <Image src={content.single_image_url} alt="About main" fill className="object-cover" />
                      <button
                        onClick={removeSingleImage}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full max-w-md h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-700">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-2 mt-3 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm transition">
                    <Upload className="w-4 h-4" />
                    {content.single_image_url ? 'Replace Image' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSingleImageUpload}
                      disabled={uploadingImg}
                    />
                  </label>
                  {uploadingImg && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="animate-spin w-4 h-4" />
                      Uploading...
                    </div>
                  )}
                </section>
              )}

              {/* Carousel Images */}
              {content.image_mode === 'carousel' && (
                <section>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Carousel Images
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {content.carousel_images?.map((url: string, idx: number) => (
                      <div key={idx} className="relative group border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <div className="relative h-32 w-full">
                          <Image src={url} alt={`Slide ${idx + 1}`} fill className="object-cover" />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => moveCarouselImage(idx, 'up')}
                            className="bg-black/60 hover:bg-black/80 p-1 rounded text-white transition"
                            disabled={idx === 0}
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveCarouselImage(idx, 'down')}
                            className="bg-black/60 hover:bg-black/80 p-1 rounded text-white transition"
                            disabled={idx === (content.carousel_images?.length || 0) - 1}
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeCarouselImage(idx)}
                            className="bg-red-600 hover:bg-red-700 p-1 rounded text-white transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <label className="h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <Plus className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={addCarouselImage}
                        disabled={uploadingImg}
                      />
                    </label>
                  </div>
                  {uploadingImg && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="animate-spin w-4 h-4" />
                      Uploading image...
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    Drag and drop to reorder, or use the arrow buttons. Recommended image size: 800x600px.
                  </p>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
