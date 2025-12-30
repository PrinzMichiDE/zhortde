'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BeakerIcon, TrophyIcon, TrashIcon, PlusIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface Variant {
  id: number;
  linkId: number;
  variantUrl: string;
  trafficPercentage: number;
  conversions: number;
  clicks: number;
  isWinner: boolean;
  createdAt: string;
}

export default function ABTestingPage() {
  const params = useParams();
  const router = useRouter();
  const linkId = parseInt(params.linkId as string);
  
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    variantUrl: '',
    trafficPercentage: 50,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVariants();
  }, [linkId]);

  const fetchVariants = async () => {
    try {
      const response = await fetch(`/api/links/${linkId}/variants`);
      const data = await response.json();
      if (data.success) {
        setVariants(data.variants);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.variantUrl) {
      setError('Bitte geben Sie eine Variant-URL ein');
      return;
    }

    try {
      const response = await fetch(`/api/links/${linkId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantUrl: formData.variantUrl,
          trafficPercentage: formData.trafficPercentage,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setVariants([...variants, data.variant]);
        setShowForm(false);
        setFormData({ variantUrl: '', trafficPercentage: 50 });
      } else {
        setError(data.error || 'Fehler beim Erstellen der Variante');
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten');
    }
  };

  const handleDelete = async (variantId: number) => {
    if (!confirm('Möchten Sie diese Variante wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/links/${linkId}/variants?variantId=${variantId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setVariants(variants.filter(v => v.id !== variantId));
      }
    } catch (error) {
      console.error('Error deleting variant:', error);
    }
  };

  const setWinner = async (variantId: number) => {
    try {
      const response = await fetch(`/api/links/${linkId}/variants`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId }),
      });

      if (response.ok) {
        fetchVariants();
      }
    } catch (error) {
      console.error('Error setting winner:', error);
    }
  };

  const totalTraffic = variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
  const totalClicks = variants.reduce((sum, v) => sum + v.clicks, 0);
  const totalConversions = variants.reduce((sum, v) => sum + v.conversions, 0);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-4">
            ← Zurück zum Dashboard
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
            A/B Testing
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testen Sie verschiedene Ziel-URLs und finden Sie die beste Conversion-Rate
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Stats Overview */}
        {variants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gesamt Klicks</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalClicks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TrophyIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gesamt Conversions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalConversions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <BeakerIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0.0'}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BeakerIcon className="h-6 w-6" />
                Varianten
              </CardTitle>
              <Button onClick={() => setShowForm(!showForm)} variant="default" size="sm">
                <PlusIcon className="h-5 w-5 mr-2" />
                Neue Variante
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showForm && (
              <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Input
                  id="variantUrl"
                  type="url"
                  label="Variant URL"
                  value={formData.variantUrl}
                  onChange={(e) => setFormData({ ...formData, variantUrl: e.target.value })}
                  placeholder="https://example.com/variant"
                  required
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Traffic-Anteil: {formData.trafficPercentage}%
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={formData.trafficPercentage}
                    onChange={(e) => setFormData({ ...formData, trafficPercentage: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>1%</span>
                    <span>100%</span>
                  </div>
                </div>
                {totalTraffic + formData.trafficPercentage > 100 && (
                  <Alert variant="warning">
                    Warnung: Gesamter Traffic-Anteil würde {totalTraffic + formData.trafficPercentage}% überschreiten
                  </Alert>
                )}
                <div className="flex gap-2">
                  <Button type="submit" variant="default" disabled={totalTraffic + formData.trafficPercentage > 100}>
                    Variante erstellen
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                    Abbrechen
                  </Button>
                </div>
              </form>
            )}

            {variants.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <BeakerIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Varianten erstellt</p>
                <p className="text-sm mt-2">Erstellen Sie Varianten, um verschiedene Ziel-URLs zu testen</p>
              </div>
            ) : (
              <div className="space-y-4">
                {variants.map((variant) => {
                  const conversionRate = variant.clicks > 0 ? (variant.conversions / variant.clicks) * 100 : 0;
                  return (
                    <div
                      key={variant.id}
                      className={`p-6 rounded-lg border-2 ${
                        variant.isWinner
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {variant.isWinner && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                                <TrophyIcon className="h-3 w-3 mr-1" />
                                Gewinner
                              </span>
                            )}
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                              {variant.trafficPercentage}% Traffic
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all mb-4">
                            {variant.variantUrl}
                          </p>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Klicks</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{variant.clicks}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Conversions</p>
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">{variant.conversions}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Conversion Rate</p>
                              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                {conversionRate.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {!variant.isWinner && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setWinner(variant.id)}
                              className="text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700"
                            >
                              <TrophyIcon className="h-4 w-4 mr-1" />
                              Als Gewinner setzen
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(variant.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
