// app/contact/page.tsx
import { getDb } from '@/lib/db';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Handshake, HelpCircle, Users, Briefcase, Mail, Phone, MapPin, 
  Send, Sparkles, CheckCircle, Clock, MessageCircle, ArrowRight,
  Twitter, Facebook, Instagram, Youtube, Globe
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const getIconForTitle = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes('collaboration')) return Handshake;
  if (lower.includes('support')) return HelpCircle;
  if (lower.includes('influencer')) return Users;
  if (lower.includes('business')) return Briefcase;
  return HelpCircle;
};

export default async function ContactPage() {
  const sql = getDb();
  const [row] = await sql`SELECT content FROM page_contents WHERE page = 'contact'`;
  const content = row?.content || {};

  const hero = content.hero || {
    mode: 'carousel',
    carousel_images: [],
    single_image: '',
    title: 'Get in Touch',
    subtitle: 'We\'d love to hear from you',
    text_color: '#F97316',
  };
  const formTitle = content.form_title || 'Send us a message';
  const formSubtitle = content.form_subtitle || 'We typically respond within 24 hours';
  const featureGrid = content.feature_grid || [];
  const contactDetails = content.contact_details || {
    email: 'spectrumcosmo01@gmail.com',
    phone: '+265 893 160 202',
    address: 'Lilongwe, Malawi',
    whatsapp: '+265 893 160 202',
  };
  const communityLink = content.community_link || '';
  const socialLinks = content.social_links || {
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
  };

  const heroImage = hero.mode === 'carousel' && hero.carousel_images?.length > 0 
    ? hero.carousel_images[0] 
    : hero.single_image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200';

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--background)]">
        
        {/* Hero Section - With Manga Panel */}
        <div className="manga-bg hero-manga relative h-[400px] md:h-[500px] overflow-hidden">
          <Image
            src={heroImage}
            alt="Contact Us"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Sparkles size={16} className="text-orange-400" />
              <span className="text-white text-sm font-medium">Get in Touch</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              {hero.title}
            </h1>
            <p className="text-white/90 text-lg max-w-2xl">
              {hero.subtitle}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          
          {/* Contact Section Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-[var(--background-card)] rounded-2xl p-6 border border-[var(--border)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center">
                    <Mail size={20} className="text-[var(--primary)]" />
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)]">Email Us</h3>
                </div>
                <a href={`mailto:${contactDetails.email}`} className="text-[var(--foreground-muted)] hover:text-[var(--primary)] transition block">
                  {contactDetails.email}
                </a>
                <p className="text-xs text-[var(--foreground-muted)] mt-2">We'll respond within 24 hours</p>
              </div>

              <div className="bg-[var(--background-card)] rounded-2xl p-6 border border-[var(--border)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/30 rounded-xl flex items-center justify-center">
                    <Phone size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)]">Call Us</h3>
                </div>
                <a href={`tel:${contactDetails.phone}`} className="text-[var(--foreground-muted)] hover:text-blue-600 dark:hover:text-blue-400 transition block">
                  {contactDetails.phone}
                </a>
                <p className="text-xs text-[var(--foreground-muted)] mt-2">Mon-Fri, 9am - 6pm</p>
              </div>

              <div className="bg-[var(--background-card)] rounded-2xl p-6 border border-[var(--border)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-950/30 rounded-xl flex items-center justify-center">
                    <MapPin size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)]">Visit Us</h3>
                </div>
                <p className="text-[var(--foreground-muted)]">{contactDetails.address}</p>
                <p className="text-xs text-[var(--foreground-muted)] mt-2">By appointment only</p>
              </div>

              {/* Social Links */}
              {(socialLinks.facebook || socialLinks.instagram || socialLinks.twitter || socialLinks.youtube) && (
                <div className="bg-[var(--background-card)] rounded-2xl p-6 border border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--foreground)] mb-4">Follow Us</h3>
                  <div className="flex gap-3">
                    {socialLinks.facebook && (
                      <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[var(--background-secondary)] rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition group">
                        <Facebook size={18} className="text-[var(--foreground-muted)] group-hover:text-white" />
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[var(--background-secondary)] rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-pink-500 hover:to-orange-500 transition group">
                        <Instagram size={18} className="text-[var(--foreground-muted)] group-hover:text-white" />
                      </a>
                    )}
                    {socialLinks.twitter && (
                      <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[var(--background-secondary)] rounded-full flex items-center justify-center hover:bg-sky-500 transition group">
                        <Twitter size={18} className="text-[var(--foreground-muted)] group-hover:text-white" />
                      </a>
                    )}
                    {socialLinks.youtube && (
                      <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[var(--background-secondary)] rounded-full flex items-center justify-center hover:bg-red-600 transition group">
                        <Youtube size={18} className="text-[var(--foreground-muted)] group-hover:text-white" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-[var(--background-card)] rounded-2xl shadow-lg border border-[var(--border)] overflow-hidden">
                <div className="bg-[var(--background-secondary)] px-6 py-5 border-b border-[var(--border)]">
                  <h2 className="text-xl font-bold text-[var(--foreground)]">{formTitle}</h2>
                  <p className="text-sm text-[var(--foreground-muted)] mt-1">{formSubtitle}</p>
                </div>
                <div className="p-6">
                  <form action="/api/contact" method="POST" className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Full Name *</label>
                        <input 
                          name="fullName" 
                          type="text" 
                          required
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
                          className="w-full px-4 py-3 border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-[var(--primary)]"
                          placeholder="+265 123 456 789"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Subject</label>
                        <input 
                          name="subject" 
                          type="text" 
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
                        className="w-full px-4 py-3 border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                        placeholder="Tell us how we can help..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
                    >
                      <Send size={18} className="group-hover:translate-x-0.5 transition" />
                      Send Message
                    </button>
                    <p className="text-xs text-[var(--foreground-muted)] text-center">
                      We'll get back to you within 24-48 hours
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          {featureGrid.length > 0 && (
            <div className="mb-16">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 px-3 py-1 rounded-full mb-3">
                  <Sparkles size={14} className="text-[var(--primary)]" />
                  <span className="text-xs font-medium text-[var(--primary)]">Why Choose Us</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">Connect With Us</h2>
                <p className="text-[var(--foreground-muted)] mt-2">Explore partnership opportunities</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                {featureGrid.map((item: any, idx: number) => {
                  const Icon = getIconForTitle(item.title);
                  return (
                    <Link
                      key={idx}
                      href={item.link || '#'}
                      className="group bg-[var(--background-card)] rounded-2xl p-6 border border-[var(--border)] shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 text-center"
                    >
                      <div className="w-14 h-14 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[var(--primary)] transition-colors">
                        <Icon size={24} className="text-[var(--primary)] group-hover:text-white transition-colors" />
                      </div>
                      <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[var(--foreground-muted)] line-clamp-2">{item.description}</p>
                      <div className="mt-3 opacity-0 group-hover:opacity-100 transition">
                        <ArrowRight size={16} className="text-[var(--primary)] mx-auto" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Community CTA */}
          {communityLink && (
            <div className="bg-[var(--background-secondary)] rounded-2xl p-8 text-center border border-[var(--border)]">
              <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 px-3 py-1 rounded-full mb-4">
                <Users size={14} className="text-[var(--primary)]" />
                <span className="text-xs font-medium text-[var(--primary)]">Join the Movement</span>
              </div>
              <h3 className="text-2xl font-bold text-[var(--foreground)] mb-3">Become Part of Our Community</h3>
              <p className="text-[var(--foreground-muted)] mb-6 max-w-md mx-auto">
                Connect with fellow anime enthusiasts and get exclusive updates
              </p>
              <a
                href={communityLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-8 py-3 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl group"
              >
                <MessageCircle size={18} />
                Join Our Community
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition" />
              </a>
            </div>
          )}

          {/* FAQ Link */}
          <div className="text-center mt-12">
            <p className="text-[var(--foreground-muted)] text-sm">
              Have questions? Check our{' '}
              <Link href="/faq" className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium">
                Frequently Asked Questions
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
