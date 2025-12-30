'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Shield, Check, X, RefreshCw, Plus, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SsoDomain {
  id: number;
  domain: string;
  isVerified: boolean;
  verificationToken: string;
  providerType: string;
}

export default function SSOPage() {
  const [domains, setDomains] = useState<SsoDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form State
  const [newDomain, setNewDomain] = useState('');
  const [providerType, setProviderType] = useState('azure-ad');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [issuerUrl, setIssuerUrl] = useState('');

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const res = await fetch('/api/sso/domains');
      if (res.ok) {
        setDomains(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sso/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: newDomain,
          providerType,
          clientId,
          clientSecret,
          tenantId,
          issuerUrl
        }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.error);
        return;
      }
      
      await fetchDomains();
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const verifyDomain = async (id: number) => {
    try {
      const res = await fetch(`/api/sso/domains/${id}/verify`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Domain verified successfully!');
        fetchDomains();
      } else {
        alert(data.message || 'Verification failed');
      }
    } catch (e) {
      alert('Error verifying domain');
    }
  };

  const deleteDomain = async (id: number) => {
    if (!confirm('Remove this domain?')) return;
    await fetch(`/api/sso/domains/${id}`, { method: 'DELETE' });
    fetchDomains();
  };

  const resetForm = () => {
    setNewDomain('');
    setClientId('');
    setClientSecret('');
    setTenantId('');
    setIssuerUrl('');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enterprise SSO</h1>
          <p className="text-muted-foreground">Manage Single Sign-On for your organization domain.</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : <><Plus className="mr-2 h-4 w-4" /> Add Domain</>}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add SSO Domain</CardTitle>
            <CardDescription>Configure your identity provider</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDomain} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Domain (e.g., acme.com)</label>
                <Input value={newDomain} onChange={e => setNewDomain(e.target.value)} required placeholder="acme.com" />
              </div>
              
              <div>
                <label className="text-sm font-medium">Provider</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={providerType}
                  onChange={e => setProviderType(e.target.value)}
                >
                  <option value="azure-ad">Microsoft Entra ID (Azure AD)</option>
                  <option value="keycloak">Keycloak / OIDC</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Client ID</label>
                  <Input value={clientId} onChange={e => setClientId(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Client Secret</label>
                  <Input value={clientSecret} onChange={e => setClientSecret(e.target.value)} required type="password" />
                </div>
              </div>

              {providerType === 'azure-ad' && (
                <div>
                  <label className="text-sm font-medium">Tenant ID</label>
                  <Input value={tenantId} onChange={e => setTenantId(e.target.value)} required />
                </div>
              )}

              {providerType === 'keycloak' && (
                <div>
                  <label className="text-sm font-medium">Issuer URL</label>
                  <Input value={issuerUrl} onChange={e => setIssuerUrl(e.target.value)} required placeholder="https://sso.example.com/realms/myrealm" />
                </div>
              )}

              <Button type="submit">Add Domain</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {domains.map(d => (
          <Card key={d.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">{d.domain}</h3>
                    {d.isVerified ? (
                      <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" /> Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending Verification</Badge>
                    )}
                    <Badge variant="secondary">{d.providerType}</Badge>
                  </div>

                  {!d.isVerified && (
                    <div className="bg-muted p-3 rounded-md mt-2 text-sm">
                      <p className="font-medium mb-1">Verification Required</p>
                      <p className="text-muted-foreground mb-2">Please add the following TXT record to your DNS configuration:</p>
                      <div className="flex items-center gap-2 bg-background p-2 rounded border font-mono">
                        <span className="flex-1">{d.verificationToken}</span>
                        <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(d.verificationToken)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {!d.isVerified && (
                    <Button onClick={() => verifyDomain(d.id)} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" /> Verify
                    </Button>
                  )}
                  <Button variant="ghost" className="text-destructive" onClick={() => deleteDomain(d.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {domains.length === 0 && !showAddForm && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No SSO Domains Configured</h3>
            <p className="text-muted-foreground mb-4">Add your company domain to enable Single Sign-On.</p>
            <Button onClick={() => setShowAddForm(true)}>Add Domain</Button>
          </div>
        )}
      </div>
    </div>
  );
}
