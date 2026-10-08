'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatBubbleLeftRightIcon, PlusIcon, TrashIcon, ArrowLeftIcon, UserIcon } from '@heroicons/react/24/outline';

interface Comment {
  id: number;
  linkId: number;
  userId: number | null;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export default function LinkCommentsPage() {
  const params = useParams();
  const router = useRouter();
  const linkId = parseInt(params.linkId as string);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(true);
  const [error, setError] = useState('');

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/links/${linkId}/comments`);
      const data = await response.json();
      if (data.success) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  }, [linkId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Bitte geben Sie einen Kommentar ein');
      return;
    }

    try {
      const response = await fetch(`/api/links/${linkId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), isInternal }),
      });

      const data = await response.json();
      if (data.success) {
        setComments([data.comment, ...comments]);
        setContent('');
        setShowForm(false);
      } else {
        setError(data.error || 'Fehler beim Speichern des Kommentars');
      }
    } catch {
      setError('Ein Fehler ist aufgetreten');
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Diesen Kommentar wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/links/${linkId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
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
            Kommentare &amp; Notizen
          </h1>
          <p className="text-muted-foreground">
            Interne Notizen zu diesem Link — nur für Sie sichtbar
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
                Notizen ({comments.length})
              </CardTitle>
              <Button onClick={() => setShowForm(!showForm)} variant="default" size="sm">
                <PlusIcon className="h-5 w-5 mr-2" />
                Notiz hinzufügen
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showForm && (
              <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Notiz / Kommentar
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    placeholder="z.B. Freigabe durch Marketing am 15.10. veranlasst"
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isInternal"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isInternal" className="text-sm text-gray-700 dark:text-gray-300">
                    Interne Notiz (nicht öffentlich)
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="default">
                    Speichern
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                    Abbrechen
                  </Button>
                </div>
              </form>
            )}

            {comments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Notizen vorhanden</p>
                <p className="text-sm mt-2">Fügen Sie die erste interne Notiz hinzu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-card border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <UserIcon className="h-4 w-4" />
                        <span className="font-medium text-foreground">Nutzer #{comment.userId ?? '—'}</span>
                        <span>·</span>
                        <span>{new Date(comment.createdAt).toLocaleString('de-DE')}</span>
                        {comment.isInternal && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs">
                            intern
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(comment.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700"
                        aria-label="Kommentar löschen"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{comment.content}</p>
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