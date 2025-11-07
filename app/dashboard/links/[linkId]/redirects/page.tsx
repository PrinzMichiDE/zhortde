'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowUp, ArrowDown, Smartphone, Globe, ChevronLeft } from 'lucide-react';

type SmartRedirect = {
  id: number;
  ruleType: string;
  condition: string;
  targetUrl: string;
  priority: number;
};

const RULE_TYPES = [
  { value: 'device', label: 'Device Type', icon: Smartphone },
  { value: 'geo', label: 'Geographic Location', icon: Globe },
];

const DEVICE_CONDITIONS = [
  { value: 'mobile', label: 'Mobile' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'desktop', label: 'Desktop' },
];

const GEO_CONDITIONS = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
];

export default function SmartRedirectsPage() {
  const params = useParams();
  const router = useRouter();
  const [redirects, setRedirects] = useState<SmartRedirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRedirectModal, setShowNewRedirectModal] = useState(false);
  const [newRedirect, setNewRedirect] = useState({
    ruleType: 'device',
    condition: '',
    targetUrl: '',
  });

  useEffect(() => {
    fetchRedirects();
  }, []);

  async function fetchRedirects() {
    try {
      const res = await fetch(`/api/links/${params.linkId}/redirects`);
      if (res.ok) {
        const data = await res.json();
        setRedirects(data.redirects);
      }
    } catch (error) {
      console.error('Failed to fetch redirects:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createRedirect() {
    if (!newRedirect.condition || !newRedirect.targetUrl) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch(`/api/links/${params.linkId}/redirects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRedirect),
      });

      if (res.ok) {
        const data = await res.json();
        setRedirects([...redirects, data.redirect]);
        setNewRedirect({ ruleType: 'device', condition: '', targetUrl: '' });
        setShowNewRedirectModal(false);
      } else {
        const error = await res.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      console.error('Failed to create redirect:', error);
      alert('Failed to create redirect');
    }
  }

  async function deleteRedirect(id: number) {
    if (!confirm('Are you sure you want to delete this redirect rule?')) {
      return;
    }

    try {
      const res = await fetch(`/api/links/${params.linkId}/redirects/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setRedirects(redirects.filter((r) => r.id !== id));
      } else {
        alert('Failed to delete redirect');
      }
    } catch (error) {
      console.error('Failed to delete redirect:', error);
      alert('Failed to delete redirect');
    }
  }

  async function updatePriority(id: number, direction: 'up' | 'down') {
    const index = redirects.findIndex((r) => r.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= redirects.length) return;

    const newRedirects = [...redirects];
    [newRedirects[index], newRedirects[newIndex]] = [newRedirects[newIndex], newRedirects[index]];

    // Update priorities
    newRedirects.forEach((redirect, idx) => {
      redirect.priority = idx;
    });

    setRedirects(newRedirects);

    // Save to backend
    try {
      await fetch(`/api/links/${params.linkId}/redirects/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newRedirects.map((r) => r.id) }),
      });
    } catch (error) {
      console.error('Failed to update priority:', error);
    }
  }

  const getConditionOptions = () => {
    return newRedirect.ruleType === 'device' ? DEVICE_CONDITIONS : GEO_CONDITIONS;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2 mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Redirects</h1>
              <p className="text-gray-600 mt-2">
                Configure device and geo-based redirect rules
              </p>
            </div>
            <button
              onClick={() => setShowNewRedirectModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Rule
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-700">
            <strong>💡 How it works:</strong> Rules are evaluated in order from top to bottom.
            The first matching rule determines where the user is redirected.
          </p>
        </div>

        {/* Redirects List */}
        {redirects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No redirect rules yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Create your first rule to enable smart redirects
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {redirects.map((redirect, index) => {
              const RuleIcon = RULE_TYPES.find((t) => t.value === redirect.ruleType)?.icon || Globe;
              return (
                <div
                  key={redirect.id}
                  className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => updatePriority(redirect.id, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => updatePriority(redirect.id, 'down')}
                      disabled={index === redirects.length - 1}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <RuleIcon className="h-6 w-6 text-indigo-600" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {redirect.ruleType}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {redirect.condition}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{redirect.targetUrl}</p>
                  </div>

                  <button
                    onClick={() => deleteRedirect(redirect.id)}
                    className="p-2 hover:bg-red-50 rounded text-red-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Modal */}
        {showNewRedirectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Redirect Rule</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Type
                  </label>
                  <select
                    value={newRedirect.ruleType}
                    onChange={(e) =>
                      setNewRedirect({ ...newRedirect, ruleType: e.target.value, condition: '' })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {RULE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition
                  </label>
                  <select
                    value={newRedirect.condition}
                    onChange={(e) => setNewRedirect({ ...newRedirect, condition: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select condition</option>
                    {getConditionOptions().map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target URL
                  </label>
                  <input
                    type="url"
                    value={newRedirect.targetUrl}
                    onChange={(e) => setNewRedirect({ ...newRedirect, targetUrl: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={createRedirect}
                  disabled={!newRedirect.condition || !newRedirect.targetUrl}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Rule
                </button>
                <button
                  onClick={() => {
                    setShowNewRedirectModal(false);
                    setNewRedirect({ ruleType: 'device', condition: '', targetUrl: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

