'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Shield, Check, X, RefreshCw, Plus, Copy, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface SsoDomain {
  id: number;
  domain: string;
  isVerified: boolean;
  verificationToken: string;
  providerType: string;
  role: 'owner' | 'admin';
  admins?: { user: { email: string } }[];
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  issuerUrl?: string;
}

export default function SSOPage() {
  const [domains, setDomains] = useState<SsoDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedDomain, setExpandedDomain] = useState<number | null>(null);
  
  // Form State
  const [newDomain, setNewDomain] = useState('');
  const [providerType, setProviderType] = useState('azure-ad');
  
  // Config Edit State
  const [editConfig, setEditConfig] = useState<Partial<SsoDomain>>({});
  
  // Admin Management State
  const [newAdminEmail, setNewAdminEmail] = useState('');

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
    // Use editConfig values for initial creation if present
    try {
      const res = await fetch('/api/sso/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: newDomain,
          providerType,
          clientId: editConfig.clientId || '',
          clientSecret: editConfig.clientSecret || '',
          tenantId: editConfig.tenantId || '',
          issuerUrl: editConfig.issuerUrl || ''
        }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.error);
        return;
      }
      
      await fetchDomains();
      setShowAddForm(false);
      setNewDomain('');
      setEditConfig({});
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateConfig = async (id: number) => {
     try {
      const res = await fetch(`/api/sso/domains/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editConfig),
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.error);
        return;
      }
      
      alert('Configuration updated successfully');
      await fetchDomains();
      setExpandedDomain(null);
      setEditConfig({});
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddAdmin = async (domainId: number) => {
    try {
      const res = await fetch(`/api/sso/domains/${domainId}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdminEmail }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.error);
        return;
      }
      
      setNewAdminEmail('');
      await fetchDomains();
      alert('Admin added');
    } catch (error) {
       alert('Error adding admin');
    }
  };
  
  const handleRemoveAdmin = async (domainId: number, userId: number) => {
     if(!confirm('Remove admin?')) return;
     try {
       await fetch(`/api/sso/domains/${domainId}/admins?userId=${userId}`, {
         method: 'DELETE',
       });
       await fetchDomains();
     } catch(e) {
       alert('Error removing admin');
     }
  }

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
                <Label>Domain (e.g., acme.com)</Label>
                <Input value={newDomain} onChange={e => setNewDomain(e.target.value)} required placeholder="acme.com" />
              </div>
              
              <div>
                <Label>Provider</Label>
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
                  <Label>Client ID</Label>
                  <Input value={editConfig.clientId || ''} onChange={e => setEditConfig({...editConfig, clientId: e.target.value})} required />
                </div>
                <div>
                  <Label>Client Secret</Label>
                  <Input value={editConfig.clientSecret || ''} onChange={e => setEditConfig({...editConfig, clientSecret: e.target.value})} required type="password" />
                </div>
              </div>

              {providerType === 'azure-ad' && (
                <div>
                  <Label>Tenant ID</Label>
                  <Input value={editConfig.tenantId || ''} onChange={e => setEditConfig({...editConfig, tenantId: e.target.value})} required />
                </div>
              )}

              {providerType === 'keycloak' && (
                <div>
                  <Label>Issuer URL</Label>
                  <Input value={editConfig.issuerUrl || ''} onChange={e => setEditConfig({...editConfig, issuerUrl: e.target.value})} required placeholder="https://sso.example.com/realms/myrealm" />
                </div>
              )}

              <Button type="submit">Add Domain</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {domains.map(d => (
          <Card key={d.id} className={expandedDomain === d.id ? 'border-primary' : ''}>
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
                    {d.role === 'admin' && <Badge className="bg-purple-100 text-purple-800">Admin Access</Badge>}
                    {d.role === 'owner' && <Badge className="bg-blue-100 text-blue-800">Owner</Badge>}
                  </div>

                  {!d.isVerified && d.role === 'owner' && (
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
                  {!d.isVerified && d.role === 'owner' && (
                    <Button onClick={() => verifyDomain(d.id)} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" /> Verify
                    </Button>
                  )}
                  
                  <Button variant="outline" onClick={() => {
                      if (expandedDomain === d.id) {
                          setExpandedDomain(null);
                          setEditConfig({});
                      } else {
                          setExpandedDomain(d.id);
                          setEditConfig({
                              clientId: d.clientId,
                              clientSecret: d.clientSecret, // Usually hidden, but useful for edit placeholder? No.
                              tenantId: d.tenantId,
                              issuerUrl: d.issuerUrl
                          });
                      }
                  }}>
                    {expandedDomain === d.id ? 'Close Settings' : 'Settings'}
                  </Button>

                  {d.role === 'owner' && (
                    <Button variant="ghost" className="text-destructive" onClick={() => deleteDomain(d.id)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Settings Panel */}
              {expandedDomain === d.id && (
                  <div className="mt-6 pt-6 border-t space-y-6 animate-fade-in">
                      {/* Configuration Form */}
                      <div>
                          <h4 className="font-semibold mb-4">Identity Provider Configuration</h4>
                          <div className="grid gap-4 max-w-xl">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                <Label>Client ID</Label>
                                <Input value={editConfig.clientId || ''} onChange={e => setEditConfig({...editConfig, clientId: e.target.value})} />
                                </div>
                                <div>
                                <Label>Client Secret</Label>
                                <Input type="password" placeholder="(Leave empty to keep unchanged)" value={editConfig.clientSecret || ''} onChange={e => setEditConfig({...editConfig, clientSecret: e.target.value})} />
                                </div>
                            </div>
                            {d.providerType === 'azure-ad' && (
                                <div>
                                <Label>Tenant ID</Label>
                                <Input value={editConfig.tenantId || ''} onChange={e => setEditConfig({...editConfig, tenantId: e.target.value})} />
                                </div>
                            )}
                            {d.providerType === 'keycloak' && (
                                <div>
                                <Label>Issuer URL</Label>
                                <Input value={editConfig.issuerUrl || ''} onChange={e => setEditConfig({...editConfig, issuerUrl: e.target.value})} />
                                </div>
                            )}
                            <Button onClick={() => handleUpdateConfig(d.id)}>Save Configuration</Button>
                          </div>
                      </div>

                      {/* Admin Management (Only Owner) */}
                      {d.role === 'owner' && (
                          <div className="pt-6 border-t">
                              <h4 className="font-semibold mb-4">Domain Administrators</h4>
                              <p className="text-sm text-muted-foreground mb-4">
                                  Admins can view this domain and update the Identity Provider configuration.
                              </p>
                              
                              <div className="flex gap-2 max-w-md mb-4">
                                  <Input 
                                    placeholder={`colleague@${d.domain}`} 
                                    value={newAdminEmail}
                                    onChange={e => setNewAdminEmail(e.target.value)}
                                  />
                                  <Button onClick={() => handleAddAdmin(d.id)} variant="secondary">Add Admin</Button>
                              </div>

                              <div className="space-y-2">
                                  {d.admins?.map((admin: any) => (
                                      <div key={admin.id} className="flex justify-between items-center bg-muted p-2 rounded max-w-md">
                                          <span className="text-sm">{admin.user.email}</span>
                                          <Button variant="ghost" size="sm" className="text-red-500 h-6" onClick={() => handleRemoveAdmin(d.id, admin.userId)}>
                                              <X className="w-4 h-4" />
                                          </Button>
                                      </div>
                                  ))}
                                  {d.admins?.length === 0 && <p className="text-sm text-muted-foreground italic">No additional admins.</p>}
                              </div>
                          </div>
                      )}
                  </div>
              )}
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
