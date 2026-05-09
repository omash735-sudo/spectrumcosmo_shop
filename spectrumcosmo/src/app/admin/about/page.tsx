'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Upload, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default function AdminAboutPage() {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'images'>('text');

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

  // Image upload helper (Cloudinary)
  const uploadImage = async (file: File): Promise<string | null> => {
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
      return data.secure_url || null;
    } catch (err) {
      console.error('Upload failed', err);
      return null;
    }
  };

  // Single image handlers
  const handleSingleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    const url = await uploadImage(file);
    if (url) updateField(['single_image_url'], url);
    setUploadingImg(false);
  };
  const removeSingleImage = () => updateField(['single_image_url'], '');

  // Carousel images handlers
  const addCarouselImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    const url = await uploadImage(file);
    if (url) {
      const images = [...(content.carousel_images || []), url];
      updateField(['carousel_images'], images);
    }
    setUploadingImg(false);
  };
  const removeCarouselImage = (idx: number) => {
    const images = [...(content.carousel_images || [])];
    images.splice(idx, 1);
    updateField(['carousel_images'], images);
  };
  const moveCarouselImage = (idx: number, direction: 'up' | 'down') => {
    const images = [...(content.carousel_images || [])];
    if (direction === 'up' && idx > 0) {
      [images[idx - 1], images[idx]] = [images[idx], images[idx - 1]];
    } else if (direction === 'down' && idx < images.length - 1) {
      [images[idx], images[idx + 1]] = [images[idx + 1], images[idx]];
    }
    updateField(['carousel_images'], images);
  };

  // Stats helpers (unchanged)
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

  // Team helpers (unchanged)
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
    const url = await uploadImage(file);
    if (url) updateTeam(idx, 'image', url);
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
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit About Page</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('text')}
          className={`px-4 py-2 font-medium ${activeTab === 'text' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'}`}
        >
          Text & Content
        </button>
        <button
          onClick={() => setActiveTab('images')}
          className={`px-4 py-2 font-medium ${activeTab === 'images' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'}`}
        >
          Images & Gallery
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border">
        {activeTab === 'text' ? (
          <div className="space-y-6">
            {/* History */}
            <div>
              <label className="block font-medium mb-1">Brand History</label>
              <textarea rows={10} value={content.history || ''} onChange={e => updateField(['history'], e.target.value)} className="w-full border rounded p-2" />
            </div>
            {/* Vision */}
            <div><label>Vision</label><textarea rows={2} value={content.vision || ''} onChange={e => updateField(['vision'], e.target.value)} className="w-full border rounded p-2" /></div>
            {/* Mission */}
            <div><label>Mission</label><textarea rows={2} value={content.mission || ''} onChange={e => updateField(['mission'], e.target.value)} className="w-full border rounded p-2" /></div>
            {/* Statistics */}
            <div>
              <label className="block font-medium mb-2">Statistics</label>
              {content.stats?.map((stat: any, idx: number) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <input placeholder="Value" value={stat.value} onChange={e => updateStat(idx, 'value', e.target.value)} className="border rounded p-1 w-32" />
                  <input placeholder="Label" value={stat.label} onChange={e => updateStat(idx, 'label', e.target.value)} className="border rounded p-1 flex-1" />
                  <button onClick={() => removeStat(idx)} className="text-red-500"><Trash2 size={16} /></button>
                </div>
              ))}
              <button onClick={addStat} className="text-orange-500 text-sm flex items-center gap-1"><Plus size={14} /> Add Stat</button>
            </div>
            {/* Team Members */}
            <div>
              <label className="block font-medium mb-2">Team Members</label>
              {content.team?.map((member: any, idx: number) => (
                <div key={idx} className="border rounded p-3 mb-3">
                  <div className="flex gap-2 mb-2">
                    <input placeholder="Name" value={member.name} onChange={e => updateTeam(idx, 'name', e.target.value)} className="border rounded p-1 flex-1" />
                    <input placeholder="Role" value={member.role} onChange={e => updateTeam(idx, 'role', e.target.value)} className="border rounded p-1 flex-1" />
                    <button onClick={() => removeTeam(idx)} className="text-red-500"><Trash2 size={16} /></button>
                  </div>
                  <div className="flex items-center gap-3">
                    {member.image && <div className="relative w-12 h-12 rounded-full overflow-hidden"><Image src={member.image} alt={member.name} fill className="object-cover" /></div>}
                    <label className="cursor-pointer bg-gray-100 px-3 py-1 rounded flex items-center gap-1"><Upload size={14} /> Upload Image
                      <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadTeamImage(idx, e.target.files[0]); }} />
                    </label>
                  </div>
                </div>
              ))}
              <button onClick={addTeam} className="text-orange-500 text-sm flex items-center gap-1"><Plus size={14} /> Add Team Member</button>
            </div>
            {/* Future Plans */}
            <div><label>Future Plans / Achievements</label><textarea rows={4} value={content.future_plans || ''} onChange={e => updateField(['future_plans'], e.target.value)} className="w-full border rounded p-2" /></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image Mode Toggle */}
            <div>
              <label className="block font-medium mb-2">Image Display Mode</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="radio" value="single" checked={content.image_mode === 'single'} onChange={() => updateField(['image_mode'], 'single')} /> Single Image
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" value="carousel" checked={content.image_mode === 'carousel'} onChange={() => updateField(['image_mode'], 'carousel')} /> Carousel / Slider
                </label>
              </div>
            </div>

            {/* Single Image Mode */}
            {content.image_mode === 'single' && (
              <div>
                <label className="block font-medium mb-2">Main About Image</label>
                {content.single_image_url ? (
                  <div className="relative w-full max-w-md h-48 rounded-lg overflow-hidden border">
                    <Image src={content.single_image_url} alt="About main" fill className="object-cover" />
                    <button onClick={removeSingleImage} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"><X size={16} /></button>
                  </div>
                ) : (
                  <div className="w-full max-w-md h-48 bg-gray-100 rounded-lg flex items-center justify-center border">
                    <ImageIcon className="text-gray-400" size={32} />
                    <p className="text-gray-500 ml-2">No image selected</p>
                  </div>
                )}
                <label className="cursor-pointer inline-flex items-center gap-2 mt-2 bg-gray-100 px-3 py-1 rounded">
                  <Upload size={14} /> {content.single_image_url ? 'Replace Image' : 'Upload Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleSingleImageUpload} disabled={uploadingImg} />
                </label>
                {uploadingImg && <Loader2 className="animate-spin ml-2 inline" size={16} />}
              </div>
            )}

            {/* Carousel Mode */}
            {content.image_mode === 'carousel' && (
              <div>
                <label className="block font-medium mb-2">Carousel Images (drag to order)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {content.carousel_images?.map((url: string, idx: number) => (
                    <div key={idx} className="relative group border rounded-lg overflow-hidden">
                      <div className="relative h-32 w-full">
                        <Image src={url} alt={`Slide ${idx + 1}`} fill className="object-cover" />
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => moveCarouselImage(idx, 'up')} className="bg-black/50 p-1 rounded text-white"><ChevronLeft size={14} /></button>
                        <button onClick={() => moveCarouselImage(idx, 'down')} className="bg-black/50 p-1 rounded text-white"><ChevronRight size={14} /></button>
                        <button onClick={() => removeCarouselImage(idx)} className="bg-red-600 p-1 rounded text-white"><X size={14} /></button>
                      </div>
                    </div>
                  ))}
                  <label className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                    <Plus size={24} className="text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">Add Image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={addCarouselImage} disabled={uploadingImg} />
                  </label>
                </div>
                {uploadingImg && <Loader2 className="animate-spin mt-2" size={16} />}
                <p className="text-xs text-gray-500 mt-2">You can reorder images using the left/right arrows. Minimum 1 image recommended for carousel.</p>
              </div>
            )}
          </div>
        )}

        <button onClick={save} disabled={saving} className="mt-6 bg-orange-500 text-white px-6 py-2 rounded w-full disabled:opacity-50">
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
    }
