'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  ClipboardIcon,
  DocumentArrowUpIcon,
  CheckIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  SpinnerIcon,
} from '@heroicons/react/24/outline';
import { parseCSV, parseTextInput, type BulkLinkRequest } from '@/lib/bulk-shortening';

interface BulkResult {
  success: boolean;
  longUrl: string;
  shortCode?: string;
  shortUrl?: string;
  error?: string;
}

interface BulkResponse {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  results: BulkResult[];
}

interface BatchJobStatus {
  jobId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total: number;
  processed: number;
  successful: number;
  failed: number;
  results?: BulkResult[];
  error?: string;
}

export default function BulkShorteningPage() {
  const [mode, setMode] = useState<'text' | 'csv'>('text');
  const [textInput, setTextInput] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch job polling state
  const [batchJob, setBatchJob] = useState<BatchJobStatus | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Poll for batch job status updates
  useEffect(() => {
    if (!batchJob || batchJob.status === 'completed' || batchJob.status === 'failed') {
      return;
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/batch-jobs/${batchJob.jobId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch job status');
        }
        const updatedJob: BatchJobStatus = await response.json();
        setBatchJob(updatedJob);
      } catch {
        // Silently fail polling — job may still be processing
      }
    }, 1000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [batchJob?.jobId, batchJob?.status]);

  const handleTextSubmit = useCallback(async () => {
    if (!textInput.trim()) {
      setError('Please enter at least one URL.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setBatchJob(null);

    try {
      const urls = parseTextInput(textInput);
      if (urls.length === 0) {
        setError('No valid URLs found in the input.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/links/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      const data: BulkResponse = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to process bulk links.');
        return;
      }

      setResults(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [textInput]);

  const handleCsvFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a CSV file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    try {
      const content = await file.text();
      setCsvContent(content);
      setCsvFile(file);
      setError(null);
    } catch {
      setError('Failed to read the uploaded file.');
    }
  }, []);

  const handleCsvSubmit = useCallback(async () => {
    if (!csvContent) {
      setError('Please upload a CSV file first.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setBatchJob(null);

    try {
      const urls = parseCSV(csvContent);
      if (urls.length === 0) {
        setError('No valid URLs found in the CSV file.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/links/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      const data: BulkResponse = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to process bulk links.');
        return;
      }

      setResults(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [csvContent]);

  const handleFileUpload = useCallback(async () => {
    if (!csvFile) {
      setError('Please select a file first.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setBatchJob(null);

    try {
      const formData = new FormData();
      formData.append('file', csvFile);

      const response = await fetch('/api/links/bulk', {
        method: 'PUT',
        body: formData,
      });

      const data: BulkResponse = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to process bulk links.');
        return;
      }

      setResults(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [csvFile]);

  const handleExportCSV = useCallback(() => {
    if (!results) return;

    const headers = ['URL', 'Short URL', 'Status', 'Error'];
    const rows = results.results.map((r) => [
      r.longUrl,
      r.shortUrl || '',
      r.success ? 'Success' : 'Failed',
      r.error || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bulk-results-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [results]);

  return (
    <div className="container mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold">Bulk URL Shortening</h1>

      {error && (
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={mode} onValueChange={(v) => setMode(v as 'text' | 'csv')}>
        <TabsList>
          <TabsTrigger value="text">Text Input</TabsTrigger>
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle>Enter URLs</CardTitle>
              <CardDescription>
                Paste one URL per line (e.g., https://example.com/page1).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
                className="w-full h-40 resize-y rounded-md border border-input bg-background p-3 font-mono text-sm"
              />
              <Button onClick={handleTextSubmit} disabled={loading}>
                {loading ? 'Processing...' : 'Shorten URLs'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="csv">
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                Upload a CSV file with one URL per line (first column).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvFileChange}
                className="hidden"
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <DocumentArrowUpIcon className="mr-2 h-4 w-4" />
                Choose CSV File
              </Button>
              {csvFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
              <div className="space-y-2">
                <Button onClick={handleCsvSubmit} disabled={loading || !csvContent}>
                  {loading ? 'Processing...' : 'Process Parsed CSV'}
                </Button>
                <Button variant="outline" onClick={handleFileUpload} disabled={loading || !csvFile}>
                  {loading ? 'Processing...' : 'Upload & Process'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              {results.successful} successful, {results.failed} failed out of {results.total} URLs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleExportCSV} disabled={!results}>
                <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                Export Results as CSV
              </Button>
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(JSON.stringify(results, null, 2)); }}>
                <ClipboardIcon className="mr-2 h-4 w-4" />
                Copy Results
              </Button>
            </div>

            <div className="rounded-md border">
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-left">URL</th>
                      <th className="p-3 text-left">Short URL</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.results.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-3 max-w-xs truncate">{r.longUrl}</td>
                        <td className="p-3 max-w-xs truncate">
                          {r.shortUrl ? (
                            <a
                              href={r.shortUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {r.shortUrl}
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-3">
                          {r.success ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckIcon className="h-4 w-4" />
                              Success
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600">
                              <XCircleIcon className="h-4 w-4" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="p-3 max-w-xs truncate text-muted-foreground">{r.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}