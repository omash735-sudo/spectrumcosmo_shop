// src/app/contact/page.tsx
import { getDb } from '@/lib/db';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import Link from 'next/link';
import { Handshake, HelpCircle, Users, Briefcase } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Map title to icon component (you can extend later)
const getIconForTitle = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes('collaboration')) return Handshake;
  if (lower.includes('support')) return HelpCircle;
  if (lower.includes('influencer')) return Users;
  if (lower.includes('business')) return Briefcase;
  return HelpCircle; // fallback
};

export default async function ContactPage() {
  const sql = getDb();
  const [row] = await sql`SELECT content FROM page_contents WHERE page = 'contact'`;
  const content = row?.content || {};

  const hero = content.hero || {
    mode: 'carousel',
    carousel_images: [],
    single_image: '',
    title: 'Contact Us',
    subtitle: 'We would love to hear from you',
    text_color: '#F97316',
  };
  const formTitle = content.form_title || 'Send us a message';
  const formSubtitle = content.form_subtitle || 'We usually respond within 24–48 hours';
  const featureGrid = content.feature_grid || [];
  const contactDetails = content.contact_details || {
    email: 'spectrumcosmo01@gmail.com',
    phone: '+265 893 160 202',
    address: 'Lilongwe, Malawi',
  };
  const communityLink = content.community_link || '';

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section - Using existing component (assume it handles carousel/single) */}
        {hero.mode === 'carousel' && hero.carousel_images?.length > 0 ? (
          <div className="relative h-96 w-full bg-gray-800 flex items-center justify-center">
            {/* Placeholder for carousel – you can reuse HeroCarousel here */}
            <img src={hero.carousel_images[0]} alt="Hero" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center">
              <h1 className="text-4xl text-white font-bold">{hero.title}</h1>
              <p className="text-white">{hero.subtitle}</p>
            </div>
          </div>
        ) : hero.single_image ? (
          <div className="relative h-96 w-full">
            <img src={hero.single_image} alt="Hero" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center">
              <h1 className="text-4xl text-white font-bold">{hero.title}</h1>
              <p className="text-white">{hero.subtitle}</p>
            </div>
          </div>
        ) : null}

        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow p-6 mb-10">
            <h2 className="text-xl font-semibold mb-1">{formTitle}</h2>
            <p className="text-sm text-gray-500 mb-6">{formSubtitle}</p>

            <form action="/api/contact" method="POST" className="space-y-4">
              <input name="fullName" placeholder="Full Name" className="w-full border p-3 rounded" required />
              <input name="email" type="email" placeholder="Email" className="w-full border p-3 rounded" required />
              <input name="contactNumber" placeholder="Phone Number" className="w-full border p-3 rounded" required />
              <textarea name="message" placeholder="Your message" rows={4} className="w-full border p-3 rounded" required />
              <button type="submit" className="w-full bg-[#F97316] text-white py-3 rounded hover:bg-orange-600 transition">
                Submit
              </button>
            </form>
          </div>

          {/* Feature Grid with Icons */}
          {featureGrid.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {featureGrid.map((item: any, idx: number) => {
                const Icon = getIconForTitle(item.title);
                return (
                  <Link
                    key={idx}
                    href={item.link}
                    className="bg-white p-5 rounded-xl shadow hover:shadow-md transition group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-100 rounded-full text-[#F97316] group-hover:bg-orange-200 transition">
                        <Icon size={20} />
                      </div>
                      <h3 className="font-semibold text-gray-800">{item.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 ml-2">{item.description}</p>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Contact Details & Community Link */}
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <h3 className="font-semibold mb-2">Contact Information</h3>
            <p className="text-sm">Email: {contactDetails.email}</p>
            <p className="text-sm">Phone: {contactDetails.phone}</p>
            <p className="text-sm">Address: {contactDetails.address}</p>
            {contactDetails.whatsapp_link && (
              <a href={contactDetails.whatsapp_link} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-[#F97316] text-sm underline">
                WhatsApp Community
              </a>
            )}
            {communityLink && (
              <a href={communityLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block bg-[#F97316] text-white px-4 py-2 rounded-full text-sm">
                Join Our Community
              </a>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
