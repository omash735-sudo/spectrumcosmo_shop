'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { Loader2, Send, Plus, CheckCircle, AlertCircle } from 'lucide-react';

type FAQ = {
  id: number;
  question: string;
  answer: string;
  created_at: string;
};

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAskForm, setShowAskForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch FAQs on load
  useEffect(() => {
    const fetchFaqs = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/faqs');
        if (!res.ok) throw new Error('Failed to load FAQs');
        const data = await res.json();
        setFaqs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

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
      setShowAskForm(false);
    } catch (err: any) {
      setSubmitMessage({ type: 'error', text: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin text-orange-500" size={32} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-500 mb-8">Find answers to common questions about ordering, payments, and delivery.</p>

          {/* Ask Question Button */}
          {!showAskForm && (
            <button
              onClick={() => setShowAskForm(true)}
              className="mb-8 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              <Plus size={18} />
              Ask a question
            </button>
          )}

          {/* Ask Question Form */}
          {showAskForm && (
            <div className="bg-white rounded-xl border p-6 mb-8">
              <h2 className="text-lg font-semibold mb-4">Ask a Question</h2>
              <form onSubmit={handleSubmitQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Question *</label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={3}
                    className="w-full border rounded-lg p-3 text-sm focus:ring-orange-500 focus:border-orange-500"
                    placeholder="What would you like to know about our products or services?"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name (optional)</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border rounded-lg p-2 text-sm"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Email (optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border rounded-lg p-2 text-sm"
                      placeholder="john@example.com"
                    />
                    <p className="text-xs text-gray-400 mt-1">We'll notify you when your question is answered.</p>
                  </div>
                </div>
                {submitMessage && (
                  <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${submitMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {submitMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {submitMessage.text}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
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
                    className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* FAQ List */}
          {faqs.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
              <p>No FAQs yet. Check back soon or ask a question above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition">
                  <h3 className="font-semibold text-gray-800 mb-2">{faq.question}</h3>
                  <p className="text-gray-600 text-sm">{faq.answer}</p>
                  <p className="text-xs text-gray-400 mt-3">Updated {new Date(faq.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
