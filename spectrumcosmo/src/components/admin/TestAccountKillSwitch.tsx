'use client';

import { useEffect, useState } from 'react';
import { Shield, Power, PowerOff, Loader2, User } from 'lucide-react';

export default function TestAccountKillSwitch() {
  const [enabled, setEnabled] = useState(true);
  const [testUser, setTestUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch('/api/admin/test-account')
      .then(res => res.json())
      .then(data => {
        setEnabled(data.enabled);
        setTestUser(data.testUser);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = async () => {
    setToggling(true);
    const res = await fetch('/api/admin/test-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !enabled }),
    });
    const data = await res.json();
    setEnabled(data.enabled);
    setToggling(false);
  };

  if (loading) {
    return <div className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Loading...</div>;
  }

  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
          <Shield size={20} className="text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Test Account Control</h3>
          <p className="text-xs text-gray-500">Kill switch for demonstration account</p>
        </div>
      </div>

      {testUser && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm">
          <User size={16} className="text-gray-500" />
          <span className="text-gray-600">Test account:</span>
          <span className="font-medium text-gray-800">{testUser.email}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            {enabled ? 'Test account is ACTIVE' : 'Test account is DISABLED'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {enabled 
              ? 'User can log in but cannot perform write actions' 
              : 'User is completely blocked from accessing the site'}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={toggling}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
            enabled 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {toggling ? (
            <Loader2 size={16} className="animate-spin" />
          ) : enabled ? (
            <>
              <PowerOff size={16} /> Disable Test Account
            </>
          ) : (
            <>
              <Power size={16} /> Enable Test Account
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-4 border-t pt-3">
        When disabled, the test user cannot log in at all. When enabled, they can log in but cannot place orders, submit reviews, or make any changes.
      </p>
    </div>
  );
}
