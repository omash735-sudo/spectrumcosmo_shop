'use client';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminTermsPage() {
  const [content, setContent] = useState({ title: '', last_updated: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/terms')
      .then(res => res.json())
      .then(data => { setContent(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const updateField = (field: string, value: string) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  const save = async () => {
    setSaving(true);
    await fetch('/api/admin/terms', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(content) });
    setSaving(false);
    alert('Saved successfully!');
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Terms & Conditions</h1>
      <div className="bg-white p-6 rounded-xl border space-y-4">
        <div><label>Title</label><input className="input w-full" value={content.title} onChange={e => updateField('title', e.target.value)} /></div>
        <div><label>Last Updated</label><input type="date" className="input w-full" value={content.last_updated} onChange={e => updateField('last_updated', e.target.value)} /></div>
        <div><label>Content (HTML)</label><textarea rows={15} className="input w-full font-mono" value={content.content} onChange={e => updateField('content', e.target.value)} /></div>
        <button onClick={save} disabled={saving} className="bg-orange-500 text-white px-6 py-2 rounded w-full">{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>
    </div>
  );
}
