'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';

export default function AdminAboutPage() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  useEffect(() => {
    fetch('/api/admin/about')
      .then(res => res.json())
      .then(data => {
        setContent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateField = (path: string[], value: any) => {
    setContent(prev => {
      const newContent = { ...prev };
      let cur = newContent;
      for (let i = 0; i < path.length - 1; i++) {
        if (!cur[path[i]]) cur[path[i]] = {};
        cur = cur[path[i]];
      }
      cur[path[path.length - 1]] = value;
      return newContent;
    });
  };

  // Stats helpers
  const addStat = () => updateField(['stats'], [...(content.stats || []), { value: '', label: '' }]);
  const removeStat = (idx: number) => {
    const stats = [...(content.stats || [])];
    stats.splice(idx, 1);
    updateField(['stats'], stats);
  };
  const updateStat = (idx: number, field: string, val: string) => {
    const stats = [...(content.stats || [])];
    stats[idx][field] = val;
    updateField(['stats'], stats);
  };

  // Team helpers
  const addTeam = () => updateField(['team'], [...(content.team || []), { name: '', role: '', image: '' }]);
  const removeTeam = (idx: number) => {
    const team = [...(content.team || [])];
    team.splice(idx, 1);
    updateField(['team'], team);
  };
  const updateTeam = (idx: number, field: string, val: string) => {
    const team = [...(content.team || [])];
    team[idx][field] = val;
    updateField(['team'], team);
  };

  const uploadTeamImage = async (idx: number, file: File) => {
    setUploadingImg(true);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'spectrumcosmo';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) updateTeam(idx, 'image', data.secure_url);
    } catch (err) {
      console.error('Upload failed');
    }
    setUploadingImg(false);
  };

  const save = async () => {
    setSaving(true);
    await fetch('/api/admin/about', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    });
    setSaving(false);
    alert('Saved successfully!');
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit About Page</h1>
      <div className="space-y-6 bg-white p-6 rounded-xl border">
        {/* History */}
        <div>
          <label className="block font-medium mb-1">Brand History</label>
          <textarea
            rows={10}
            value={content.history || ''}
            onChange={e => updateField(['history'], e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        {/* Vision */}
        <div>
          <label className="block font-medium mb-1">Vision</label>
          <textarea
            rows={2}
            value={content.vision || ''}
            onChange={e => updateField(['vision'], e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        {/* Mission */}
        <div>
          <label className="block font-medium mb-1">Mission</label>
          <textarea
            rows={2}
            value={content.mission || ''}
            onChange={e => updateField(['mission'], e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        {/* Statistics */}
        <div>
          <label className="block font-medium mb-2">Statistics</label>
          {content.stats?.map((stat: any, idx: number) => (
            <div key={idx} className="flex gap-2 mb-2 items-center">
              <input
                placeholder="Value (e.g., 2024)"
                value={stat.value}
                onChange={e => updateStat(idx, 'value', e.target.value)}
                className="border rounded p-1 w-32"
              />
              <input
                placeholder="Label (e.g., Year Started)"
                value={stat.label}
                onChange={e => updateStat(idx, 'label', e.target.value)}
                className="border rounded p-1 flex-1"
              />
              <button onClick={() => removeStat(idx)} className="text-red-500"><Trash2 size={16} /></button>
            </div>
          ))}
          <button onClick={addStat} className="text-orange-500 text-sm flex items-center gap-1">
            <Plus size={14} /> Add Stat
          </button>
        </div>

        {/* Team Members */}
        <div>
          <label className="block font-medium mb-2">Team Members</label>
          {content.team?.map((member: any, idx: number) => (
            <div key={idx} className="border rounded p-3 mb-3">
              <div className="flex gap-2 mb-2">
                <input
                  placeholder="Name"
                  value={member.name}
                  onChange={e => updateTeam(idx, 'name', e.target.value)}
                  className="border rounded p-1 flex-1"
                />
                <input
                  placeholder="Role"
                  value={member.role}
                  onChange={e => updateTeam(idx, 'role', e.target.value)}
                  className="border rounded p-1 flex-1"
                />
                <button onClick={() => removeTeam(idx)} className="text-red-500"><Trash2 size={16} /></button>
              </div>
              <div className="flex items-center gap-3">
                {member.image && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image src={member.image} alt={member.name} fill className="object-cover" />
                  </div>
                )}
                <label className="cursor-pointer bg-gray-100 px-3 py-1 rounded flex items-center gap-1">
                  <Upload size={14} /> Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files?.[0]) uploadTeamImage(idx, e.target.files[0]);
                    }}
                  />
                </label>
                {uploadingImg && <Loader2 size={16} className="animate-spin" />}
              </div>
            </div>
          ))}
          <button onClick={addTeam} className="text-orange-500 text-sm flex items-center gap-1">
            <Plus size={14} /> Add Team Member
          </button>
        </div>

        {/* Future Plans */}
        <div>
          <label className="block font-medium mb-1">Future Plans / Achievements</label>
          <textarea
            rows={4}
            value={content.future_plans || ''}
            onChange={e => updateField(['future_plans'], e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="bg-orange-500 text-white px-6 py-2 rounded w-full disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
    }
