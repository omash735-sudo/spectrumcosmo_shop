// app/contact/page.tsx
import { getDb } from '@/lib/db';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import Link from 'next/link';
import Image from 'next/image';
import ContactForm from '@/components/storefront/ContactForm';
import { 
  Handshake, HelpCircle, Users, Briefcase, Mail, Phone, MapPin, 
  Sparkles, ArrowRight, MessageCircle,
  Facebook, Twitter, Instagram, Youtube
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
      <main className="min-h-screen bg-brand-black">
        
        {/* Hero Section */}
        <div className="relative h-[400px] md:h-[500px] overflow-hidden">
          <Image
            src={heroImage}
            alt="Contact Us"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-brand-black/70" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <div className="inline-flex items-center gap-2 bg-brand-orange/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Sparkles size={16} className="text-brand-orange" />
              <span className="text-brand-white text-sm font-medium">Get in Touch</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-white mb-4">
              {hero.title}
            </h1>
            <p className="text-brand-gray text-lg max-w-2xl">
              {hero.subtitle}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          
          {/* Contact Section Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-brand-card rounded-2xl p-6 border border-brand-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center">
                    <Mail size={20} className="text-brand-orange" />
                  </div>
                  <h3 className="font-semibold text-brand-white">Email Us</h3>
                </div>
                <a href={`mailto:${contactDetails.email}`} className="text-brand-gray hover:text-brand-orange transition block">
                  {contactDetails.email}
                </a>
                <p className="text-xs text-brand-gray mt-2">We'll respond within 24 hours</p>
              </div>

              <div className="bg-brand-card rounded-2xl p-6 border border-brand-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Phone size={20} className="text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-brand-white">Call Us</h3>
                </div>
                <a href={`tel:${contactDetails.phone}`} className="text-brand-gray hover:text-blue-500 transition block">
                  {contactDetails.phone}
                </a>
                <p className="text-xs text-brand-gray mt-2">Mon-Fri, 9am - 6pm</p>
              </div>

              <div className="bg-brand-card rounded-2xl p-6 border border-brand-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-900/30 rounded-xl flex items-center justify-center">
                    <MapPin size={20} className="text-green-500" />
                  </div>
                  <h3 className="font-semibold text-brand-white">Visit Us</h3>
                </div>
                <p className="text-brand-gray">{contactDetails.address}</p>
                <p className="text-xs text-brand-gray mt-2">By appointment only</p>
              </div>

              {/* Social Links */}
              {(socialLinks.facebook || socialLinks.instagram || socialLinks.twitter || socialLinks.youtube) && (
                <div className="bg-brand-card rounded-2xl p-6 border border-brand-border">
                  <h3 className="font-semibold text-brand-white mb-4">Follow Us</h3>
                  <div className="flex gap-3">
                    {socialLinks.facebook && (
                      <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-brand-black rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-brand-white transition group">
                        <Facebook size={18} className="text-brand-gray group-hover:text-brand-white" />
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-brand-black rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-pink-500 hover:to-orange-500 transition group">
                        <Instagram size={18} className="text-brand-gray group-hover:text-brand-white" />
                      </a>
                    )}
                    {socialLinks.twitter && (
                      <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-brand-black rounded-full flex items-center justify-center hover:bg-sky-500 transition group">
                        <Twitter size={18} className="text-brand-gray group-hover:text-brand-white" />
                      </a>
                    )}
                    {socialLinks.youtube && (
                      <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-brand-black rounded-full flex items-center justify-center hover:bg-red-600 transition group">
                        <Youtube size={18} className="text-brand-gray group-hover:text-brand-white" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-brand-card rounded-2xl shadow-lg border border-brand-border overflow-hidden">
                <div className="bg-brand-charcoal px-6 py-5 border-b border-brand-border">
                  <h2 className="text-xl font-bold text-brand-white">{formTitle}</h2>
                  <p className="text-sm text-brand-gray mt-1">{formSubtitle}</p>
                </div>
                <div className="p-6">
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          {featureGrid.length > 0 && (
            <div className="mb-16">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-brand-orange/10 px-3 py-1 rounded-full mb-3">
                  <Sparkles size={14} className="text-brand-orange" />
                  <span className="text-xs font-medium text-brand-orange">Why Choose Us</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-brand-white">Connect With Us</h2>
                <p className="text-brand-gray mt-2">Explore partnership opportunities</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                {featureGrid.map((item: any, idx: number) => {
                  const Icon = getIconForTitle(item.title);
                  return (
                    <Link
                      key={idx}
                      href={item.link || '#'}
                      className="group bg-brand-card rounded-2xl p-6 border border-brand-border shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 text-center"
                    >
                      <div className="w-14 h-14 bg-brand-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-brand-orange transition-colors">
                        <Icon size={24} className="text-brand-orange group-hover:text-brand-white transition-colors" />
                      </div>
                      <h3 className="font-semibold text-brand-white group-hover:text-brand-orange transition mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-brand-gray line-clamp-2">{item.description}</p>
                      <div className="mt-3 opacity-0 group-hover:opacity-100 transition">
                        <ArrowRight size={16} className="text-brand-orange mx-auto" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Community CTA */}
          {communityLink && (
            <div className="bg-brand-charcoal rounded-2xl p-8 text-center border border-brand-border">
              <div className="inline-flex items-center gap-2 bg-brand-orange/10 px-3 py-1 rounded-full mb-4">
                <Users size={14} className="text-brand-orange" />
                <span className="text-xs font-medium text-brand-orange">Join the Movement</span>
              </div>
              <h3 className="text-2xl font-bold text-brand-white mb-3">Become Part of Our Community</h3>
              <p className="text-brand-gray mb-6 max-w-md mx-auto">
                Connect with fellow anime enthusiasts and get exclusive updates
              </p>
              <a
                href={communityLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-orangeHover text-brand-white px-8 py-3 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl group"
              >
                <MessageCircle size={18} />
                Join Our Community
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition" />
              </a>
            </div>
          )}

          {/* FAQ Link */}
          <div className="text-center mt-12">
            <p className="text-brand-gray text-sm">
              Have questions? Check our{' '}
              <Link href="/faq" className="text-brand-orange hover:text-brand-orangeHover font-medium">
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
