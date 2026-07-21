'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import Link from 'next/link';
import DynamicImageViewer from '@/components/storefront/DynamicImageViewer';
import Image from 'next/image';
import { 
  // Sparkles removed
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
  Mail,
  HelpCircle,
  LucideIcon,
  Flag // Added for Malawi icon
} from 'lucide-react';

interface StatItem {
  value: string;
  label: string;
  icon?: string;
}

interface TeamMember {
  name: string;
  role: string;
  image?: string;
  bio?: string;
  email?: string;
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
  signature_name?: string;
  signature_title?: string;
  signature_image?: string;
  team_description?: string;
}

const iconMap: Record<string, LucideIcon> = {
  Calendar, ShoppingBag, Users, Globe, Heart, Award, TrendingUp, CheckCircle, Target
};

export default function AboutPage() {
  const [content, setContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMember, setExpandedMember] = useState<number | null>(null);

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/admin/about');
      const data = await res.json();
      setContent(data);
    } catch (error) {
      console.error('Failed to fetch about content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();

    // Set up polling to check for updates every 30 seconds
    const interval = setInterval(fetchContent, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="bg-[var(--background)] min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
            <p className="text-[var(--foreground-muted)] text-sm sm:text-base">Loading about page...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // If no content or empty content, show a message with logo
  if (!content || Object.keys(content).length === 0) {
    return (
      <>
        <Navbar />
        <main className="bg-[var(--background)] min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="flex justify-center mb-6">
              <Image
                src="https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png"
                alt="SpectrumCosmo"
                width={160}
                height={60}
                className="object-contain"
              />
            </div>
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">About SpectrumCosmo</h2>
            <p className="text-[var(--foreground-muted)] text-sm">The about page content is being prepared. Check back later!</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const history = content.history || '';
  const vision = content.vision || '';
  const mission = content.mission || '';
  const stats = content.stats || [];
  const team = content.team || [];
  const futurePlans = content.future_plans || '';
  const imageMode = content.image_mode || 'single';
  const singleImage = content.single_image_url || '';
  const carouselImages = content.carousel_images || [];
  const communityLink = content.community_link || '';
  const signatureName = content.signature_name || '';
  const signatureTitle = content.signature_title || '';
  const signatureImage = content.signature_image || '';
  const teamDescription = content.team_description || '';

  const coreValues = [
    { icon: Heart, title: 'Passion Driven', description: 'Everything we do is fueled by our love for anime and community.' },
    { icon: Award, title: 'Quality First', description: 'We ensure every product meets the highest standards.' },
    { icon: TrendingUp, title: 'Constant Growth', description: 'Always evolving with the anime culture and trends.' },
    { icon: CheckCircle, title: 'Customer Trust', description: 'Building lasting relationships through transparency.' },
  ];

  return (
    <>
      <Navbar />
      <main className="bg-[var(--background)] overflow-hidden">
        
        {/* Hero Section - With Manga Panel */}
        {/* Reduced top padding: was py-20 md:py-28, now pt-12 md:pt-16 */}
        <section className="manga-bg hero-manga relative pt-12 md:pt-16 pb-16 md:pb-20 overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 px-4 py-1.5 rounded-full mb-6">
                  {/* Sparkles removed - just bold text */}
                  <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">Our Story</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--foreground)] mb-6 leading-tight">
                  Wear Your{' '}
                  <span className="text-[var(--primary)]">
                    Excitement
                  </span>{' '}
                  With Pride
                </h1>
                {history ? (
                  <div className="prose prose-lg text-[var(--foreground-muted)] leading-relaxed whitespace-pre-line max-w-2xl">
                    {history}
                  </div>
                ) : (
                  <p className="text-[var(--foreground-muted)] italic">No history content available.</p>
                )}
                
                {(signatureName || signatureImage) && (
                  <div className="mt-8 pt-6 border-t border-[var(--border)]">
                    <div className="flex items-center gap-4">
                      {signatureImage && (
                        <div className="flex-shrink-0">
                          <img 
                            src={signatureImage} 
                            alt="Signature" 
                            className="h-14 object-contain"
                          />
                        </div>
                      )}
                      <div>
                        {signatureName && (
                          <p className="text-lg font-semibold text-[var(--foreground)]">
                            {signatureName}
                          </p>
                        )}
                        {signatureTitle && (
                          <p className="text-sm text-[var(--foreground-muted)]">
                            {signatureTitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="order-1 lg:order-2">
                <div className="relative">
                  <DynamicImageViewer mode={imageMode} singleImage={singleImage} carouselImages={carouselImages} />
                  <div className="absolute -bottom-4 -right-4 bg-[var(--background-card)] rounded-xl shadow-lg p-3 border border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center">
                        {/* Replaced Sparkles with Malawi Flag icon */}
                        <Flag size={14} className="text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--foreground)]">Est. 2024</p>
                        <p className="text-[10px] text-[var(--foreground-muted)]">Malawi's Anime Hub</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-20 bg-[var(--background)]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <span className="text-[var(--primary)] text-sm font-semibold uppercase tracking-wider">What Drives Us</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mt-2">Our Core Values</h2>
              <p className="text-[var(--foreground-muted)] mt-3 max-w-2xl mx-auto">The principles that guide everything we do</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {coreValues.map((value, idx) => {
                const Icon = value.icon;
                return (
                  <div key={idx} className="group bg-[var(--background-card)] rounded-2xl p-8 text-center border border-[var(--border)] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/30">
                    <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:bg-[var(--primary)] transition-all duration-300">
                      <Icon size={28} className="text-[var(--primary)] group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">{value.title}</h3>
                    <p className="text-[var(--foreground-muted)] text-sm">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="py-20 bg-[var(--background-secondary)]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-[var(--primary)] text-sm font-semibold uppercase tracking-wider">Our Purpose</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mt-2">Vision & Mission</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[var(--background-card)] rounded-2xl p-8 shadow-sm border border-[var(--border)] hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                <div className="w-14 h-14 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Eye size={26} className="text-[var(--primary)]" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3">Our Vision</h2>
                {vision ? (
                  <p className="text-[var(--foreground-muted)] leading-relaxed text-lg">{vision}</p>
                ) : (
                  <p className="text-[var(--foreground-muted)] italic">No vision statement available.</p>
                )}
              </div>
              <div className="bg-[var(--background-card)] rounded-2xl p-8 shadow-sm border border-[var(--border)] hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                <div className="w-14 h-14 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Target size={26} className="text-[var(--primary)]" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3">Our Mission</h2>
                {mission ? (
                  <p className="text-[var(--foreground-muted)] leading-relaxed text-lg">{mission}</p>
                ) : (
                  <p className="text-[var(--foreground-muted)] italic">No mission statement available.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 bg-[var(--background)]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-[var(--primary)] text-sm font-semibold uppercase tracking-wider">Our Impact</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mt-2">By the Numbers</h2>
              <p className="text-[var(--foreground-muted)] mt-3 max-w-2xl mx-auto">The milestones we're proud to have achieved</p>
            </div>
            {stats.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat: StatItem, idx: number) => {
                  const Icon = stat.icon ? iconMap[stat.icon] : null;
                  return (
                    <div key={idx} className="text-center bg-[var(--background-card)] p-6 rounded-2xl border border-[var(--border)] group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      {Icon && (
                        <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <Icon size={22} className="text-[var(--primary)]" />
                        </div>
                      )}
                      <div className="text-3xl md:text-4xl font-bold text-[var(--primary)] mb-1">{stat.value}</div>
                      <div className="text-[var(--foreground-muted)] text-sm">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-[var(--foreground-muted)] italic">No statistics available.</p>
            )}
          </div>
        </section>

        {/* Team Section - With Manga Panel */}
        <section className="manga-bg cards-manga py-20 bg-[var(--background-secondary)]">
          <div className="relative z-10 max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-[var(--primary)] text-sm font-semibold uppercase tracking-wider">Meet the Team</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--foreground)] mt-2">
                {teamDescription || 'Our Team'}
              </h2>
              {team.length > 0 && (
                <p className="text-[var(--foreground-muted)] mt-3 max-w-2xl mx-auto text-sm md:text-base">
                  Dedicated to creating quality products for quality people.
                </p>
              )}
            </div>

            {team.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {team.map((member: TeamMember, idx: number) => {
                  const isExpanded = expandedMember === idx;
                  const hasBio = member.bio && member.bio.length > 0;

                  return (
                    <div 
                      key={idx} 
                      className={`group bg-[var(--background-card)] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[var(--border)] ${
                        isExpanded ? 'ring-2 ring-[var(--primary)] shadow-lg' : ''
                      }`}
                    >
                      <div className="relative h-56 md:h-72 overflow-hidden bg-[var(--background-secondary)]">
                        {member.image ? (
                          <img 
                            src={member.image} 
                            alt={member.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Users size={48} className="text-[var(--foreground-muted)]/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {member.email && (
                          <div className="absolute bottom-4 left-0 right-0 px-4 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                            <a 
                              href={`mailto:${member.email}`} 
                              className="inline-flex items-center gap-2 text-white text-xs md:text-sm bg-black/40 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-full hover:bg-black/60 transition"
                            >
                              <Mail size={14} />
                              {member.email}
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="p-5 md:p-6">
                        <div className="text-center">
                          <h3 className="text-lg md:text-xl font-bold text-[var(--foreground)]">{member.name}</h3>
                          <p className="text-[var(--primary)] text-sm font-medium mt-1">{member.role}</p>
                          
                          {member.bio && (
                            <div className="mt-3">
                              <p className={`text-[var(--foreground-muted)] text-sm leading-relaxed transition-all duration-300 ${
                                isExpanded ? '' : 'line-clamp-2'
                              }`}>
                                {member.bio}
                              </p>
                            </div>
                          )}

                          {member.email && (
                            <div className="mt-3 md:hidden">
                              <a 
                                href={`mailto:${member.email}`} 
                                className="inline-flex items-center gap-2 text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] transition"
                              >
                                <Mail size={14} />
                                {member.email}
                              </a>
                            </div>
                          )}

                          {hasBio && (
                            <button
                              onClick={() => setExpandedMember(isExpanded ? null : idx)}
                              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                            >
                              <span>{isExpanded ? 'Show Less' : 'Learn More'}</span>
                              <svg 
                                className={`w-4 h-4 transition-transform duration-300 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-[var(--foreground-muted)] italic">No team members listed.</p>
            )}
          </div>
        </section>

        {/* WHAT'S NEXT / ROADMAP SECTION - COMPLETELY REMOVED */}

        {/* CTA Section - Removed "Join Us" badge with heart */}
        <section className="bg-[var(--background-secondary)] py-20 overflow-hidden border-t border-[var(--border)]">
          <div className="max-w-3xl mx-auto text-center px-4">
            {/* "Join Us" badge with Heart icon REMOVED */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--foreground)] mb-6">
              Ready to Be Part of{' '}
              <span className="text-[var(--primary)]">
                Something Special?
              </span>
            </h2>
            <p className="text-[var(--foreground-muted)] text-lg mb-8 max-w-xl mx-auto">
              Join our growing community of anime enthusiasts in Malawi and beyond.
            </p>
            
            <div className="flex flex-col items-center gap-6">
              {communityLink ? (
                <a
                  href={communityLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-10 py-4 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl group"
                >
                  Join Our Community
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </a>
              ) : (
                <span className="text-[var(--foreground-muted)] text-sm">Community link not configured.</span>
              )}
              
              <Link
                href="/faq"
                className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors text-sm font-medium"
              >
                Frequently Asked Questions →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
