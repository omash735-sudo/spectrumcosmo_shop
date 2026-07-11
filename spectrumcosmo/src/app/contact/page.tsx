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
      <main className="min-h-screen bg-white dark:bg-gray-900">
        
        {/* Hero Section */}
        <div className="relative h-[400px] md:h-[500px] overflow-hidden">
          <Image
            src={heroImage}
            alt="Contact Us"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
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
              <div className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-gray-800 rounded-2xl p-6 border border-orange-100 dark:border-orange-900/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                    <Mail size={20} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">Email Us</h3>
                </div>
                <a href={`mailto:${contactDetails.email}`} className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition block">
                  {contactDetails.email}
                </a>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">We'll respond within 24 hours</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-800 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Phone size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">Call Us</h3>
                </div>
                <a href={`tel:${contactDetails.phone}`} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition block">
                  {contactDetails.phone}
                </a>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Mon-Fri, 9am - 6pm</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-gray-800 rounded-2xl p-6 border border-green-100 dark:border-green-900/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <MapPin size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">Visit Us</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{contactDetails.address}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">By appointment only</p>
              </div>

              {/* Social Links */}
              {(socialLinks.facebook || socialLinks.instagram || socialLinks.twitter || socialLinks.youtube) && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Follow Us</h3>
                  <div className="flex gap-3">
                    {socialLinks.facebook && (
                      <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition group">
                        <Facebook size={18} className="text-gray-600 dark:text-gray-400 group-hover:text-white" />
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-pink-500 hover:to-orange-500 transition group">
                        <Instagram size={18} className="text-gray-600 dark:text-gray-400 group-hover:text-white" />
                      </a>
                    )}
                    {socialLinks.twitter && (
                      <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-sky-500 transition group">
                        <Twitter size={18} className="text-gray-600 dark:text-gray-400 group-hover:text-white" />
                      </a>
                    )}
                    {socialLinks.youtube && (
                      <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-red-600 transition group">
                        <Youtube size={18} className="text-gray-600 dark:text-gray-400 group-hover:text-white" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 px-6 py-5 border-b dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{formTitle}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formSubtitle}</p>
                </div>
                <div className="p-6">
                  <form action="/api/contact" method="POST" className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label>
                        <input 
                          name="fullName" 
                          type="text" 
                          required
                          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address *</label>
                        <input 
                          name="email" 
                          type="email" 
                          required
                          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
                        <input 
                          name="contactNumber" 
                          type="tel" 
                          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500"
                          placeholder="+265 123 456 789"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
                        <input 
                          name="subject" 
                          type="text" 
                          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500"
                          placeholder="How can we help?"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message *</label>
                      <textarea 
                        name="message" 
                        rows={5} 
                        required
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        placeholder="Tell us how we can help..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
                    >
                      <Send size={18} className="group-hover:translate-x-0.5 transition" />
                      Send Message
                    </button>
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
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
                <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-950/30 px-3 py-1 rounded-full mb-3">
                  <Sparkles size={14} className="text-orange-600 dark:text-orange-400" />
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Why Choose Us</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Connect With Us</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Explore partnership opportunities</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                {featureGrid.map((item: any, idx: number) => {
                  const Icon = getIconForTitle(item.title);
                  return (
                    <Link
                      key={idx}
                      href={item.link || '#'}
                      className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 text-center"
                    >
                      <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-500 transition-colors">
                        <Icon size={24} className="text-orange-600 dark:text-orange-400 group-hover:text-white transition-colors" />
                      </div>
                      <h3 className="font-semibold text-gray-800 dark:text-white group-hover:text-orange-600 transition mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{item.description}</p>
                      <div className="mt-3 opacity-0 group-hover:opacity-100 transition">
                        <ArrowRight size={16} className="text-orange-500 mx-auto" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Community CTA */}
          {communityLink && (
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900 rounded-2xl p-8 text-center">
              <div className="inline-flex items-center gap-2 bg-orange-500/20 px-3 py-1 rounded-full mb-4">
                <Users size={14} className="text-orange-400" />
                <span className="text-xs font-medium text-orange-400">Join the Movement</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Become Part of Our Community</h3>
              <p className="text-gray-300 mb-6 max-w-md mx-auto">
                Connect with fellow anime enthusiasts and get exclusive updates
              </p>
              <a
                href={communityLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl group"
              >
                <MessageCircle size={18} />
                Join Our Community
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition" />
              </a>
            </div>
          )}

          {/* FAQ Link */}
          <div className="text-center mt-12">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Have questions? Check our{' '}
              <Link href="/faq" className="text-orange-600 dark:text-orange-500 hover:text-orange-700 dark:hover:text-orange-400 font-medium">
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
