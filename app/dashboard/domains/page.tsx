'use client';

import { useState, useEffect, useCallback } from 'react';
import { GlobeAltIcon, PlusIcon, TrashIcon, CheckBadgeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

interface CustomDomain {
  id: number;
  domain: string;
  verified: boolean;
  dnsRecords: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

interface DnsRecord {
  type: string;
  name: string;
  value: string;
}

export default function DomainsPage() {
  const t = useTranslations('dashboard');

  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addedDns, setAddedDns] = useState<{ domain: string; dnsRecords: DnsRecord[]; verificationToken: string } | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchDomains = useCallback(async () => {
    try {
      const response = await fetch('/api/user/domains');
      const data = await response.json();
      if (data.success) {
        setDomains(data.domains);
      } else {
        setError(data.error || 'Fehler beim Laden der Domains');
      }
    } catch {
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/user/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainInput.trim().toLowerCase() }),
      });
      const data = await response.json();

      if (response.ok) {
        setDomains([data.domain, ...domains]);
        setAddedDns({
          domain: data.domain.domain,
          dnsRecords: data.dnsRecords,
          verificationToken: data.verificationToken,
        });
        setDomainInput('');
        setShowAddForm(false);
      } else {
        setError(data.error || 'Fehler beim Hinzufügen der Domain');
      }
    } catch {
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (domainId: number) => {
    setVerifyingId(domainId);
    setError('');
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
        setError(data.error || 'Verifizierung fehlgeschlagen');
      }
    } catch {
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDelete = async (domainId: number) => {
    if (!confirm(t('deleteConfirm'))) return;

    try {
      const response = await fetch(`/api/user/domains/${domainId}`, { method: 'DELETE' });
      if (response.ok) {
        setDomains(domains.filter((d) => d.id !== domainId));
      } else {
        const data = await response.json();
        setError(data.error || 'Fehler beim Löschen der Domain');
      }
    } catch {
      setError('Ein Fehler ist aufgetreten');
    }
  };

  const copyValue = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const parseDns = (dnsRecords: string | null): DnsRecord[] => {
    try {
      const parsed = dnsRecords ? JSON.parse(dnsRecords) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2 flex items-center gap-2">
              <GlobeAltIcon className="h-8 w-8" />
              {t('myDomains')}
            </h1>
            <p className="text-muted-foreground">{t('domainsPageDescription')}</p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            {t('addDomain')}
          </Button>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {showAddForm && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleAdd} className="flex flex-col gap-4 sm:flex-row">
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder={t('domainPlaceholder')}
                  className="flex-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                  required
                />
                <Button type="submit" loading={submitting}>
                  {t('save')}
                </Button>
              </form>
              <p className="mt-3 text-xs text-muted-foreground">{t('domainHelper')}</p>
            </CardContent>
          </Card>
        )}

        {addedDns && (
          <Alert variant="success" icon="✅" className="mb-8">
            <div className="space-y-3">
              <h3 className="font-bold text-sm">
                {t('domainCreatedTitle')} {addedDns.domain}
              </h3>
              <p className="text-sm">{t('domainCreatedHint')}</p>
              <div className="space-y-2">
                {addedDns.dnsRecords.map((record, index) => {
                  const keyName = `${record.type}-${record.name}-${record.value}`;
                  return (
                    <div key={index} className="rounded-lg border border-border bg-background p-3 text-xs font-mono">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">{record.type}</span>
                        <button
                          onClick={() => copyValue(keyName, `${record.type} ${record.name} ${record.value}`)}
                          className="text-primary hover:text-primary/80"
                        >
                          {copiedField === keyName ? '✓' : t('copy')}
                        </button>
                      </div>
                      <div className="mt-1 break-all">{record.name}</div>
                      <div className="text-muted-foreground break-all">{record.value}</div>
                    </div>
                  );
                })}
                <div className="rounded-lg border border-border bg-background p-3 text-xs font-mono">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">TXT {t('verificationToken')}</span>
                    <button
                      onClick={() => copyValue(`token-${addedDns.verificationToken}`, addedDns.verificationToken)}
                      className="text-primary hover:text-primary/80"
                    >
                      {copiedField === `token-${addedDns.verificationToken}` ? '✓' : t('copy')}
                    </button>
                  </div>
                  <div className="mt-1 break-all">{addedDns.verificationToken}</div>
                </div>
              </div>
            </div>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t('myDomains')} ({domains.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {domains.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <GlobeAltIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('noDomains')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {domains.map((domain) => {
                  const dnsRecords = parseDns(domain.dnsRecords);
                  return (
                    <div key={domain.id} className="p-4 bg-card border border-border rounded-lg">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground font-mono">{domain.domain}</span>
                            {domain.verified ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs font-medium">
                                <CheckBadgeIcon className="h-3.5 w-3.5" />
                                {t('verified')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs font-medium">
                                {t('unverified')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('addedOn')} {new Date(domain.createdAt).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!domain.verified && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerify(domain.id)}
                              loading={verifyingId === domain.id}
                            >
                              <ArrowPathIcon className="h-4 w-4 mr-1" />
                              {t('verify')}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(domain.id)} className="text-red-600 hover:text-red-700">
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {!domain.verified && dnsRecords.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {t('dnsRecords')}
                          </p>
                          {dnsRecords.map((record, index) => (
                            <div
                              key={index}
                              className="rounded-lg bg-muted/40 p-3 text-xs font-mono break-all"
                            >
                              <span className="font-bold text-foreground">{record.type}</span>{' '}
                              {record.name} → {record.value}
                            </div>
                          ))}
                        </div>
                      )}
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