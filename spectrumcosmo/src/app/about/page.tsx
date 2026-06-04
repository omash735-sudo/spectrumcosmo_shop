import { getDb } from '@/lib/db';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import Link from 'next/link';
import Image from 'next/image';
import DynamicImageViewer from '@/components/storefront/DynamicImageViewer';
import { 
  Sparkles, 
  Users, 
  ShoppingBag, 
  Globe, 
  Target, 
  Eye, 
  ArrowRight,
  Heart,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle,
  LucideIcon
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// Define types for stat and team members
interface StatItem {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface TeamMember {
  name: string;
  role: string;
  image?: string;
}

interface PageContent {
  history?: string;
  vision?: string;
  mission?: string;
  stats?: StatItem[];
  team?: TeamMember[];
  future_plans?: string;
  image_mode?: string;
  single_image_url?: string;
  carousel_images?: string[];
  community_link?: string;
}

export default async function AboutPage() {
  const sql = getDb();
  const [row] = await sql`SELECT content FROM page_contents WHERE page = 'about'`;
  const content = (row?.content || {}) as PageContent;

  const history = content.history || '';
  const vision = content.vision || 'To become the go-to destination for anime merchandise in Malawi and beyond.';
  const mission = content.mission || 'Celebrate anime passion and help fans express themselves proudly.';
  const stats: StatItem[] = content.stats || [
    { value: '2024', label: 'Year Started', icon: Calendar },
    { value: '1000+', label: 'Products Sold', icon: ShoppingBag },
    { value: '400+', label: 'Community Members', icon: Users },
    { value: '5+', label: 'Countries Served', icon: Globe }
  ];
  const team: TeamMember[] = content.team || [];
  const futurePlans = content.future_plans || 'Participate in conventions, host watch parties, support local anime culture.';
  const imageMode = content.image_mode || 'single';
  const singleImage = content.single_image_url || 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-04_at_21.52.23_bik6wg.jpg';
  const carouselImages = content.carousel_images || [];
  const communityLink = content.community_link || '';

  const coreValues = [
    { icon: Heart, title: 'Passion Driven', description: 'Everything we do is fueled by our love for anime and community.' },
    { icon: Award, title: 'Quality First', description: 'We ensure every product meets the highest standards.' },
    { icon: TrendingUp, title: 'Constant Growth', description: 'Always evolving with the anime culture and trends.' },
    { icon: CheckCircle, title: 'Customer Trust', description: 'Building lasting relationships through transparency.' },
  ];

  return (
    <>
      <Navbar />
      <main className="bg-white overflow-hidden">
        
        {/* Hero Section - Premium */}
        <section className="relative bg-gradient-to-br from-orange-50 via-white to-orange-50 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full mb-6">
                  <Sparkles size={14} className="text-orange-600" />
                  <span className="text-xs font-medium text-orange-600">Our Story</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  Wear Your{' '}
                  <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                    Excitement
                  </span>{' '}
                  With Pride
                </h1>
                <div className="prose prose-lg text-gray-600 leading-relaxed whitespace-pre-line">
                  {history}
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <DynamicImageViewer mode={imageMode} singleImage={singleImage} carouselImages={carouselImages} />
              </div>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-orange-500 text-sm font-semibold uppercase tracking-wider">What Drives Us</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Our Core Values</h2>
              <p className="text-gray-500 mt-3 max-w-2xl mx-auto">The principles that guide everything we do</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {coreValues.map((value, idx) => {
                const Icon = value.icon;
                return (
                  <div key={idx} className="group bg-white rounded-2xl p-6 text-center border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Icon size={28} className="text-orange-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
                    <p className="text-gray-500 text-sm">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Vision & Mission - Premium Cards */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Eye size={24} className="text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Vision</h2>
                <p className="text-gray-600 leading-relaxed">{vision}</p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target size={24} className="text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Mission</h2>
                <p className="text-gray-600 leading-relaxed">{mission}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - Animated Style */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-orange-500 text-sm font-semibold uppercase tracking-wider">Our Impact</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">By the Numbers</h2>
              <p className="text-gray-500 mt-3 max-w-2xl mx-auto">The milestones we're proud to have achieved</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat: StatItem, idx: number) => {
                const Icon = stat.icon || (idx === 0 ? Calendar : idx === 1 ? ShoppingBag : idx === 2 ? Users : Globe);
                return (
                  <div key={idx} className="text-center bg-gradient-to-br from-orange-50 to-white p-6 rounded-2xl border border-orange-100 group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Icon size={22} className="text-orange-600" />
                    </div>
                    <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-1">{stat.value}</div>
                    <div className="text-gray-600 text-sm">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Team Section - Premium */}
        {team.length > 0 && (
          <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-12">
                <span className="text-orange-500 text-sm font-semibold uppercase tracking-wider">Meet the Team</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Behind the Magic</h2>
                <p className="text-gray-500 mt-3 max-w-2xl mx-auto">The passionate people making it all happen</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {team.map((member: TeamMember, idx: number) => (
                  <div key={idx} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="relative h-64 overflow-hidden">
                      {member.image ? (
                        <img 
                          src={member.image} 
                          alt={member.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                          <Users size={48} className="text-orange-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-6 text-center">
                      <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                      <p className="text-orange-600 text-sm font-medium mt-1">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Future Plans Section */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto text-center px-4">
            <div className="inline-flex items-center gap-2 bg-orange-100 px-3 py-1 rounded-full mb-6">
              <Sparkles size={14} className="text-orange-600" />
              <span className="text-xs font-medium text-orange-600">What's Next</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Roadmap</h2>
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-8 border border-orange-100">
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-lg">{futurePlans}</p>
            </div>
          </div>
        </section>

        {/* CTA Section - Premium */}
        <section className="relative bg-gradient-to-br from-gray-900 to-gray-800 py-20 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative max-w-3xl mx-auto text-center px-4">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 px-3 py-1 rounded-full mb-6">
              <Heart size={14} className="text-orange-400" />
              <span className="text-xs font-medium text-orange-400">Join Us</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Be Part of{' '}
              <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                Something Special?
              </span>
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
              Join our growing community of anime enthusiasts in Malawi and beyond.
            </p>
            {communityLink ? (
              <a
                href={communityLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl group"
              >
                Join Our Community
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
            ) : (
              <p className="text-gray-400 text-sm">Community link not configured in admin.</p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
