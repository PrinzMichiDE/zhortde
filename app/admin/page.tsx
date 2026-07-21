'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import {
  Activity,
  AlertCircle,
  Database,
  Link2,
  RefreshCw,
  Shield,
  Users,
} from 'lucide-react';

type OverviewData = {
  generatedAt: string;
  users: number;
  links: number;
  pastes: number;
  rateLimits: {
    total: number;
    activeLastHour: number;
  };
  passkeyAuthAttempts: number;
  adminAuditEvents: number;
  blocklist: {
    total: number;
    lastUpdate: string | null;
    ageHours: number | null;
    status: 'active' | 'empty';
  };
};

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingBlocklist, setRefreshingBlocklist] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadOverview = async () => {
    setError('');
    try {
      const response = await fetch('/api/admin/overview');
      if (!response.ok) {
        throw new Error('Failed to load overview');
      }
      const data = await response.json();
      setOverview(data);
    } catch {
      setError('Could not load operational overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const refreshBlocklist = async () => {
    setRefreshingBlocklist(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/admin/blocklist', { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh blocklist');
      }

      setMessage(data.message || 'Blocklist refreshed.');
      await loadOverview();
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Failed to refresh blocklist';
      setError(messageText);
    } finally {
      setRefreshingBlocklist(false);
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading operational overview...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error" icon={<AlertCircle className="h-4 w-4" />}>
          {error}
        </Alert>
      )}

      {message && (
        <Alert variant="success" icon={<Shield className="h-4 w-4" />}>
          {message}
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Users"
          value={overview?.users ?? 0}
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          title="Links"
          value={overview?.links ?? 0}
          icon={<Link2 className="h-5 w-5" />}
        />
        <MetricCard
          title="Pastes"
          value={overview?.pastes ?? 0}
          icon={<Database className="h-5 w-5" />}
        />
        <MetricCard
          title="Admin Audit Events"
          value={overview?.adminAuditEvents ?? 0}
          icon={<Activity className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Blocklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={overview?.blocklist.status === 'active' ? 'success' : 'warning'}>
                {overview?.blocklist.status ?? 'unknown'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Domains</span>
              <span className="font-medium">{overview?.blocklist.total ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last update</span>
              <span className="font-medium">
                {overview?.blocklist.lastUpdate
                  ? new Date(overview.blocklist.lastUpdate).toLocaleString()
                  : 'Never'}
              </span>
            </div>
            <Button
              onClick={refreshBlocklist}
              disabled={refreshingBlocklist}
              className="w-full"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshingBlocklist ? 'animate-spin' : ''}`} />
              Refresh blocklist
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rate Limits & Auth</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tracked rate-limit rows</span>
              <span className="font-medium">{overview?.rateLimits.total ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active in last hour</span>
              <span className="font-medium">{overview?.rateLimits.activeLastHour ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Passkey auth attempts</span>
              <span className="font-medium">{overview?.passkeyAuthAttempts ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Snapshot generated</span>
              <span className="font-medium">
                {overview?.generatedAt
                  ? new Date(overview.generatedAt).toLocaleString()
                  : 'Unknown'}
              </span>
            </div>
            <Link
              href="/admin/audit"
              className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              View admin audit log
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}
