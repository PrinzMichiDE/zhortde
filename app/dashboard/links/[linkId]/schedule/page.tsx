'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClockIcon, CalendarIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Schedule {
  id: number;
  linkId: number;
  activeFrom: string | null;
  activeUntil: string | null;
  timezone: string;
  fallbackUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function LinkSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const linkId = parseInt(params.linkId as string);
  
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    activeFrom: '',
    activeUntil: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    fallbackUrl: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, [linkId]);

  const fetchSchedules = async () => {
    try {
      const response = await fetch(`/api/links/${linkId}/schedule`);
      const data = await response.json();
      if (data.success) {
        setSchedules(data.schedules);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.activeFrom && !formData.activeUntil) {
      setError('Bitte geben Sie mindestens ein Start- oder Enddatum an');
      return;
    }

    try {
      const response = await fetch(`/api/links/${linkId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeFrom: formData.activeFrom || null,
          activeUntil: formData.activeUntil || null,
          timezone: formData.timezone,
          fallbackUrl: formData.fallbackUrl || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSchedules([...schedules, data.schedule]);
        setShowForm(false);
        setFormData({
          activeFrom: '',
          activeUntil: '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          fallbackUrl: '',
        });
      } else {
        setError(data.error || 'Fehler beim Erstellen des Schedules');
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten');
    }
  };

  const handleDelete = async (scheduleId: number) => {
    if (!confirm('Möchten Sie diesen Schedule wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/links/${linkId}/schedule?scheduleId=${scheduleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSchedules(schedules.filter(s => s.id !== scheduleId));
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const isScheduleActive = (schedule: Schedule) => {
    if (!schedule.isActive) return false;
    
    const now = new Date();
    const from = schedule.activeFrom ? new Date(schedule.activeFrom) : null;
    const until = schedule.activeUntil ? new Date(schedule.activeUntil) : null;

    if (from && now < from) return false;
    if (until && now > until) return false;
    
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-4">
            ← Zurück zum Dashboard
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
            Link Scheduling
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Planen Sie die Aktivierung und Deaktivierung Ihrer Links
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-6 w-6" />
                Zeitpläne
              </CardTitle>
              <Button onClick={() => setShowForm(!showForm)} variant="primary" size="sm">
                <PlusIcon className="h-5 w-5 mr-2" />
                Neuer Schedule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showForm && (
              <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="activeFrom"
                    type="datetime-local"
                    label="Aktiv ab"
                    value={formData.activeFrom}
                    onChange={(e) => setFormData({ ...formData, activeFrom: e.target.value })}
                  />
                  <Input
                    id="activeUntil"
                    type="datetime-local"
                    label="Aktiv bis"
                    value={formData.activeUntil}
                    onChange={(e) => setFormData({ ...formData, activeUntil: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Zeitzone
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-h-[44px]"
                    >
                      <option value="UTC">UTC</option>
                      <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    </select>
                  </div>
                  <Input
                    id="fallbackUrl"
                    type="url"
                    label="Fallback URL (optional)"
                    value={formData.fallbackUrl}
                    onChange={(e) => setFormData({ ...formData, fallbackUrl: e.target.value })}
                    placeholder="https://example.com/expired"
                    helperText="URL die angezeigt wird, wenn der Link nicht aktiv ist"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="primary">
                    Schedule erstellen
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                    Abbrechen
                  </Button>
                </div>
              </form>
            )}

            {schedules.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <ClockIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Schedules erstellt</p>
                <p className="text-sm mt-2">Erstellen Sie einen Schedule, um Links zeitbasiert zu aktivieren</p>
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule) => {
                  const isActive = isScheduleActive(schedule);
                  return (
                    <div
                      key={schedule.id}
                      className={`p-4 rounded-lg border-2 ${
                        isActive
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isActive
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                              }`}
                            >
                              {isActive ? 'Aktiv' : 'Inaktiv'}
                            </span>
                            {schedule.isActive && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {schedule.timezone}
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 text-sm">
                            {schedule.activeFrom && (
                              <p className="text-gray-700 dark:text-gray-300">
                                <span className="font-semibold">Von:</span>{' '}
                                {new Date(schedule.activeFrom).toLocaleString('de-DE', {
                                  timeZone: schedule.timezone,
                                })}
                              </p>
                            )}
                            {schedule.activeUntil && (
                              <p className="text-gray-700 dark:text-gray-300">
                                <span className="font-semibold">Bis:</span>{' '}
                                {new Date(schedule.activeUntil).toLocaleString('de-DE', {
                                  timeZone: schedule.timezone,
                                })}
                              </p>
                            )}
                            {schedule.fallbackUrl && (
                              <p className="text-gray-600 dark:text-gray-400">
                                <span className="font-semibold">Fallback:</span> {schedule.fallbackUrl}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(schedule.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </Button>
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
