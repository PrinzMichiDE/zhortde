'use client';

import { useEffect, useState } from 'react';
import { Webhook, Plus, Trash2, Power, RefreshCw, AlertCircle } from 'lucide-react';

type WebhookType = {
  id: number;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
};

const AVAILABLE_EVENTS = [
  { value: 'link.created', label: 'Link Created', description: 'Triggered when a new link is created' },
  { value: 'link.clicked', label: 'Link Clicked', description: 'Triggered when a link is accessed' },
  { value: 'link.expired', label: 'Link Expired', description: 'Triggered when a link expires' },
  { value: 'paste.created', label: 'Paste Created', description: 'Triggered when a new paste is created' },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewWebhookModal, setShowNewWebhookModal] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: [] as string[],
  });
  const [testingWebhookId, setTestingWebhookId] = useState<number | null>(null);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  async function fetchWebhooks() {
    try {
      const res = await fetch('/api/user/webhooks');
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks);
      }
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createWebhook() {
    if (!newWebhook.url.trim() || newWebhook.events.length === 0) {
      alert('Please provide a URL and select at least one event');
      return;
    }

    try {
      const res = await fetch('/api/user/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWebhook),
      });

      if (res.ok) {
        const data = await res.json();
        setWebhooks([data.webhook, ...webhooks]);
        setNewWebhook({ url: '', events: [] });
        setShowNewWebhookModal(false);
      } else {
        const error = await res.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      console.error('Failed to create webhook:', error);
      alert('Failed to create webhook');
    }
  }

  async function deleteWebhook(id: number) {
    if (!confirm('Are you sure you want to delete this webhook?')) {
      return;
    }

    try {
      const res = await fetch(`/api/user/webhooks/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setWebhooks(webhooks.filter((wh) => wh.id !== id));
      } else {
        alert('Failed to delete webhook');
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      alert('Failed to delete webhook');
    }
  }

  async function toggleWebhook(id: number, isActive: boolean) {
    try {
      const res = await fetch(`/api/user/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        setWebhooks(
          webhooks.map((wh) => (wh.id === id ? { ...wh, isActive: !isActive } : wh))
        );
      } else {
        alert('Failed to toggle webhook');
      }
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
      alert('Failed to toggle webhook');
    }
  }

  async function testWebhook(id: number) {
    setTestingWebhookId(id);
    try {
      const res = await fetch(`/api/user/webhooks/${id}/test`, {
        method: 'POST',
      });

      if (res.ok) {
        alert('✅ Test webhook sent successfully! Check your endpoint.');
      } else {
        const error = await res.json();
        alert('❌ Test failed: ' + error.error);
      }
    } catch (error) {
      console.error('Failed to test webhook:', error);
      alert('Failed to test webhook');
    } finally {
      setTestingWebhookId(null);
    }
  }

  function toggleEvent(eventValue: string) {
    if (newWebhook.events.includes(eventValue)) {
      setNewWebhook({
        ...newWebhook,
        events: newWebhook.events.filter((e) => e !== eventValue),
      });
    } else {
      setNewWebhook({
        ...newWebhook,
        events: [...newWebhook.events, eventValue],
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Webhook className="h-8 w-8" />
              Webhooks
            </h1>
            <p className="text-gray-600 mt-2">
              Receive real-time notifications when events occur
            </p>
          </div>
          <button
            onClick={() => setShowNewWebhookModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            New Webhook
          </button>
        </div>

        {/* Webhooks List */}
        {webhooks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Webhook className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No webhooks yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Create your first webhook to receive real-time notifications
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="bg-white rounded-lg shadow-sm p-6 border-l-4"
                style={{ borderLeftColor: webhook.isActive ? '#10b981' : '#ef4444' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 font-mono">
                        {webhook.url}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          webhook.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {webhook.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {webhook.events.map((event) => (
                        <span
                          key={event}
                          className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        <strong>Secret:</strong>{' '}
                        <code className="bg-gray-100 px-2 py-1 rounded">
                          {webhook.secret.substring(0, 16)}...
                        </code>
                      </p>
                      <p className="mt-1">
                        <strong>Last Triggered:</strong>{' '}
                        {webhook.lastTriggeredAt
                          ? new Date(webhook.lastTriggeredAt).toLocaleString('de-DE')
                          : 'Never'}
                      </p>
                      <p className="mt-1">
                        <strong>Created:</strong>{' '}
                        {new Date(webhook.createdAt).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleWebhook(webhook.id, webhook.isActive)}
                      className={`p-2 rounded hover:bg-gray-100 ${
                        webhook.isActive ? 'text-green-600' : 'text-red-600'
                      }`}
                      title={webhook.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <Power className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => testWebhook(webhook.id)}
                      disabled={testingWebhookId === webhook.id}
                      className="p-2 rounded hover:bg-gray-100 text-blue-600 disabled:opacity-50"
                      title="Test Webhook"
                    >
                      {testingWebhookId === webhook.id ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteWebhook(webhook.id)}
                      className="p-2 rounded hover:bg-gray-100 text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showNewWebhookModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Webhook</h2>
              
              <div className="mb-4">
                <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Endpoint URL
                </label>
                <input
                  type="url"
                  id="webhookUrl"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  placeholder="https://your-domain.com/webhook"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Events
                </label>
                <div className="space-y-2">
                  {AVAILABLE_EVENTS.map((event) => (
                    <label
                      key={event.value}
                      className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={newWebhook.events.includes(event.value)}
                        onChange={() => toggleEvent(event.value)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{event.label}</div>
                        <div className="text-sm text-gray-500">{event.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Webhook Security</p>
                    <p>
                      Each webhook request includes an <code className="bg-white px-1 rounded">X-Zhort-Signature</code> header
                      with an HMAC signature for verification. The secret will be shown once after creation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={createWebhook}
                  disabled={!newWebhook.url.trim() || newWebhook.events.length === 0}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Webhook
                </button>
                <button
                  onClick={() => {
                    setShowNewWebhookModal(false);
                    setNewWebhook({ url: '', events: [] });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Documentation */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">📖 Webhook Documentation</h3>
          <p className="text-sm text-blue-700 mb-3">
            Webhooks send POST requests with the following payload structure:
          </p>
          <div className="bg-white rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <pre>{`{
  "event": "link.created",
  "timestamp": "2025-11-07T12:00:00.000Z",
  "data": {
    "linkId": 123,
    "shortCode": "abc123",
    "longUrl": "https://example.com"
  }
}`}</pre>
          </div>
          <p className="text-sm text-blue-700 mt-3">
            Verify the signature using HMAC-SHA256 with your webhook secret.
          </p>
        </div>
      </div>
    </div>
  );
}

