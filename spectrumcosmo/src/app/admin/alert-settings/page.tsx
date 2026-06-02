// app/admin/alert-settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Bell, BellOff, Mail } from 'lucide-react';

interface AlertSetting {
  email: string;
  receive_low_stock: boolean;
  receive_critical: boolean;
  receive_out_of_stock: boolean;
}

export default function AlertSettingsPage() {
  const [settings, setSettings] = useState<AlertSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/alert-settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch alert settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (email: string, updates: Partial<AlertSetting>) => {
    try {
      await fetch('/api/admin/alert-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ...updates }),
      });
      await fetchSettings();
    } catch (err) {
      console.error('Failed to update setting:', err);
    }
  };

  const deleteSetting = async (email: string) => {
    if (!confirm(`Remove ${email} from stock alerts?`)) return;
    try {
      await fetch(`/api/admin/alert-settings?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      await fetchSettings();
    } catch (err) {
      console.error('Failed to delete setting:', err);
    }
  };

  const addSetting = async () => {
    if (!newEmail) return;
    setSaving(true);
    try {
      await fetch('/api/admin/alert-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, receive_low_stock: true, receive_critical: true, receive_out_of_stock: true }),
      });
      setNewEmail('');
      setShowAddModal(false);
      await fetchSettings();
    } catch (err) {
      console.error('Failed to add setting:', err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Stock Alert Settings</h1>
          <p className="text-gray-500 mt-1">Manage who receives inventory alert emails</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
        >
          <Plus size={16} />
          Add Email
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : settings.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          No email recipients configured. Add at least one email to receive stock alerts.
        </div>
      ) : (
        <div className="space-y-4">
          {settings.map((setting) => (
            <div key={setting.email} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">{setting.email}</span>
                </div>
                <button
                  onClick={() => deleteSetting(setting.email)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={setting.receive_out_of_stock}
                    onChange={(e) => updateSetting(setting.email, { receive_out_of_stock: e.target.checked })}
                    className="w-4 h-4 text-red-500 rounded"
                  />
                  <span className="text-sm">Out of Stock</span>
                  <Bell className="w-3 h-3 text-red-500" />
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={setting.receive_critical}
                    onChange={(e) => updateSetting(setting.email, { receive_critical: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded"
                  />
                  <span className="text-sm">Critical Stock (&le;3)</span>
                  <Bell className="w-3 h-3 text-orange-500" />
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={setting.receive_low_stock}
                    onChange={(e) => updateSetting(setting.email, { receive_low_stock: e.target.checked })}
                    className="w-4 h-4 text-yellow-500 rounded"
                  />
                  <span className="text-sm">Low Stock (below threshold)</span>
                  <BellOff className="w-3 h-3 text-yellow-500" />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Email Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Alert Recipient</h2>
              <button onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="admin@spectrumcosmo.com"
                />
              </div>
              <button
                onClick={addSetting}
                disabled={saving || !newEmail}
                className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Recipient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
