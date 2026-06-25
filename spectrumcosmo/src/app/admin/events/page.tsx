'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Plus, Edit, Trash2, ExternalLink, CalendarDays, X, Check, 
  Upload, Image as ImageIcon, Video, MapPin, Users, Calendar,
  Eye, EyeOff
} from 'lucide-react';

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

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [uploading, setUploading] = useState(false);
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
    try {
      const res = await fetch('/api/admin/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      alert('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File, type: 'light' | 'dark') => {
    setUploading(true);
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
      alert('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'light' | 'dark') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file, type);
    if (url) {
      if (type === 'light') {
        setFormData({ ...formData, poster_image_url: url });
      } else {
        setFormData({ ...formData, poster_image_url_dark: url });
      }
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setShowModal(false);
      setEditingEvent(null);
      resetForm();
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Failed to save event. Please try again.');
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
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event. Please try again.');
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Events Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage events with posters, registration, and more
            </p>
          </div>
          <button
            onClick={() => {
              setEditingEvent(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            New Event
          </button>
        </div>

        {/* Events Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <CalendarDays size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No events created yet.</p>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  resetForm();
                  setShowModal(true);
                }}
                className="mt-4 text-orange-600 dark:text-orange-400 hover:underline font-medium"
              >
                Create your first event
              </button>
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                {/* Poster Preview */}
                <div className="relative w-full aspect-[16/9] bg-gray-100 dark:bg-gray-700">
                  {event.poster_image_url ? (
                    <Image
                      src={event.poster_image_url}
                      alt={event.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  {event.featured && (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Featured
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      event.active 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-500 text-white'
                    }`}>
                      {event.active ? 'Active' : 'Inactive'}
                    </span>
                    {event.registration_required && (
                      <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                        Registration
                      </span>
                    )}
                    {event.is_online_event && (
                      <span className="bg-purple-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Video size={10} /> Online
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs font-bold uppercase bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded">
                        {event.badge}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                        {event.event_type}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(event)}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                    {event.title}
                  </h3>

                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                    {event.event_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-orange-500" />
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-orange-500" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.max_attendees > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Users size={14} className="text-orange-500" />
                        <span>{event.current_attendees || 0} / {event.max_attendees}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100 dark:border-gray-700">
                    {event.registration_required && event.registration_form_url && (
                      <a
                        href={event.registration_form_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        Registration Form <ExternalLink size={12} />
                      </a>
                    )}
                    {event.google_form_link && (
                      <a
                        href={event.google_form_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
                      >
                        Google Form <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Events</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{events.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {events.filter(e => e.active).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">With Registration</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {events.filter(e => e.registration_required).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Featured</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {events.filter(e => e.featured).length}
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingEvent(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Badge <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="e.g., RESTOCK, SALE, EVENT"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Event Type
                    </label>
                    <select
                      value={formData.event_type}
                      onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Event title"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.detail}
                    onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                    placeholder="Event details"
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Poster Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Poster Image (Light Mode)
                    </label>
                    <div className="flex items-center gap-3">
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
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        <Upload size={16} />
                        {uploading ? 'Uploading...' : 'Upload Image'}
                      </button>
                      {formData.poster_image_url && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Poster Image (Dark Mode)
                    </label>
                    <div className="flex items-center gap-3">
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
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        <Upload size={16} />
                        {uploading ? 'Uploading...' : 'Upload Image'}
                      </button>
                      {formData.poster_image_url_dark && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Event Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Event End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.event_end_date}
                      onChange={(e) => setFormData({ ...formData, event_end_date: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City, Country"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Venue
                    </label>
                    <input
                      type="text"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="Specific venue name"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_online_event}
                      onChange={(e) => setFormData({ ...formData, is_online_event: e.target.checked })}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500 rounded"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">Online Event</label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500 rounded"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">Featured Event</label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500 rounded"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">Active</label>
                  </div>
                </div>

                {/* Registration Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Users size={18} />
                    Registration Settings
                  </h3>

                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      checked={formData.registration_required}
                      onChange={(e) => setFormData({ ...formData, registration_required: e.target.checked })}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Require Registration
                    </label>
                  </div>

                  {formData.registration_required && (
                    <div className="space-y-4 pl-6 border-l-2 border-orange-500">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Registration Form URL (External)
                        </label>
                        <input
                          type="url"
                          value={formData.registration_form_url}
                          onChange={(e) => setFormData({ ...formData, registration_form_url: e.target.value })}
                          placeholder="https://example.com/register"
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Leave empty to use the built-in registration form
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Google Form Link (Optional)
                        </label>
                        <input
                          type="url"
                          value={formData.google_form_link}
                          onChange={(e) => setFormData({ ...formData, google_form_link: e.target.value })}
                          placeholder="https://forms.google.com/..."
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Registration Deadline
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.registration_deadline}
                            onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Max Attendees
                          </label>
                          <input
                            type="number"
                            value={formData.max_attendees}
                            onChange={(e) => setFormData({ ...formData, max_attendees: parseInt(e.target.value) || 0 })}
                            placeholder="0 for unlimited"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-full font-semibold transition-colors"
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
                    className="px-6 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
