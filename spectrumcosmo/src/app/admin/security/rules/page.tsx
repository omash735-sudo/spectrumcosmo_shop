'use client';

import { useEffect, useState } from 'react';
import { Shield, Edit, Save, X, RefreshCw, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface Rule {
  id: number;
  rule_key: string;
  rule_name: string;
  description: string;
  is_enabled: boolean;
  config: any;
}

export default function RulesManager() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [editingRule, setEditingRule] = useState<number | null>(null);
  const [editConfig, setEditConfig] = useState<any>({});

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/security/rules');
      const data = await res.json();
      setRules(data);
    } catch (err) {
      console.error('Failed to fetch rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const toggleRule = async (ruleId: number, currentEnabled: boolean) => {
    try {
      await fetch('/api/admin/security/rules/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, enabled: !currentEnabled }),
      });
      fetchRules();
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const startEdit = (rule: Rule) => {
    setEditingRule(rule.id);
    setEditConfig(rule.config);
  };

  const saveRule = async (ruleId: number, ruleKey: string) => {
    setSaving(ruleId);
    try {
      await fetch('/api/admin/security/rules/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, ruleKey, config: editConfig }),
      });
      setEditingRule(null);
      fetchRules();
    } catch (err) {
      console.error('Failed to save rule:', err);
    } finally {
      setSaving(null);
    }
  };

  const getRuleConfigFields = (ruleKey: string) => {
    const fields: Record<string, { label: string; type: string; min?: number; max?: number }[]> = {
      login_protection: [
        { label: 'Max Failed Attempts', type: 'number', min: 1, max: 20 },
        { label: 'Window (minutes)', type: 'number', min: 1, max: 60 },
        { label: 'Block Duration (minutes)', type: 'number', min: 1, max: 120 },
      ],
      rate_limiting: [
        { label: 'Max Requests', type: 'number', min: 10, max: 500 },
        { label: 'Window (seconds)', type: 'number', min: 10, max: 300 },
      ],
      suspicious_activity: [
        { label: 'Max Requests', type: 'number', min: 5, max: 100 },
        { label: 'Window (seconds)', type: 'number', min: 5, max: 60 },
        { label: 'Block Duration (minutes)', type: 'number', min: 5, max: 120 },
      ],
      checkout_protection: [
        { label: 'Max Attempts', type: 'number', min: 1, max: 50 },
        { label: 'Window (hours)', type: 'number', min: 1, max: 24 },
      ],
      auto_block: [
        { label: 'Risk Threshold', type: 'number', min: 30, max: 100 },
        { label: 'Block Duration (minutes)', type: 'number', min: 10, max: 120 },
      ],
      captcha_trigger: [
        { label: 'Failed Attempts Threshold', type: 'number', min: 1, max: 10 },
      ],
    };
    return fields[ruleKey] || [];
  };

  const renderConfigEditor = (rule: Rule) => {
    const fields = getRuleConfigFields(rule.rule_key);
    const keys = Object.keys(rule.config);
    
    return (
      <div className="space-y-3 mt-3">
        {fields.map((field, idx) => {
          const key = keys[idx] || 
            (field.label === 'Max Failed Attempts' ? 'max_attempts' :
             field.label === 'Window (minutes)' ? 'window_minutes' :
             field.label === 'Block Duration (minutes)' ? 'block_minutes' :
             field.label === 'Max Requests' ? 'max_requests' :
             field.label === 'Window (seconds)' ? 'window_seconds' :
             field.label === 'Window (hours)' ? 'window_hours' :
             field.label === 'Risk Threshold' ? 'risk_threshold' :
             field.label === 'Failed Attempts Threshold' ? 'failed_attempts_threshold' :
             'value');
          
          return (
            <div key={idx}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                type={field.type}
                min={field.min}
                max={field.max}
                value={editConfig[key] || ''}
                onChange={(e) => setEditConfig({
                  ...editConfig,
                  [key]: field.type === 'number' ? parseInt(e.target.value) : e.target.value,
                })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              />
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-[#F97316]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield size={32} className="text-[#F97316]" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Protection Rules</h1>
            <p className="text-gray-500 mt-1">Configure security rules dynamically</p>
          </div>
          <button
            onClick={fetchRules}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{rule.rule_name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      rule.is_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {rule.is_enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{rule.description}</p>
                  
                  {editingRule === rule.id ? (
                    <div className="border-t pt-4 mt-2">
                      {renderConfigEditor(rule)}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => saveRule(rule.id, rule.rule_key)}
                          disabled={saving === rule.id}
                          className="flex items-center gap-2 px-4 py-2 bg-[#F97316] text-white rounded-lg hover:bg-orange-600"
                        >
                          {saving === rule.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          Save
                        </button>
                        <button
                          onClick={() => setEditingRule(null)}
                          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(rule.config).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-gray-500">{key.replace(/_/g, ' ')}:</span>
                            <span className="ml-2 font-medium text-gray-900">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  {editingRule !== rule.id && (
                    <button
                      onClick={() => startEdit(rule)}
                      className="p-2 text-gray-500 hover:text-[#F97316] hover:bg-orange-50 rounded-lg transition"
                    >
                      <Edit size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => toggleRule(rule.id, rule.is_enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      rule.is_enabled ? 'bg-[#F97316]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        rule.is_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-700 mb-2">
            <AlertTriangle size={18} />
            <h4 className="font-semibold">How Dynamic Rules Work</h4>
          </div>
          <p className="text-sm text-blue-600">
            Changes to rules take effect immediately without redeployment. 
            The system checks the database every 60 seconds for rule updates.
            Rules are enforced at the middleware and API level in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
