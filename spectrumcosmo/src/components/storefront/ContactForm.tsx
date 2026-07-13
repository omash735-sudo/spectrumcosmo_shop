'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ContactFormData {
  fullName: string;
  email: string;
  contactNumber: string;
  subject: string;
  message: string;
}

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    email: '',
    contactNumber: '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(true);
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({
        fullName: '',
        email: '',
        contactNumber: '',
        subject: '',
        message: '',
      });

      setTimeout(() => {
        setSuccess(false);
      }, 5000);

    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      toast.error(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {success && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">
            Message sent successfully! We'll get back to you within 24-48 hours.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Full Name *</label>
          <input 
            name="fullName" 
            type="text" 
            required
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Email Address *</label>
          <input 
            name="email" 
            type="email" 
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
            placeholder="john@example.com"
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Phone Number</label>
          <input 
            name="contactNumber" 
            type="tel" 
            value={formData.contactNumber}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-[var(--primary)]"
            placeholder="+265 123 456 789"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Subject</label>
          <input 
            name="subject" 
            type="text" 
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-[var(--primary)]"
            placeholder="How can we help?"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Message *</label>
        <textarea 
          name="message" 
          rows={5} 
          required
          value={formData.message}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
          placeholder="Tell us how we can help..."
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send size={18} className="group-hover:translate-x-0.5 transition" />
            Send Message
          </>
        )}
      </button>
      <p className="text-xs text-[var(--foreground-muted)] text-center">
        We'll get back to you within 24-48 hours
      </p>
    </form>
  );
}
