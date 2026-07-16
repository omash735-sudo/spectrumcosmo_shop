'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, AlertCircle, Eye, FileText, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPrivacyPage() {
  const [content, setContent] = useState({ title: '', last_updated: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    fetch('/api/admin/privacy')
      .then(res => res.json())
      .then(data => { 
        setContent(data); 
        setLoading(false); 
      })
      .catch(() => {
        toast.error('Failed to load privacy policy content');
        setLoading(false);
      });
  }, []);

  const updateField = (field: string, value: string) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/privacy', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(content) 
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success('Privacy Policy saved successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Save failed';
      console.error('Save error:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[var(--primary)] w-8 h-8 mx-auto mb-3" />
          <p className="text-[var(--foreground-muted)]">Loading privacy policy content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--background-card)] border-b border-[var(--border)] shadow-sm">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)]">Privacy Policy</h1>
                <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-0.5">
                  Manage your store's privacy policy and data handling information
                </p>
              </div>
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition disabled:opacity-50 shadow-sm text-sm sm:text-base min-h-[44px]"
            >
              {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
          {/* Preview Toggle */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                {preview ? 'Preview Mode' : 'Edit Mode'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${preview ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' : 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400'}`}>
                {preview ? 'Viewing' : 'Editing'}
              </span>
            </div>
            <button
              onClick={() => setPreview(!preview)}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] transition"
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {preview ? 'Edit' : 'Preview'}
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {preview ? (
              /* Preview Mode */
              <div className="prose dark:prose-invert max-w-none">
                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 sm:p-4 mb-4">
                  <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    This is a preview of how your privacy policy will appear on the frontend.
                  </p>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">{content.title || 'Privacy Policy'}</h1>
                {content.last_updated && (
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Last Updated: {new Date(content.last_updated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
                <div 
                  className="mt-4 text-[var(--foreground)]"
                  dangerouslySetInnerHTML={{ __html: content.content || '<p>No content added yet.</p>' }} 
                />
              </div>
            ) : (
              /* Edit Mode */
              <>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    value={content.title}
                    onChange={e => updateField('title', e.target.value)}
                    placeholder="Privacy Policy"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)] mb-1.5">
                    Last Updated
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition"
                    value={content.last_updated}
                    onChange={e => updateField('last_updated', e.target.value)}
                  />
                  <p className="text-xs text-[var(--foreground-muted)] mt-1 opacity-70">
                    This date will be displayed on the frontend privacy policy page.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs sm:text-sm font-medium text-[var(--foreground-muted)]">
                      Content (HTML) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-[var(--foreground-muted)]">Supports HTML formatting</span>
                  </div>
                  <textarea
                    rows={15}
                    className="w-full px-3 py-2 sm:py-2.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm font-mono focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition resize-none"
                    value={content.content}
                    onChange={e => updateField('content', e.target.value)}
                    placeholder="<p>Write your privacy policy here...</p>"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-[10px] text-[var(--foreground-muted)] bg-[var(--background-secondary)] px-2 py-1 rounded">
                      Use <code className="text-[var(--primary)]">&lt;h2&gt;</code> for headings
                    </span>
                    <span className="text-[10px] text-[var(--foreground-muted)] bg-[var(--background-secondary)] px-2 py-1 rounded">
                      Use <code className="text-[var(--primary)]">&lt;ul&gt;</code> for lists
                    </span>
                    <span className="text-[10px] text-[var(--foreground-muted)] bg-[var(--background-secondary)] px-2 py-1 rounded">
                      Use <code className="text-[var(--primary)]">&lt;strong&gt;</code> for bold
                    </span>
                  </div>
                </div>

                {/* Character Count */}
                <div className="flex justify-end">
                  <span className="text-xs text-[var(--foreground-muted)]">
                    {content.content?.length || 0} characters
                  </span>
                </div>

                {/* Privacy Policy Tips */}
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400">
                    <strong>💡 Privacy Policy Tips:</strong>
                  </p>
                  <ul className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 mt-1.5 space-y-1 list-disc list-inside">
                    <li>Clearly state what data you collect and why</li>
                    <li>Explain how customer data is stored and protected</li>
                    <li>Mention any third-party services you use (payment providers, analytics, etc.)</li>
                    <li>Include contact information for privacy-related questions</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--border)] bg-[var(--background-secondary)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Changes will appear on the frontend privacy policy page immediately after saving.</span>
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition disabled:opacity-50 shadow-sm text-sm sm:text-base min-h-[44px]"
            >
              {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-4 sm:mt-6 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-800 p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-400">
                <strong>Pro Tip:</strong> Use the <strong>Preview</strong> toggle to see how your privacy policy will look on the frontend before saving. 
                You can use HTML tags like <code className="bg-purple-100 dark:bg-purple-900/50 px-1.5 py-0.5 rounded text-[10px]">&lt;h2&gt;</code>, 
                <code className="bg-purple-100 dark:bg-purple-900/50 px-1.5 py-0.5 rounded text-[10px]">&lt;ul&gt;</code>, and 
                <code className="bg-purple-100 dark:bg-purple-900/50 px-1.5 py-0.5 rounded text-[10px]">&lt;strong&gt;</code> to format your content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
