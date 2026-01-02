'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { 
  Shield, 
  Users, 
  BarChart3, 
  Globe, 
  Palette, 
  Code, 
  Download,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

type Team = {
  id: number;
  name: string;
  isEnterprise: boolean;
  customDomain: string | null;
  customLogo: string | null;
  usageQuota: number | null;
  currentUsage: number;
  usageResetDate: string | null;
  slaLevel: string;
};

type WhitelistEntry = {
  id: number;
  ipAddress: string;
  description: string | null;
  isActive: boolean;
};

export default function EnterpriseDashboardPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [whitelistEntries, setWhitelistEntries] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Whitelist form
  const [showWhitelistForm, setShowWhitelistForm] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchWhitelist(selectedTeam);
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams');
      if (!res.ok) throw new Error('Failed to fetch teams');
      const data = await res.json();
      setTeams(data.teams || []);
      if (data.teams && data.teams.length > 0) {
        setSelectedTeam(data.teams[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchWhitelist = async (teamId: number) => {
    try {
      const res = await fetch(`/api/enterprise/whitelist?teamId=${teamId}`);
      if (!res.ok) throw new Error('Failed to fetch whitelist');
      const data = await res.json();
      setWhitelistEntries(data.entries || []);
    } catch (err) {
      console.error('Whitelist fetch error:', err);
    }
  };

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !ipAddress.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/enterprise/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam,
          ipAddress: ipAddress.trim(),
          description: description.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add whitelist entry');
      }

      setIpAddress('');
      setDescription('');
      setShowWhitelistForm(false);
      fetchWhitelist(selectedTeam);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWhitelist = async (id: number) => {
    if (!confirm('Are you sure you want to delete this whitelist entry?')) return;

    try {
      const res = await fetch(`/api/enterprise/whitelist?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete entry');

      if (selectedTeam) {
        fetchWhitelist(selectedTeam);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const selectedTeamData = teams.find(t => t.id === selectedTeam);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Enterprise Features
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage enterprise-level features for your teams
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Team Selector */}
        {teams.length > 0 && (
          <Card className="p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Team
            </label>
            <select
              value={selectedTeam || ''}
              onChange={(e) => setSelectedTeam(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} {team.isEnterprise ? '(Enterprise)' : ''}
                </option>
              ))}
            </select>
          </Card>
        )}

        {selectedTeamData && (
          <>
            {/* Usage Quota */}
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                  Usage Quota
                </h2>
                <a
                  href={`/api/enterprise/quota?teamId=${selectedTeam}`}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View Details
                </a>
              </div>
              {selectedTeamData.usageQuota ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Usage</span>
                      <span className="text-gray-900 dark:text-gray-100 font-semibold">
                        {selectedTeamData.currentUsage} / {selectedTeamData.usageQuota}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          (selectedTeamData.currentUsage / selectedTeamData.usageQuota) > 0.9
                            ? 'bg-red-500'
                            : (selectedTeamData.currentUsage / selectedTeamData.usageQuota) > 0.7
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min((selectedTeamData.currentUsage / selectedTeamData.usageQuota) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  {selectedTeamData.usageResetDate && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Resets on: {new Date(selectedTeamData.usageResetDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">Unlimited usage</p>
              )}
            </Card>

            {/* IP Whitelist */}
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-500" />
                  IP Whitelist
                </h2>
                <Button
                  onClick={() => setShowWhitelistForm(!showWhitelistForm)}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add IP
                </Button>
              </div>

              {showWhitelistForm && (
                <form onSubmit={handleAddWhitelist} className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                  <Input
                    label="IP Address or CIDR"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="192.168.1.1 or 192.168.1.0/24"
                    required
                  />
                  <Input
                    label="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Office network"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" loading={submitting}>
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowWhitelistForm(false);
                        setIpAddress('');
                        setDescription('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {whitelistEntries.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  No IP whitelist entries. All IPs are allowed by default.
                </p>
              ) : (
                <div className="space-y-2">
                  {whitelistEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
                            {entry.ipAddress}
                          </code>
                          {entry.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        {entry.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {entry.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWhitelist(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Enterprise Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Globe className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Custom Domain</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedTeamData.customDomain || 'Not configured'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Palette className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Custom Branding</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedTeamData.customLogo ? 'Configured' : 'Not configured'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">SLA Level</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {selectedTeamData.slaLevel || 'Standard'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        {teams.length === 0 && (
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Teams Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create a team to access enterprise features
            </p>
            <Button onClick={() => router.push('/dashboard/teams')}>
              Create Team
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
