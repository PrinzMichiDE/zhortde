'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

type AuditEntry = {
  id: number;
  action: string;
  resourceType: string;
  resourceId: number | null;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actorEmail: string | null;
};

type AuditResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  entries: AuditEntry[];
};

export default function AdminAuditPage() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/admin/audit-logs?page=${page}&limit=25`);
        if (!response.ok) {
          throw new Error('Failed to fetch audit logs');
        }
        const payload = await response.json();
        setData(payload);
      } catch {
        setError('Could not load admin audit log.');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [page]);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error" icon={<AlertCircle className="h-4 w-4" />}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Admin Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground">Loading audit events...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted text-muted-foreground uppercase">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Actor</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Resource</th>
                      <th className="px-4 py-3">IP</th>
                      <th className="px-4 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.entries.length ? (
                      data.entries.map((entry) => (
                        <tr key={entry.id} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            {new Date(entry.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">{entry.actorEmail || 'Unknown'}</td>
                          <td className="px-4 py-3 font-medium">{entry.action}</td>
                          <td className="px-4 py-3">
                            {entry.resourceType}
                            {entry.resourceId ? ` #${entry.resourceId}` : ''}
                          </td>
                          <td className="px-4 py-3">{entry.ipAddress || '—'}</td>
                          <td className="px-4 py-3 max-w-xs truncate">
                            {entry.metadata ? JSON.stringify(entry.metadata) : '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          No admin audit events recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {data && data.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Page {data.page} of {data.totalPages} ({data.total} events)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((current) => Math.max(current - 1, 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.totalPages}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
