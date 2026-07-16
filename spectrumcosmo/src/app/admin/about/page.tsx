'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Upload, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  Image as ImageIcon, 
  Users, 
  BarChart3, 
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface Stat {
  value: string;
  label: string;
}

interface TeamMember {
  name: string;
  role: string;
  image: string;
  bio?: string;
  email?: string;
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
  signature_name: string;
  signature_title: string;
  signature_image: string;
  team_description?: string;
}

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
  signature_name: '',
  signature_title: '',
  signature_image: '',
  team_description: '',
};

// ===== SKELETON =====
function AboutSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
      <div className="h-4 bg-[var(--background-secondary)] rounded w-64" />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-32 bg-[var(--background-secondary)] rounded" />
        <div className="h-32 bg-[var(--background-secondary)] rounded" />
      </div>
      <div className="h-64 bg-[var(--background-secondary)] rounded" />
    </div>
  );
}

// ===== IMAGE UPLOAD COMPONENT =====
function ImageUpload({
  label,
  imageUrl,
  onUpload,
  onRemove,
  uploading,
  className = '',
}: {
  label: string;
  imageUrl: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  uploading: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
        {label}
      </label>
      {imageUrl ? (
        <div className="relative w-full max-w-xs h-40 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--background-secondary)]">
          <Image src={imageUrl} alt={label} fill className="object-cover" />
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full transition shadow-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="w-full max-w-xs h-40 bg-[var(--background-secondary)] rounded-lg flex items-center justify-center border-2 border-dashed border-[var(--border)]">
          <ImageIcon className="w-6 h-6 text-[var(--foreground-muted)]" />
        </div>
      )}
      <label className="cursor-pointer inline-flex items-center gap-2 mt-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--background-secondary)] hover:bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs sm:text-sm font-medium text-[var(--foreground)] transition">
        <Upload className="w-3.5 h-3.5" />
        {imageUrl ? 'Replace' : 'Upload'}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onUpload}
          disabled={uploading}
        />
      </label>
      {uploading && (
        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
          <Loader2 className="animate-spin w-3.5 h-3.5" />
          Uploading...
        </div>
      )}
    </div>
  );
}

