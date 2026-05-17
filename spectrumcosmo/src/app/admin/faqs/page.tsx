'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, Eye, Edit, Trash2, Plus, X } from 'lucide-react';

type FAQ = {
  id: number;
  question: string;
  answer: string;
  is_published: boolean;
  is_answered: boolean;
  asked_by_name: string;
  asked_by_email: string;
  created_at: string;
  answered_at: string;
};

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [answer, setAnswer] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/faqs');
      const data = await res.json();
      setFaqs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const openAnswerModal = (faq: FAQ) => {
    setSelectedFaq(faq);
    setAnswer(faq.answer || '');
    setIsPublished(faq.is_published);
    setShowModal(true);
  };

  const openAddModal = () => {
    setSelectedFaq(null);
    setNewQuestion('');
    setNewAnswer('');
    setIsPublished(true);
    setShowModal(true);
  };

  const saveAnswer = async () => {
    if (!selectedFaq && !newQuestion) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          selectedFaq
            ? {
                id: selectedFaq.id,
                answer,
                is_published: isPublished,
                email: selectedFaq.asked_by_email,
                name: selectedFaq.asked_by_name,
                question: selectedFaq.question,
              }
            : {
                question: newQuestion,
                answer: newAnswer,
                is_published: true,
              }
        ),
      });
      if (res.ok) {
        await fetchFaqs();
        setShowModal(false);
        setSelectedFaq(null);
        setAnswer('');
        setNewQuestion('');
        setNewAnswer('');
      } else {
        alert('Failed to save');
      }
    } catch (err) {
      alert('Error saving');
    } finally {
      setSaving(false);
    }
  };

  const deleteFaq = async (id: number) => {
    if (!confirm('Delete this FAQ?')) return;
    await fetch(`/api/admin/faqs?id=${id}`, { method: 'DELETE' });
    await fetchFaqs();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ Management</h1>
          <p className="text-gray-500 text-sm mt-1">Answer customer questions and manage FAQs</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
        >
          <Plus size={16} /> Add FAQ
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider bg-gray-50">
                <th className="text-left px-6 py-3">Question</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Asked By</th>
                <th className="text-left px-6 py-3">Date</th>
                <th className="text-right px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {faqs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No FAQs yet.
                   </td>
                </tr>
              ) : (
                faqs.map((faq) => (
                  <tr key={faq.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm text-gray-800 line-clamp-2">{faq.question}</p>
                      {faq.answer && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">Answer: {faq.answer}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {faq.is_published && faq.is_answered ? (
                        <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full w-fit">
                          <CheckCircle size={12} /> Published
                        </span>
                      ) : faq.is_answered ? (
                        <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full w-fit">
                          <Eye size={12} /> Answered (Draft)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full w-fit">
                          <XCircle size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {faq.asked_by_name || faq.asked_by_email || 'Admin'}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(faq.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openAnswerModal(faq)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => deleteFaq(faq.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Answer/Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-[#111111]">
                {selectedFaq ? 'Answer Question' : 'Add New FAQ'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedFaq ? (
                <>
                  <div>
                    <label className="label">Question</label>
                    <p className="bg-gray-50 p-3 rounded-lg text-sm">{selectedFaq.question}</p>
                  </div>
                  <div>
                    <label className="label">Answer *</label>
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      rows={5}
                      className="input"
                      placeholder="Write your answer here..."
                      required
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPublished}
                        onChange={(e) => setIsPublished(e.target.checked)}
                        className="w-4 h-4 text-orange-500 rounded"
                      />
                      <span className="text-sm text-gray-600">Publish on FAQ page</span>
                    </label>
                  </div>
                  {selectedFaq.asked_by_email && (
                    <p className="text-xs text-gray-400">User will be notified via email when you save.</p>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="label">Question *</label>
                    <input
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className="input"
                      placeholder="e.g., How do I track my order?"
                    />
                  </div>
                  <div>
                    <label className="label">Answer *</label>
                    <textarea
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      rows={5}
                      className="input"
                      placeholder="Write the answer here..."
                    />
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAnswer}
                  disabled={saving || (!selectedFaq && (!newQuestion || !newAnswer))}
                  className="flex-1 bg-orange-500 text-white rounded-xl py-2 text-sm font-medium disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : (selectedFaq ? 'Save Answer' : 'Add FAQ')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
