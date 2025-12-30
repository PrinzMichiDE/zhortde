'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlobeAltIcon, CheckCircleIcon, XCircleIcon, TrashIcon, PlusIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface Domain {
  id: number;
  userId: number;
  domain: string;
  verified: boolean;
  sslEnabled: boolean;
  verifiedAt: string | null;
  createdAt: string;
}

export default function CustomDomainsPage() {
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ domain: '' });
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState<number | null>(null);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/user/domains');
      const data = await response.json();
      if (data.success) {
        setDomains(data.domains);
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.domain) {
      setError('Bitte geben Sie eine Domain ein');
      return;
    }

    try {
      const response = await fetch('/api/user/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: formData.domain }),
      });

      const data = await response.json();
      if (data.success) {
        setDomains([...domains, data.domain]);
        setShowForm(false);
        setFormData({ domain: '' });
        
        // Show DNS instructions
        alert(`DNS-Konfiguration:\n\n${data.dnsRecords.map((r: any) => 
          `${r.type} ${r.name}\n  → ${r.value}`
        ).join('\n\n')}\n\nVerification Token: ${data.verificationToken}`);
      } else {
        setError(data.error || 'Fehler beim Hinzufügen der Domain');
      }
    } catch (error) {
      setError('Ein Fehler ist aufgetreten');
    }
  };

  const handleVerify = async (domainId: number) => {
    setVerifying(domainId);
    try {
      const response = await fetch('/api/user/domains', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      });

      const data = await response.json();
      if (data.success) {
        fetchDomains();
      } else {
        alert(data.error || 'Verification fehlgeschlagen');
      }
    } catch (error) {
      alert('Fehler bei der Verification');
    } finally {
      setVerifying(null);
    }
  };

  const handleDelete = async (domainId: number) => {
    if (!confirm('Möchten Sie diese Domain wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/user/domains?domainId=${domainId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDomains(domains.filter(d => d.id !== domainId));
      }
    } catch (error) {
      console.error('Error deleting domain:', error);
    }
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
            Custom Domains
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Verbinden Sie Ihre eigene Domain für professionelle Short-Links
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
                <GlobeAltIcon className="h-6 w-6" />
                Meine Domains
              </CardTitle>
              <Button onClick={() => setShowForm(!showForm)} variant="default" size="sm">
                <PlusIcon className="h-5 w-5 mr-2" />
                Domain hinzufügen
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showForm && (
              <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <Input
                  id="domain"
                  type="text"
                  label="Domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ domain: e.target.value.toLowerCase() })}
                  placeholder="links.example.com"
                  required
                  helperText="Geben Sie die Subdomain ein (z.B. links.example.com)"
                />
                <div className="flex gap-2">
                  <Button type="submit" variant="default">
                    Domain hinzufügen
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                    Abbrechen
                  </Button>
                </div>
              </form>
            )}

            {domains.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <GlobeAltIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Custom Domains</p>
                <p className="text-sm mt-2">Fügen Sie Ihre eigene Domain hinzu für professionelle Short-Links</p>
              </div>
            ) : (
              <div className="space-y-4">
                {domains.map((domain) => (
                  <div
                    key={domain.id}
                    className={`p-6 rounded-lg border-2 ${
                      domain.verified
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {domain.verified ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          )}
                          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {domain.domain}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              domain.verified
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                            }`}
                          >
                            {domain.verified ? 'Verifiziert' : 'Nicht verifiziert'}
                          </span>
                          {domain.sslEnabled && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                              <ShieldCheckIcon className="h-3 w-3 mr-1" />
                              SSL
                            </span>
                          )}
                        </div>
                        {domain.verifiedAt && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Verifiziert am: {new Date(domain.verifiedAt).toLocaleDateString('de-DE')}
                          </p>
                        )}
                        {!domain.verified && (
                          <Alert variant="warning" className="mt-4">
                            <p className="text-sm">
                              Bitte konfigurieren Sie die DNS-Einträge wie angezeigt und klicken Sie dann auf "Verifizieren".
                            </p>
                          </Alert>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {!domain.verified && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerify(domain.id)}
                            disabled={verifying === domain.id}
                            className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-700"
                          >
                            {verifying === domain.id ? 'Verifiziert...' : 'Verifizieren'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(domain.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Anleitung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">1. Domain hinzufügen</h3>
              <p>Geben Sie Ihre Subdomain ein (z.B. links.example.com)</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">2. DNS konfigurieren</h3>
              <p>Fügen Sie die angezeigten DNS-Einträge in Ihrem DNS-Provider hinzu:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>CNAME Eintrag für die Subdomain</li>
                <li>TXT Eintrag für die Verification</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">3. Verifizieren</h3>
              <p>Nach der DNS-Konfiguration (kann einige Minuten dauern) klicken Sie auf "Verifizieren"</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">4. SSL aktivieren</h3>
              <p>SSL wird automatisch aktiviert nach erfolgreicher Verification</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
