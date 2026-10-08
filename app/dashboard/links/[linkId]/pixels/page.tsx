'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartBarSquareIcon, PlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface TrackingPixel {
  id: number;
  linkId: number;
  pixelType: string;
  pixelId: string;
  events: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function LinkPixelsPage() {
  const params = useParams();
  const router = useRouter();
  const linkId = parseInt(params.linkId as string);

  const [pixels, setPixels] = useState<TrackingPixel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    pixelType: 'facebook',
    pixelId: '',
    conversions: true,
  });
  const [error, setError] = useState('');

  const fetchPixels = useCallback(async () => {
    try {
      const response = await fetch(`/api/links/${linkId}/pixels`);
      const data = await response.json();
      if (data.success) {
        setPixels(data.pixels);
      }
    } catch (error) {
      console.error('Error fetching pixels:', error);
    } finally {
      setLoading(false);
    }
  }, [linkId]);

  useEffect(() => {
    fetchPixels();
  }, [fetchPixels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.pixelId) {
      setError('Bitte geben Sie eine Pixel-ID ein');
      return;
    }

    try {
      const response = await fetch(`/api/links/${linkId}/pixels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pixelType: formData.pixelType,
          pixelId: formData.pixelId.trim(),
          events: ['pageview', ...(formData.conversions ? ['conversion'] : [])],
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPixels([...pixels, data.pixel]);
        setShowForm(false);
        setFormData({ pixelType: 'facebook', pixelId: '', conversions: true });
      } else {
        setError(data.error || 'Fehler beim Erstellen des Pixels');
      }
    } catch {
      setError('Ein Fehler ist aufgetreten');
    }
  };

  const handleDelete = async (pixelId: number) => {
    if (!confirm('Möchten Sie dieses Tracking-Pixel wirklich entfernen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/links/${linkId}/pixels?pixelId=${pixelId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPixels(pixels.filter(p => p.id !== pixelId));
      }
    } catch (error) {
      console.error('Error deleting pixel:', error);
    }
  };

  const eventList = (raw: string | null): string[] => {
    if (!raw) return ['pageview'];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : ['pageview'];
    } catch {
      return ['pageview'];
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push('/dashboard/links')} className="mb-4">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Zurück zu Links
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
            Tracking-Pixels
          </h1>
          <p className="text-muted-foreground">
            Retargeting-Pixel (Facebook, Google Analytics, Custom) für diese Seite feuern bei jedem Aufruf des Masked-Links
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {pixels.length === 0 && !showForm && (
          <div className="text-center py-12 bg-card rounded-lg border border-border mb-6">
            <ChartBarSquareIcon className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">Noch keine Tracking-Pixels konfiguriert</p>
            <p className="text-sm text-muted-foreground mt-2">Fügen Sie ein Pixel hinzu, um Conversions zu messen</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ChartBarSquareIcon className="h-6 w-6" />
                Konfigurierte Pixels
              </CardTitle>
              <Button onClick={() => setShowForm(!showForm)} variant="default" size="sm">
                <PlusIcon className="h-5 w-5 mr-2" />
                Pixel hinzufügen
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showForm && (
              <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Pixel-Typ
                  </label>
                  <select
                    value={formData.pixelType}
                    onChange={(e) => setFormData({ ...formData, pixelType: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                  >
                    <option value="facebook">Facebook Pixel</option>
                    <option value="google">Google Analytics 4</option>
                    <option value="custom">Custom Pixel (Tracking-Image URL)</option>
                  </select>
                </div>
                <Input
                  id="pixelId"
                  type="text"
                  label={formData.pixelType === 'custom' ? 'Tracking-Image URL' : 'Pixel-ID'}
                  value={formData.pixelId}
                  onChange={(e) => setFormData({ ...formData, pixelId: e.target.value })}
                  placeholder={
                    formData.pixelType === 'facebook'
                      ? 'z.B. 123456789012345'
                      : formData.pixelType === 'google'
                        ? 'z.B. G-ABCDEF123'
                        : 'https://track.example.com/beacon.png'
                  }
                  required
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="conversions"
                    checked={formData.conversions}
                    onChange={(e) => setFormData({ ...formData, conversions: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="conversions" className="text-sm text-gray-700 dark:text-gray-300">
                    Conversion-Event zusätzlich feuern
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="default">
                    Pixel speichern
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                    Abbrechen
                  </Button>
                </div>
              </form>
            )}

            {pixels.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>Keine Pixels konfiguriert</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pixels.map((pixel) => (
                  <div key={pixel.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        pixel.pixelType === 'facebook'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : pixel.pixelType === 'google'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        {pixel.pixelType}
                      </span>
                      <div>
                        <p className="text-sm font-mono font-semibold text-foreground">{pixel.pixelId}</p>
                        <p className="text-xs text-muted-foreground">
                          Events: {eventList(pixel.events).join(', ')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(pixel.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      aria-label="Pixel löschen"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}