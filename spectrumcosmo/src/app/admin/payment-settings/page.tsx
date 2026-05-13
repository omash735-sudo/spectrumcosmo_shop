'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, RefreshCw } from 'lucide-react';

export default function PaymentSettingsPage() {
  const [automaticEnabled, setAutomaticEnabled] = useState(true);
  const [manualEnabled, setManualEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/payment-settings');
        const data = await res.json();
        setAutomaticEnabled(data.automatic_enabled ?? true);
        setManualEnabled(data.manual_enabled ?? true);
      } catch (err) {
        console.error('Failed to fetch settings', err);
        setMessage({ type: 'error', text: 'Failed to load settings' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Save settings
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/payment-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automatic_enabled: automaticEnabled,
          manual_enabled: manualEnabled,
        }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Payment Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Enable or disable payment methods globally. Toggle off to hide all automatic or manual payment options from checkout.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Automatic Payments Toggle */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-gray-800">🤖 Automatic Payments</h3>
              <p className="text-sm text-gray-500 mt-1">
                OneKhusa / Mobile money instant payments. Customers will pay directly on their phone.
              </p>
            </div>
            <button
              onClick={() => setAutomaticEnabled(!automaticEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                automaticEnabled ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  automaticEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Manual Payments Toggle */}
          <div className="flex items-center justify-between py-3">
            <div>
              <h3 className="font-semibold text-gray-800">📝 Manual Payments</h3>
              <p className="text-sm text-gray-500 mt-1">
                Bank transfers, mobile money manual uploads. Customers submit proof of payment for admin verification.
              </p>
            </div>
            <button
              onClick={() => setManualEnabled(!manualEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                manualEnabled ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  manualEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 transition"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {message && (
              <p className={`mt-3 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message.text}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 rounded-2xl border border-blue-200 p-5">
        <h4 className="font-semibold text-blue-800 flex items-center gap-2">
          <RefreshCw size={18} /> What these settings do
        </h4>
        <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Automatic Payments OFF → Customers won't see instant payment options at checkout.</li>
          <li>Manual Payments OFF → Customers won't see bank transfer / manual upload options.</li>
          <li>Both ON → Customers can choose between instant or manual payment.</li>
          <li>Both OFF → No payment methods available (use only if you want to disable all payments).</li>
        </ul>
      </div>
    </div>
  );
}