// ===== MAIN COMPONENT =====
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
    const team = [...(content.team || []), { name: '', role: '', image: '', bio: '', email: '' }];
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

  const uploadSignatureImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    const url = await uploadImage(file);
    if (url) updateField(['signature_image'], url);
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
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[var(--primary)] w-8 h-8 mx-auto mb-3" />
          <p className="text-[var(--foreground-muted)]">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background-card)] border-b border-[var(--border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">About Page Editor</h1>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">Manage your brand story, team, and gallery</p>
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition disabled:opacity-50 shadow-sm text-sm sm:text-base min-h-[44px]"
            >
              {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 sm:mb-6 bg-[var(--background-card)] rounded-lg border border-[var(--border)] p-1">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 px-3 sm:px-4 py-2 rounded-md font-medium text-xs sm:text-sm transition min-h-[40px] ${
              activeTab === 'text'
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)]'
            }`}
          >
            Text & Content
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`flex-1 px-3 sm:px-4 py-2 rounded-md font-medium text-xs sm:text-sm transition min-h-[40px] ${
              activeTab === 'images'
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)]'
            }`}
          >
            Images & Gallery
          </button>
        </div>

        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
          {activeTab === 'text' ? (
            <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
              {/* Brand Story */}
              <section>
                <div className="flex items-center gap-2 mb-3 sm:mb-4 pb-2 border-b border-[var(--border)]">
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                  <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Brand Story</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      History / About Us
                    </label>
                    <textarea
                      rows={6}
                      value={content.history || ''}
                      onChange={(e) => updateField(['history'], e.target.value)}
                      className="w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition resize-none"
                      placeholder="Tell your brand story..."
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                        Vision
                      </label>
                      <textarea
                        rows={3}
                        value={content.vision || ''}
                        onChange={(e) => updateField(['vision'], e.target.value)}
                        className="w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition resize-none"
                        placeholder="Your vision..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                        Mission
                      </label>
                      <textarea
                        rows={3}
                        value={content.mission || ''}
                        onChange={(e) => updateField(['mission'], e.target.value)}
                        className="w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition resize-none"
                        placeholder="Your mission..."
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Team */}
              <section>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4 pb-2 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                    <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Team Members</h2>
                  </div>
                  <button
                    onClick={addTeam}
                    className="inline-flex items-center gap-1 text-xs sm:text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Member
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    Team Section Description
                  </label>
                  <textarea
                    rows={2}
                    value={content.team_description || ''}
                    onChange={(e) => updateField(['team_description'], e.target.value)}
                    className="w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition resize-none"
                    placeholder="Describe your team..."
                  />
                </div>

                <div className="space-y-4">
                  {content.team?.map((member, idx) => (
                    <div key={idx} className="border border-[var(--border)] rounded-lg p-4 sm:p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={member.name}
                          onChange={(e) => updateTeam(idx, 'name', e.target.value)}
                          className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                        />
                        <input
                          type="text"
                          placeholder="Role / Title"
                          value={member.role}
                          onChange={(e) => updateTeam(idx, 'role', e.target.value)}
                          className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <input
                          type="text"
                          placeholder="Email (optional)"
                          value={member.email || ''}
                          onChange={(e) => updateTeam(idx, 'email', e.target.value)}
                          className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                        />
                        <input
                          type="text"
                          placeholder="Bio (optional)"
                          value={member.bio || ''}
                          onChange={(e) => updateTeam(idx, 'bio', e.target.value)}
                          className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {member.image ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[var(--background-secondary)] border border-[var(--border)] flex-shrink-0">
                            <Image src={member.image} alt={member.name} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-[var(--foreground-muted)]" />
                          </div>
                        )}
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--background-secondary)] hover:bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs sm:text-sm transition">
                          <Upload className="w-3 h-3" />
                          {member.image ? 'Change' : 'Upload'}
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
                        <button
                          onClick={() => removeTeam(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!content.team || content.team.length === 0) && (
                    <p className="text-sm text-[var(--foreground-muted)] text-center py-4">
                      No team members added. Click "Add Member" to start.
                    </p>
                  )}
                </div>
              </section>

              {/* Stats */}
              <section>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4 pb-2 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                    <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Statistics</h2>
                  </div>
                  <button
                    onClick={addStat}
                    className="inline-flex items-center gap-1 text-xs sm:text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Stat
                  </button>
                </div>
                <div className="space-y-3">
                  {content.stats?.map((stat, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <input
                        type="text"
                        placeholder="Value (e.g., 1000+)"
                        value={stat.value}
                        onChange={(e) => updateStat(idx, 'value', e.target.value)}
                        className="w-full sm:w-40 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                      />
                      <input
                        type="text"
                        placeholder="Label (e.g., Customers)"
                        value={stat.label}
                        onChange={(e) => updateStat(idx, 'label', e.target.value)}
                        className="flex-1 w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                      />
                      <button
                        onClick={() => removeStat(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(!content.stats || content.stats.length === 0) && (
                    <p className="text-sm text-[var(--foreground-muted)] text-center py-4">
                      No statistics added yet.
                    </p>
                  )}
                </div>
              </section>

              {/* Signature */}
              <section>
                <div className="flex items-center gap-2 mb-3 sm:mb-4 pb-2 border-b border-[var(--border)]">
                  <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Founder Signature</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Signature Image
                    </label>
                    <p className="text-xs text-[var(--foreground-muted)] mb-3 opacity-70">
                      Upload a PNG with transparent background for best results
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      {content.signature_image ? (
                        <div className="relative p-4 border border-[var(--border)] rounded-lg bg-[var(--background-secondary)]">
                          <img
                            src={content.signature_image}
                            alt="Signature"
                            className="h-12 sm:h-16 object-contain"
                          />
                          <button
                            onClick={() => updateField(['signature_image'], '')}
                            className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-40 h-20 border-2 border-dashed border-[var(--border)] rounded-lg flex items-center justify-center text-[var(--foreground-muted)]">
                          <span className="text-xs">No signature</span>
                        </div>
                      )}
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--background-secondary)] hover:bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs sm:text-sm font-medium text-[var(--foreground)] transition">
                        <Upload className="w-3.5 h-3.5" />
                        {content.signature_image ? 'Replace' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={uploadSignatureImage}
                          disabled={uploadingImg}
                        />
                      </label>
                    </div>
                    {uploadingImg && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                        <Loader2 className="animate-spin w-3.5 h-3.5" />
                        Uploading signature...
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Signature Name
                    </label>
                    <input
                      type="text"
                      value={content.signature_name || ''}
                      onChange={(e) => updateField(['signature_name'], e.target.value)}
                      placeholder="e.g., Nicholas Thomas"
                      className="w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-2.5 sm:p-3 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Signature Title
                    </label>
                    <input
                      type="text"
                      value={content.signature_title || ''}
                      onChange={(e) => updateField(['signature_title'], e.target.value)}
                      placeholder="e.g., Founder & CEO"
                      className="w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-2.5 sm:p-3 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    />
                  </div>
                </div>
              </section>

              {/* Future Plans */}
              <section>
                <div className="flex items-center gap-2 mb-3 sm:mb-4 pb-2 border-b border-[var(--border)]">
                  <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Future Plans</h2>
                </div>
                <textarea
                  rows={4}
                  value={content.future_plans || ''}
                  onChange={(e) => updateField(['future_plans'], e.target.value)}
                  className="w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition resize-none"
                  placeholder="Share your roadmap and future goals..."
                />
              </section>

              {/* Community Link */}
              <section>
                <div className="flex items-center gap-2 mb-3 sm:mb-4 pb-2 border-b border-[var(--border)]">
                  <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
                  <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Community Link</h2>
                </div>
                <div>
                  <input
                    type="url"
                    value={content.community_link || ''}
                    onChange={(e) => updateField(['community_link'], e.target.value)}
                    className="w-full bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-2.5 sm:p-3 text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    placeholder="https://chat.whatsapp.com/your-invite-link"
                  />
                  <p className="text-xs text-[var(--foreground-muted)] mt-2 opacity-70">
                    This link will be used for the "Join Our Community" button on the About page.
                  </p>
                </div>
              </section>
            </div>
          ) : (
            // ===== IMAGES TAB =====
            <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
              {/* Image Mode */}
              <section>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-3">
                  Image Display Mode
                </label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="single"
                      checked={content.image_mode === 'single'}
                      onChange={() => updateField(['image_mode'], 'single')}
                      className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="text-sm">Single Image</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="carousel"
                      checked={content.image_mode === 'carousel'}
                      onChange={() => updateField(['image_mode'], 'carousel')}
                      className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="text-sm">Carousel / Slider</span>
                  </label>
                </div>
              </section>

              {/* Single Image */}
              {content.image_mode === 'single' && (
                <section>
                  <ImageUpload
                    label="Main About Image"
                    imageUrl={content.single_image_url}
                    onUpload={handleSingleImageUpload}
                    onRemove={removeSingleImage}
                    uploading={uploadingImg}
                  />
                </section>
              )}

              {/* Carousel */}
              {content.image_mode === 'carousel' && (
                <section>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-3">
                    Carousel Images
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {content.carousel_images?.map((url: string, idx: number) => (
                      <div key={idx} className="relative group border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--background-secondary)] aspect-square">
                        <Image src={url} alt={`Slide ${idx + 1}`} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                          <button
                            onClick={() => moveCarouselImage(idx, 'up')}
                            className="bg-black/60 hover:bg-black/80 p-1.5 rounded text-white transition"
                            disabled={idx === 0}
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveCarouselImage(idx, 'down')}
                            className="bg-black/60 hover:bg-black/80 p-1.5 rounded text-white transition"
                            disabled={idx === (content.carousel_images?.length || 0) - 1}
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeCarouselImage(idx)}
                            className="bg-red-600 hover:bg-red-700 p-1.5 rounded text-white transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <label className="aspect-square border-2 border-dashed border-[var(--border)] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--background-secondary)] transition">
                      <Plus className="w-6 h-6 text-[var(--foreground-muted)]" />
                      <span className="text-xs text-[var(--foreground-muted)] mt-1">Add Image</span>
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
                    <div className="mt-4 flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                      <Loader2 className="animate-spin w-4 h-4" />
                      Uploading image...
                    </div>
                  )}
                  <p className="text-xs text-[var(--foreground-muted)] mt-4 opacity-70">
                    Recommended image size: 800x600px. Use arrow buttons to reorder.
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
