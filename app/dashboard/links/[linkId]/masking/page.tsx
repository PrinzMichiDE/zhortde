'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Frame, Sparkles, Save, Wand2 } from 'lucide-react';
import { SPLASH_ANIMATIONS, ANIMATION_CATEGORIES, getAnimationById } from '@/lib/splash-animations';

type MaskingConfig = {
  enableFrame: boolean;
  enableSplash: boolean;
  splashDurationMs: number;
  splashHtml: string;
};

const DEFAULT_SPLASH_HTML = `<div class="text-center">
  <h1 class="text-4xl font-bold text-gray-900 mb-4">
    🚀 Redirecting...
  </h1>
  <p class="text-gray-600">
    You will be redirected shortly
  </p>
  <div class="mt-6">
    <div class="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
  </div>
</div>`;

export default function LinkMaskingPage() {
  const params = useParams();
  const router = useRouter();
  const [config, setConfig] = useState<MaskingConfig>({
    enableFrame: false,
    enableSplash: false,
    splashDurationMs: 3000,
    splashHtml: DEFAULT_SPLASH_HTML,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAnimations, setShowAnimations] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch(`/api/links/${params.linkId}/masking`);
      if (res.ok) {
        const data = await res.json();
        if (data.masking) {
          setConfig(data.masking);
        }
      }
    } catch (error) {
      console.error('Failed to fetch masking config:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    setSaving(true);
    try {
      const res = await fetch(`/api/links/${params.linkId}/masking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const error = await res.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      console.error('Failed to save masking config:', error);
      alert('Failed to save config');
    } finally {
      setSaving(false);
    }
  }

  function applyAnimation(animationId: string) {
    const animation = getAnimationById(animationId);
    if (animation) {
      setConfig({ ...config, splashHtml: animation.html });
      setShowAnimations(false);
    }
  }

  const filteredAnimations = selectedCategory === 'all'
    ? SPLASH_ANIMATIONS
    : SPLASH_ANIMATIONS.filter(a => a.category === selectedCategory);

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
              <h1 className="text-3xl font-bold text-gray-900">Link Masking</h1>
              <p className="text-gray-600 mt-2">
                Customize how your link is displayed to visitors
              </p>
            </div>
            <button
              onClick={saveConfig}
              disabled={saving}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              {saved ? (
                <>
                  ✓ Saved
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Frame Option */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Frame className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Frame Redirect</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableFrame}
                    onChange={(e) => setConfig({ ...config, enableFrame: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Display the destination URL within an iframe on your domain. The short link stays
                in the address bar.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                <strong>✅ Advantages:</strong>
                <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                  <li>Keeps your short URL visible in the browser</li>
                  <li>Maintains branding throughout the user journey</li>
                  <li>Can add custom headers/footers</li>
                </ul>
                <strong className="mt-2 block">⚠️ Limitations:</strong>
                <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                  <li>Some sites block iframe embedding (X-Frame-Options)</li>
                  <li>May affect SEO and social sharing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Splash Screen Option */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Splash Screen</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableSplash}
                    onChange={(e) => setConfig({ ...config, enableSplash: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Show a custom splash screen before redirecting to the destination URL.
              </p>

              {config.enableSplash && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (milliseconds)
                    </label>
                    <input
                      type="number"
                      value={config.splashDurationMs}
                      onChange={(e) =>
                        setConfig({ ...config, splashDurationMs: parseInt(e.target.value) || 3000 })
                      }
                      min="1000"
                      max="10000"
                      step="500"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: 2000-5000ms (2-5 seconds)
                    </p>
                  </div>

                  {/* Animation Gallery */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Choose Animation
                      </label>
                      <button
                        onClick={() => setShowAnimations(!showAnimations)}
                        className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
                      >
                        <Wand2 className="h-4 w-4" />
                        {showAnimations ? 'Hide' : 'Browse'} Animations
                      </button>
                    </div>

                    {showAnimations && (
                      <div className="bg-white border-2 border-purple-200 rounded-lg p-4 mb-4">
                        {/* Category Filter */}
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                          <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                              selectedCategory === 'all'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            All
                          </button>
                          {ANIMATION_CATEGORIES.map((cat) => (
                            <button
                              key={cat.value}
                              onClick={() => setSelectedCategory(cat.value)}
                              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                                selectedCategory === cat.value
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>

                        {/* Animation Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                          {filteredAnimations.map((animation) => (
                            <button
                              key={animation.id}
                              onClick={() => applyAnimation(animation.id)}
                              className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition text-center group"
                            >
                              <div className="text-4xl mb-2">{animation.preview}</div>
                              <div className="text-sm font-medium text-gray-900 group-hover:text-purple-600">
                                {animation.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {animation.description}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom HTML
                    </label>
                    <textarea
                      value={config.splashHtml}
                      onChange={(e) => setConfig({ ...config, splashHtml: e.target.value })}
                      rows={10}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                      placeholder={DEFAULT_SPLASH_HTML}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use HTML and Tailwind CSS classes. The splash will auto-redirect after the
                      specified duration.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfig({ ...config, splashHtml: DEFAULT_SPLASH_HTML })}
                      className="text-sm text-purple-600 hover:underline"
                    >
                      Reset to default template
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm mt-4">
                <strong>💡 Use Cases:</strong>
                <ul className="list-disc list-inside text-purple-700 mt-1 space-y-1">
                  <li>Display ads or sponsorship messages</li>
                  <li>Show terms & conditions</li>
                  <li>Build anticipation with branded loading screens</li>
                  <li>Collect analytics or show warnings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Warning */}
        {(config.enableFrame || config.enableSplash) && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Important:</strong> Masking features are active! Visitors will see{' '}
              {config.enableSplash && config.enableFrame
                ? 'the splash screen followed by the framed content'
                : config.enableSplash
                ? 'the splash screen before being redirected'
                : 'the destination URL in an iframe'}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

