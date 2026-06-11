'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { 
  Loader2, Send, Plus, CheckCircle, AlertCircle, Search, 
  ChevronDown, ChevronUp, HelpCircle, Package, CreditCard, 
  Truck, Sparkles, MessageCircle, X, Mail, Phone
} from 'lucide-react';
import Link from 'next/link';

type FAQ = {
  id: number;
  question: string;
  answer: string;
  category?: string;
  created_at: string;
};

const categories = [
  { id: 'all', label: 'All Questions', icon: HelpCircle },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'shipping', label: 'Shipping', icon: Truck },
];

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);
  const [showAskForm, setShowAskForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/faqs');
        if (!res.ok) throw new Error('Failed to load FAQs');
        const data = await res.json();
        setFaqs(data);
        setFilteredFaqs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  useEffect(() => {
    let filtered = faqs;
    
    if (activeCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === activeCategory);
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(term) || 
        faq.answer.toLowerCase().includes(term)
      );
    }
    
    setFilteredFaqs(filtered);
  }, [searchTerm, activeCategory, faqs]);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || question.length < 5) {
      setSubmitMessage({ type: 'error', text: 'Please enter a valid question (minimum 5 characters).' });
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, name, email }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit question');
      
      setSubmitMessage({ type: 'success', text: data.message || 'Question submitted! We will answer it soon.' });
      setQuestion('');
      setName('');
      setEmail('');
      setTimeout(() => {
        setShowAskForm(false);
        setSubmitMessage(null);
      }, 2000);
    } catch (err: any) {
      setSubmitMessage({ type: 'error', text: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFaq = (id: number) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="animate-pulse space-y-4">
              <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-5 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="space-y-3 mt-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5">
                    <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                    <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-950/30 px-3 py-1 rounded-full mb-4">
              <Sparkles size={14} className="text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Help Center</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl mx-auto">Find answers to common questions about ordering, payments, and delivery.</p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mb-8">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition shadow-sm"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm' 
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Icon size={14} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Ask Question Button */}
          {!showAskForm && (
            <div className="text-center mb-8">
              <button
                onClick={() => setShowAskForm(true)}
                className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 font-medium bg-orange-50 dark:bg-orange-950/30 px-5 py-2.5 rounded-full transition-all hover:bg-orange-100 dark:hover:bg-orange-950/50"
              >
                <Plus size={18} />
                Can't find your answer? Ask us
              </button>
            </div>
          )}

          {/* Ask Question Modal */}
          {showAskForm && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowAskForm(false)}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ask a Question</h2>
                    <button onClick={() => setShowAskForm(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                      <X size={20} className="text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">We'll answer your question as soon as possible</p>
                </div>
                <form onSubmit={handleSubmitQuestion} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Question *</label>
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="What would you like to know about our products or services?"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Name (optional)</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-orange-500"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Email (optional)</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-orange-500"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  {submitMessage && (
                    <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                      submitMessage.type === 'success' 
                        ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' 
                        : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                    }`}>
                      {submitMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                      {submitMessage.text}
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2.5 rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      {submitting ? 'Submitting...' : 'Submit Question'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAskForm(false);
                        setSubmitMessage(null);
                        setQuestion('');
                      }}
                      className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* FAQ List - Accordion Style */}
          {filteredFaqs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center shadow-sm">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle size={40} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No questions found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm ? `No results for "${searchTerm}"` : 'No FAQs available yet'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-orange-500 hover:text-orange-600 font-medium"
                >
                  Clear search →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  >
                    <span className="font-semibold text-gray-800 dark:text-white pr-4">{faq.question}</span>
                    {openFaqId === faq.id ? (
                      <ChevronUp size={18} className="text-orange-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {openFaqId === faq.id && (
                    <div className="px-5 pb-5 pt-0 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{faq.answer}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Updated {new Date(faq.created_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Still Need Help Section */}
          <div className="mt-12 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 rounded-2xl p-6 text-center border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Still need help?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Contact our support team for personalized assistance</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition shadow-sm"
              >
                <MessageCircle size={16} />
                Contact Support
              </Link>
              <a
                href="mailto:support@spectrumcosmo.com"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <Mail size={16} />
                Email Us
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
