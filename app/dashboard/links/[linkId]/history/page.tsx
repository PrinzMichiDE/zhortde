'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Clock, User, FileDiff } from 'lucide-react';

type LinkHistoryItem = {
  id: number;
  action: string;
  changes: string | null; // JSON string
  createdAt: string;
  user: {
    email: string;
  } | null;
};

export default function LinkHistoryPage() {
  const params = useParams();
  const [history, setHistory] = useState<LinkHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [params.linkId]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/links/${params.linkId}/history`);
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setHistory(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatChanges = (changesJson: string | null) => {
    if (!changesJson) return null;
    try {
      const changes = JSON.parse(changesJson);
      return (
        <div className="mt-2 text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-700 font-mono overflow-x-auto">
          {Object.entries(changes).map(([key, value]: [string, any]) => (
            <div key={key} className="flex flex-col sm:flex-row gap-1 sm:gap-4 mb-1 last:mb-0">
              <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[100px]">{key}:</span>
              <div className="flex items-center gap-2">
                 <span className="text-red-500 line-through opacity-70">{String(value.from)}</span>
                 <span className="text-gray-400">→</span>
                 <span className="text-green-600 dark:text-green-400 font-medium">{String(value.to)}</span>
              </div>
            </div>
          ))}
        </div>
      );
    } catch {
      return <span className="text-gray-500">Invalid data</span>;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created': return { label: 'Erstellt', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
      case 'updated': return { label: 'Aktualisiert', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' };
      case 'deleted': return { label: 'Gelöscht', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
      default: return { label: action, color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Clock className="h-6 w-6 text-indigo-500" />
              Audit Log / Historie
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Verfolgen Sie alle Änderungen an diesem Link.
            </p>
          </div>
          <a href="/dashboard" className="text-indigo-600 hover:underline text-sm font-medium">
            &larr; Zurück zum Dashboard
          </a>
        </div>

        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-lg">{error}</div>
        ) : history.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-xl text-center text-gray-500 dark:text-gray-400 shadow-sm border border-gray-100 dark:border-gray-700">
            <FileDiff className="h-12 w-12 mx-auto mb-4 opacity-20" />
            Keine Änderungen protokolliert.
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
             <div className="divide-y divide-gray-200 dark:divide-gray-700">
               {history.map((item) => {
                 const { label, color } = getActionLabel(item.action);
                 return (
                   <div key={item.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                       <div className="flex items-center gap-3">
                         <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${color}`}>
                           {label}
                         </span>
                         <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                           <Clock className="h-3 w-3" />
                           {new Date(item.createdAt).toLocaleString('de-DE')}
                         </span>
                       </div>
                       <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                         <User className="h-4 w-4 text-gray-400" />
                         {item.user?.email || 'System / Unbekannt'}
                       </div>
                     </div>
                     
                     {item.changes && formatChanges(item.changes)}
                   </div>
                 );
               })}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
