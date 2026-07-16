'use client';

import { useState, useEffect } from 'react';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  X,
  AlertCircle,
  Mail,
  User,
  Calendar,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

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

// ===== SKELETON =====
function FAQsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-[var(--background-secondary)] rounded w-48" />
          <div className="h-4 bg-[var(--background-secondary)] rounded w-64 mt-1" />
        </div>
        <div className="h-10 bg-[var(--background-secondary)] rounded w-32" />
      </div>
      <div className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-[var(--background-secondary)] rounded w-3/4" />
                <div className="h-3 bg-[var(--background-secondary)] rounded w-1/2" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-[var(--background-secondary)] rounded" />
                <div className="h-8 w-8 bg-[var(--background-secondary)] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
      toast.error('Failed to load FAQs');
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
    if (!selectedFaq && !newQuestion) {
      toast.error('Please enter a question');
      return;
    }
    if (!selectedFaq && !newAnswer) {
      toast.error('Please enter an answer');
      return;
    }

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
        toast.success(selectedFaq ? 'FAQ updated successfully' : 'FAQ added successfully');
        await fetchFaqs();
        setShowModal(false);
        setSelectedFaq(null);
        setAnswer('');
        setNewQuestion('');
        setNewAnswer('');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save FAQ');
      }
    } catch (err) {
      console.error('Error saving FAQ:', err);
      toast.error('Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  const deleteFaq = async (id: number) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    
    try {
      const res = await fetch(`/api/admin/faqs?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('FAQ deleted successfully');
        await fetchFaqs();
      } else {
        toast.error('Failed to delete FAQ');
      }
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      toast.error('Failed to delete FAQ');
    }
  };

  const getStatusBadge = (faq: FAQ) => {
    if (faq.is_published && faq.is_answered) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full">
          <CheckCircle size={12} /> Published
        </span>
      );
    } else if (faq.is_answered) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full">
          <Eye size={12} /> Answered (Draft)
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full">
          <XCircle size={12} /> Pending
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
          <FAQsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">FAQ Management</h1>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
              Answer customer questions and manage FAQs
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl font-medium transition shadow-sm text-sm sm:text-base min-h-[44px]"
          >
            <Plus size={16} /> Add FAQ
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-[var(--background-card)] p-3 sm:p-4 rounded-xl border border-[var(--border)] shadow-sm">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Total FAQs</p>
            <p className="text-lg sm:text-xl font-bold text-[var(--foreground)]">{faqs.length}</p>
          </div>
          <div className="bg-[var(--background-card)] p-3 sm:p-4 rounded-xl border border-[var(--border)] shadow-sm">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Published</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {faqs.filter(f => f.is_published).length}
            </p>
          </div>
          <div className="bg-[var(--background-card)] p-3 sm:p-4 rounded-xl border border-[var(--border)] shadow-sm">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Answered</p>
            <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
              {faqs.filter(f => f.is_answered).length}
            </p>
          </div>
          <div className="bg-[var(--background-card)] p-3 sm:p-4 rounded-xl border border-[var(--border)] shadow-sm">
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">Pending</p>
            <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
              {faqs.filter(f => !f.is_answered).length}
            </p>
          </div>
        </div>

        {/* FAQ Table */}
        <div className="bg-[var(--background-card)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="text-[10px] sm:text-xs text-[var(--foreground-muted)] uppercase tracking-wider bg-[var(--background-secondary)]">
                  <th className="text-left px-4 sm:px-6 py-3">Question</th>
                  <th className="text-left px-4 sm:px-6 py-3 hidden md:table-cell">Status</th>
                  <th className="text-left px-4 sm:px-6 py-3 hidden lg:table-cell">Asked By</th>
                  <th className="text-left px-4 sm:px-6 py-3 hidden xl:table-cell">Date</th>
                  <th className="text-right px-4 sm:px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {faqs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 sm:px-6 py-12 text-center text-[var(--foreground-muted)]">
                      <HelpCircle size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No FAQs yet.</p>
                      <button
                        onClick={openAddModal}
                        className="mt-3 text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm font-medium"
                      >
                        Add your first FAQ →
                      </button>
                    </td>
                  </tr>
                ) : (
                  faqs.map((faq) => (
                    <tr key={faq.id} className="hover:bg-[var(--background-secondary)] transition">
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <p className="font-medium text-sm text-[var(--foreground)] line-clamp-2">
                          {faq.question}
                        </p>
                        {faq.answer && (
                          <p className="text-xs text-[var(--foreground-muted)] mt-1 line-clamp-1">
                            Answer: {faq.answer}
                          </p>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                        {getStatusBadge(faq)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-[var(--foreground-muted)] hidden lg:table-cell">
                        <span className="truncate max-w-[120px] block">
                          {faq.asked_by_name || faq.asked_by_email || 'Admin'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs text-[var(--foreground-muted)] hidden xl:table-cell">
                        {new Date(faq.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <button
                            onClick={() => openAnswerModal(faq)}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="Edit FAQ"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => deleteFaq(faq.id)}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="Delete FAQ"
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
      </div>

      {/* Answer/Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[var(--background-card)] rounded-2xl w-full max-w-lg shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--background-card)] flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                  <HelpCircle size={14} className="sm:w-4 sm:h-4 text-[var(--primary)]" />
                </div>
                <h2 className="font-bold text-[var(--foreground)] text-sm sm:text-base">
                  {selectedFaq ? 'Answer Question' : 'Add New FAQ'}
                </h2>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-1.5 hover:bg-[var(--background-secondary)] rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X size={18} className="text-[var(--foreground-muted)]" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4">
              {selectedFaq ? (
                <>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Question
                    </label>
                    <p className="bg-[var(--background-secondary)] p-3 rounded-lg text-sm text-[var(--foreground)]">
                      {selectedFaq.question}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Answer <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      rows={5}
                      className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] resize-none"
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
                        className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)] rounded"
                      />
                      <span className="text-xs sm:text-sm text-[var(--foreground)]">Publish on FAQ page</span>
                    </label>
                  </div>
                  {selectedFaq.asked_by_email && (
                    <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)] bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Mail size={12} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span>User will be notified via email when you save.</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Question <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                      placeholder="e.g., How do I track my order?"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                      Answer <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      rows={5}
                      className="w-full px-3 sm:px-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] resize-none"
                      placeholder="Write the answer here..."
                    />
                  </div>
                </>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAnswer}
                  disabled={saving || (!selectedFaq && (!newQuestion || !newAnswer))}
                  className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 transition min-h-[44px] flex items-center justify-center"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : (selectedFaq ? 'Save Answer' : 'Add FAQ')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
