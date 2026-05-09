import { getDb } from '@/lib/db';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import Link from 'next/link';
import DynamicImageViewer from '@/components/storefront/DynamicImageViewer';

export const dynamic = 'force-dynamic';

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
        {/* Hero Section */}
        <div className="relative">
          {hero.mode === 'carousel' && hero.carousel_images?.length > 0 ? (
            <DynamicImageViewer mode="carousel" singleImage="" carouselImages={hero.carousel_images} />
          ) : hero.single_image ? (
            <div className="relative h-96 w-full">
              <img src={hero.single_image} alt="Contact" className="w-full h-full object-cover" />
            </div>
          ) : null}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4" style={{ color: hero.text_color }}>
            <h1 className="text-4xl md:text-5xl font-bold">{hero.title}</h1>
            <p className="text-lg mt-2">{hero.subtitle}</p>
          </div>
        </div>

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

          {/* Feature Grid */}
          {featureGrid.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {featureGrid.map((item: any, idx: number) => (
                <Link key={idx} href={item.link} className="bg-white p-5 rounded-xl shadow hover:shadow-md">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </Link>
              ))}
            </div>
          )}

          {/* Contact Details */}
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <h3 className="font-semibold mb-2">Contact Information</h3>
            <p className="text-sm">Email: {contactDetails.email}</p>
            <p className="text-sm">Phone: {contactDetails.phone}</p>
            <p className="text-sm">Address: {contactDetails.address}</p>
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
