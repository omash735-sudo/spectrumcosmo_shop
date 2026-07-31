'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Save, 
  RefreshCw,
  Power,
  PowerOff,
  Eye,
  EyeOff,
  Edit,
  X,
  Check,
} from 'lucide-react';
import { OnboardingStep } from '@/lib/onboarding/types';
import { DEFAULT_STEPS } from '@/lib/onboarding/steps';
import toast from 'react-hot-toast';

const PLACEMENT_OPTIONS = ['top', 'bottom', 'left', 'right', 'center'];
const DEVICE_OPTIONS = ['both', 'desktop', 'mobile'];

export default function AdminOnboardingPage() {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchSteps();
    fetchConfig();
  }, []);

  const fetchSteps = async () => {
    try {
      const res = await fetch('/api/admin/onboarding/steps');
      if (res.ok) {
        const data = await res.json();
        setSteps(data.steps || DEFAULT_STEPS);
      } else {
        setSteps(DEFAULT_STEPS);
      }
    } catch (err) {
      console.error('Failed to fetch steps:', err);
      setSteps(DEFAULT_STEPS);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/onboarding/config');
      if (res.ok) {
        const data = await res.json();
        setIsEnabled(data.isEnabled);
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/onboarding/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps }),
      });

      if (res.ok) {
        toast.success('Onboarding steps saved successfully!');
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      toast.error('Failed to save onboarding steps');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async () => {
    try {
      const res = await fetch('/api/admin/onboarding/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !isEnabled }),
      });

      if (res.ok) {
        setIsEnabled(!isEnabled);
        toast.success(`Tour ${!isEnabled ? 'enabled' : 'disabled'}`);
      }
    } catch (err) {
      toast.error('Failed to update config');
    }
  };

  const handleAddStep = () => {
    const newStep: OnboardingStep = {
      id: `step_${Date.now()}`,
      title: 'New Step',
      description: 'Add a description here',
      target: 'body',
      placement: 'bottom',
      isActive: true,
      order: steps.length,
      deviceType: 'both',
    };
    setSteps([...steps, newStep]);
    setEditingStep(newStep.id);
  };

  const handleDeleteStep = (id: string) => {
    if (steps.length <= 1) {
      toast.error('You must have at least one step');
      return;
    }
    setSteps(steps.filter(step => step.id !== id));
    toast.success('Step deleted');
  };

  const handleUpdateStep = (id: string, field: keyof OnboardingStep, value: any) => {
    setSteps(steps.map(step => 
      step.id === id ? { ...step, [field]: value } : step
    ));
  };

  const handleReorder = (dragIndex: number, dropIndex: number) => {
    const newSteps = [...steps];
    const [dragged] = newSteps.splice(dragIndex, 1);
    newSteps.splice(dropIndex, 0, dragged);
    setSteps(newSteps.map((step, index) => ({ ...step, order: index })));
  };

  const resetToDefaults = () => {
    if (confirm('Reset all steps to default configuration?')) {
      setSteps(DEFAULT_STEPS);
      toast.success('Reset to default steps');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <RefreshCw className="animate-spin text-[var(--primary)]" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Onboarding Tour</h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            Configure the guided tour for new users
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleToggleEnabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              isEnabled 
                ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200' 
                : 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-200'
            }`}
          >
            {isEnabled ? <Power size={16} /> : <PowerOff size={16} />}
            {isEnabled ? 'Enabled' : 'Disabled'}
          </button>
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--background-secondary)] transition"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition disabled:opacity-50"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`mb-6 p-4 rounded-lg border ${
        isEnabled 
          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' 
          : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            Tour is {isEnabled ? 'active' : 'inactive'} 
            {!isEnabled && ' — users will not see the onboarding tour'}
          </span>
        </div>
      </div>

      {/* Steps List */}
      <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--foreground)]">
            Tour Steps ({steps.length})
          </h2>
          <button
            onClick={handleAddStep}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition"
          >
            <Plus size={14} />
            Add Step
          </button>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {steps.map((step, index) => (
            <div key={step.id} className="p-4 hover:bg-[var(--background-secondary)] transition">
              {editingStep === step.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => handleUpdateStep(step.id, 'title', e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        placeholder="Step title"
                      />
                      <textarea
                        value={step.description}
                        onChange={(e) => handleUpdateStep(step.id, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        placeholder="Step description"
                      />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          value={step.target}
                          onChange={(e) => handleUpdateStep(step.id, 'target', e.target.value)}
                          className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] col-span-2"
                          placeholder="CSS selector"
                        />
                        <select
                          value={step.placement}
                          onChange={(e) => handleUpdateStep(step.id, 'placement', e.target.value)}
                          className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        >
                          {PLACEMENT_OPTIONS.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                        <select
                          value={step.deviceType}
                          onChange={(e) => handleUpdateStep(step.id, 'deviceType', e.target.value)}
                          className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        >
                          {DEVICE_OPTIONS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateStep(step.id, 'isActive', !step.isActive)}
                        className="p-1.5 rounded hover:bg-[var(--background-secondary)] transition"
                      >
                        {step.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        onClick={() => setEditingStep(null)}
                        className="p-1.5 rounded hover:bg-[var(--background-secondary)] transition text-emerald-600"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 cursor-move">
                    <GripVertical size={16} className="text-[var(--foreground-muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {step.title}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-[var(--background-secondary)] rounded text-[var(--foreground-muted)]">
                        {step.target}
                      </span>
                      {!step.isActive && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] truncate">
                      {step.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingStep(step.id)}
                      className="p-1.5 rounded hover:bg-[var(--background-secondary)] transition"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteStep(step.id)}
                      className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preview Section */}
      <div className="mt-6 p-4 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-[var(--foreground)]">Preview Tour</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              Preview how the tour will look to users
            </p>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 bg-[var(--background-card)] border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--background-secondary)] transition"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
        {showPreview && (
          <div className="mt-4 p-6 bg-[var(--background-card)] rounded-lg border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-[var(--primary)]">1 / {steps.length}</span>
              <span className="text-xs text-[var(--foreground-muted)]">•</span>
              <span className="text-xs text-[var(--foreground-muted)]">
                {Math.round((1 / steps.length) * 100)}%
              </span>
            </div>
            <h4 className="text-lg font-bold text-[var(--foreground)] mb-2">
              {steps[0]?.title || 'Welcome to SpectrumCosmo!'}
            </h4>
            <p className="text-sm text-[var(--foreground-muted)] mb-4">
              {steps[0]?.description || 'Your ultimate destination for anime-inspired merchandise.'}
            </p>
            <div className="flex items-center justify-between">
              <button className="px-3 py-2 text-sm font-medium text-[var(--foreground-muted)] border border-[var(--border)] rounded-lg">
                Skip
              </button>
              <button className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
