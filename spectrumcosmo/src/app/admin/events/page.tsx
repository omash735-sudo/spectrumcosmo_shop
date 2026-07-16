'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Plus, Edit, Trash2, ExternalLink, CalendarDays, X, Check, 
  Upload, Image as ImageIcon, Video, MapPin, Users, Calendar,
  Eye, EyeOff, AlertCircle, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Event {
  id: string;
  badge: string;
  title: string;
  detail: string;
  href: string;
  google_form_link: string;
  poster_image_url: string;
  poster_image_url_dark: string;
  registration_required: boolean;
  registration_form_url: string;
  registration_deadline: string;
  max_attendees: number;
  current_attendees: number;
  location: string;
  venue: string;
  is_online_event: boolean;
  event_date: string;
  event_end_date: string;
  featured: boolean;
  event_type: string;
  starts_at: string;
  ends_at: string;
  active: boolean;
}

const eventTypes = [
  { value: 'convention', label: 'Convention' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'sale', label: 'Sale' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'general', label: 'General' },
];

// ===== SKELETON =====
function EventsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-64 mt-1" />
        </div>
        <div className="h-10 bg-[var(--background-secondary)] rounded w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="aspect-[16/9] bg-[var(--background-secondary)]" />
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <div className="h-5 bg-[var(--background-secondary)] rounded w-16" />
                <div className="h-8 bg-[var(--background-secondary)] rounded w-16" />
              </div>
              <div className="h-6 bg-[var(--background-secondary)] rounded w-3/4" />
              <div className="space-y-1">
                <div className="h-4 bg-[var(--background-secondary)] rounded w-1/2" />
                <div className="h-4 bg-[var(--background-secondary)] rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingDark, setUploadingDark] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const darkFileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    id: '',
    badge: '',
    title: '',
    detail: '',
    href: '/events',
    google_form_link: '',
    poster_image_url: '',
    poster_image_url_dark: '',
    registration_required: false,
    registration_form_url: '',
    registration_deadline: '',
    max_attendees: 0,
    current_attendees: 0,
    location: '',
    venue: '',
    is_online_event: false,
    event_date: '',
    event_end_date: '',
    featured: false,
    event_type: 'general',
    starts_at: '',
    ends_at: '',
    active: true,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, type: 'light' | 'dark') => {
    if (type === 'light') setUploading(true);
    else setUploadingDark(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('/api/admin/upload-event-image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data.url;
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image');
      return null;
    } finally {
      if (type === 'light') setUploading(false);
      else setUploadingDark(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'light' | 'dark') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      e.target.value = '';
      return;
    }

    const url = await uploadImage(file, type);
    if (url) {
      if (type === 'light') {
        setFormData({ ...formData, poster_image_url: url });
        toast.success('Image uploaded successfully');
      } else {
        setFormData({ ...formData, poster_image_url_dark: url });
        toast.success('Dark mode image uploaded successfully');
      }
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.badge.trim()) {
      toast.error('Badge is required');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const url = editingEvent 
        ? `/api/admin/events/${editingEvent.id}`
        : '/api/admin/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save event');
      
      await fetchEvents();
      toast.success(editingEvent ? 'Event updated successfully' : 'Event created successfully');
      setShowModal(false);
      setEditingEvent(null);
      resetForm();
    } catch (err) {
      console.error('Error saving event:', err);
      toast.error('Failed to save event. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete event');
      await fetchEvents();
      toast.success('Event deleted successfully');
    } catch (err) {
      console.error('Error deleting event:', err);
      toast.error('Failed to delete event. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      badge: '',
      title: '',
      detail: '',
      href: '/events',
      google_form_link: '',
      poster_image_url: '',
      poster_image_url_dark: '',
      registration_required: false,
      registration_form_url: '',
      registration_deadline: '',
      max_attendees: 0,
      current_attendees: 0,
      location: '',
      venue: '',
      is_online_event: false,
      event_date: '',
      event_end_date: '',
      featured: false,
      event_type: 'general',
      starts_at: '',
      ends_at: '',
      active: true,
    });
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      id: event.id,
      badge: event.badge,
      title: event.title,
      detail: event.detail || '',
      href: event.href || '/events',
      google_form_link: event.google_form_link || '',
      poster_image_url: event.poster_image_url || '',
      poster_image_url_dark: event.poster_image_url_dark || '',
      registration_required: event.registration_required || false,
      registration_form_url: event.registration_form_url || '',
      registration_deadline: event.registration_deadline || '',
      max_attendees: event.max_attendees || 0,
      current_attendees: event.current_attendees || 0,
      location: event.location || '',
      venue: event.venue || '',
      is_online_event: event.is_online_event || false,
      event_date: event.event_date || '',
      event_end_date: event.event_end_date || '',
      featured: event.featured || false,
      event_type: event.event_type || 'general',
      starts_at: event.starts_at || '',
      ends_at: event.ends_at || '',
      active: event.active,
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
          <EventsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Events Management</h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
              Create and manage events with posters, registration, and more
            </p>
          </div>
          <button
            onClick={() => {
              setEditingEvent(null);
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-semibold transition shadow-sm text-sm sm:text-base min-h-[44px]"
          >
            <Plus size={18} />
            New Event
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-[var(--background-card)] p-3 sm:p-4 rounded-xl border border-[var(--border)] shadow-sm">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Total Events</p>
            <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">{events.length}</p>
          </div>
          <div className="bg-[var(--background-card)] p-3 sm:p-4 rounded-xl border border-[var(--border)] shadow-sm">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Active</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {events.filter(e => e.active).length}
            </p>
          </div>
          <div className="bg-[var(--background-card)] p-3 sm:p-4 rounded-xl border border-[var(--border)] shadow-sm">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">With Registration</p>
            <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
              {events.filter(e => e.registration_required).length}
            </p>
          </div>
          <div className="bg-[var(--background-card)] p-3 sm:p-4 rounded-xl border border-[var(--border)] shadow-sm">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Featured</p>
            <p className="text-lg sm:text-xl font-bold text-[var(--primary)]">
              {events.filter(e => e.featured).length}
            </p>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {events.length === 0 ? (
            <div className="col-span-full text-center py-12 sm:py-20 bg-[var(--background-card)] rounded-2xl border border-[var(--border)]">
              <CalendarDays size={40} className="sm:size-12 text-[var(--foreground-muted)] opacity-30 mx-auto mb-4" />
              <p className="text-sm text-[var(--foreground-muted)]">No events created yet.</p>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="mt-4 text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium text-sm"
              >
                Create your first event →
              </button>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="bg-[var(--background-card)] rounded-2xl overflow-hidden border border-[var(--border)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                {/* Poster */}
                <div className="relative w-full aspect-[16/9] bg-[var(--background-secondary)]">
                  {event.poster_image_url ? (
                    <Image
                      src={event.poster_image_url}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[var(--foreground-muted)] opacity-30">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  {event.featured && (
                    <div className="absolute top-2 right-2 bg-[var(--primary)] text-white px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-lg">
                      Featured
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-lg ${
                      event.active 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-gray-500 text-white'
                    }`}>
                      {event.active ? 'Active' : 'Inactive'}
                    </span>
                    {event.registration_required && (
                      <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-lg">
                        Registration
                      </span>
                    )}
                    {event.is_online_event && (
                      <span className="bg-purple-500 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-0.5 shadow-lg">
                        <Video size={10} /> Online
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase bg-orange-500/20 text-[var(--primary)] px-2 py-0.5 rounded">
                        {event.badge}
                      </span>
                      <span className="text-[10px] text-[var(--foreground-muted)]">
                        {event.event_type}
                      </span>
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => openEditModal(event)}
                        className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)] rounded-lg transition-colors"
                        title="Edit event"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                        title="Delete event"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-[var(--foreground)] text-sm sm:text-base mb-1 line-clamp-1">
                    {event.title}
                  </h3>

                  <div className="text-xs sm:text-sm text-[var(--foreground-muted)] space-y-0.5 mb-3">
                    {event.event_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-[var(--primary)] flex-shrink-0" />
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-[var(--primary)] flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    {event.max_attendees > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-[var(--primary)] flex-shrink-0" />
                        <span>{event.current_attendees || 0} / {event.max_attendees}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 pt-3 border-t border-[var(--border)]">
                    {event.registration_required && event.registration_form_url && (
                      <a
                        href={event.registration_form_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                      >
                        Registration <ExternalLink size={10} />
                      </a>
                    )}
                    {event.google_form_link && (
                      <a
                        href={event.google_form_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-green-600 dark:text-green-400 hover:underline flex items-center gap-0.5"
                      >
                        Google Form <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-[var(--background-card)] rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                    <CalendarDays size={16} className="text-[var(--primary)]" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
                    {editingEvent ? 'Edit Event' : 'Create New Event'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingEvent(null);
                    resetForm();
                  }}
                  className="p-1.5 hover:bg-[var(--background-secondary)] rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <X size={18} className="text-[var(--foreground-muted)]" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Badge <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="e.g., RESTOCK, SALE, EVENT"
                      className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Event Type
                    </label>
                    <select
                      value={formData.event_type}
                      onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)]"
                    >
                      {eventTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Event title"
                    className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={formData.detail}
                    onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                    placeholder="Event details"
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] resize-none"
                  />
                </div>

                {/* Poster Upload */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Poster Image (Light Mode)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'light')}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--background-secondary)] transition-colors disabled:opacity-50 text-xs sm:text-sm text-[var(--foreground)] min-h-[36px]"
                      >
                        <Upload size={14} />
                        {uploading ? 'Uploading...' : 'Upload Image'}
                      </button>
                      {formData.poster_image_url && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[var(--border)] flex-shrink-0">
                          <Image
                            src={formData.poster_image_url}
                            alt="Poster preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Poster Image (Dark Mode)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={darkFileInputRef}
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'dark')}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => darkFileInputRef.current?.click()}
                        disabled={uploadingDark}
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--background-secondary)] transition-colors disabled:opacity-50 text-xs sm:text-sm text-[var(--foreground)] min-h-[36px]"
                      >
                        <Upload size={14} />
                        {uploadingDark ? 'Uploading...' : 'Upload Image'}
                      </button>
                      {formData.poster_image_url_dark && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[var(--border)] flex-shrink-0">
                          <Image
                            src={formData.poster_image_url_dark}
                            alt="Poster preview dark"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Event Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Event End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.event_end_date}
                      onChange={(e) => setFormData({ ...formData, event_end_date: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City, Country"
                      className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Venue
                    </label>
                    <input
                      type="text"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="Specific venue name"
                      className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_online_event}
                      onChange={(e) => setFormData({ ...formData, is_online_event: e.target.checked })}
                      className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)] rounded"
                    />
                    <span className="text-xs sm:text-sm text-[var(--foreground)]">Online Event</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)] rounded"
                    />
                    <span className="text-xs sm:text-sm text-[var(--foreground)]">Featured Event</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)] rounded"
                    />
                    <span className="text-xs sm:text-sm text-[var(--foreground)]">Active</span>
                  </label>
                </div>

                {/* Registration Section */}
                <div className="border-t border-[var(--border)] pt-4 mt-4">
                  <h3 className="text-sm sm:text-base font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                    <Users size={16} className="text-[var(--primary)]" />
                    Registration Settings
                  </h3>

                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={formData.registration_required}
                      onChange={(e) => setFormData({ ...formData, registration_required: e.target.checked })}
                      className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)] rounded"
                    />
                    <span className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                      Require Registration
                    </span>
                  </label>

                  {formData.registration_required && (
                    <div className="space-y-3 sm:space-y-4 pl-4 sm:pl-6 border-l-2 border-[var(--primary)]">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                          Registration Form URL (External)
                        </label>
                        <input
                          type="url"
                          value={formData.registration_form_url}
                          onChange={(e) => setFormData({ ...formData, registration_form_url: e.target.value })}
                          placeholder="https://example.com/register"
                          className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                        />
                        <p className="text-[10px] text-[var(--foreground-muted)] mt-1 opacity-70">
                          Leave empty to use the built-in registration form
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                          Google Form Link (Optional)
                        </label>
                        <input
                          type="url"
                          value={formData.google_form_link}
                          onChange={(e) => setFormData({ ...formData, google_form_link: e.target.value })}
                          placeholder="https://forms.google.com/..."
                          className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                            Registration Deadline                          </label>
                          <input
                            type="datetime-local"
                            value={formData.registration_deadline}
                            onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                            Max Attendees
                          </label>
                          <input
                            type="number"
                            value={formData.max_attendees}
                            onChange={(e) => setFormData({ ...formData, max_attendees: parseInt(e.target.value) || 0 })}
                            placeholder="0 for unlimited"
                            className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-[var(--border)]">
                  <button
                    type="submit"
                    className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-6 py-2.5 rounded-xl font-semibold transition-colors text-sm min-h-[44px]"
                  >
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingEvent(null);
                      resetForm();
                    }}
                    className="px-6 py-2.5 rounded-xl border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors text-sm min-h-[44px]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
