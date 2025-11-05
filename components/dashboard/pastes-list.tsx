'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrashIcon, EyeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import type { Paste } from '@/lib/db/schema';

interface PastesListProps {
  pastes: Paste[];
}

export function PastesList({ pastes: initialPastes }: PastesListProps) {
  const [pastes, setPastes] = useState(initialPastes);
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('Möchten Sie dieses Paste wirklich löschen?')) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/pastes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPastes(pastes.filter(paste => paste.id !== id));
      } else {
        alert('Fehler beim Löschen des Paste');
      }
    } catch (error) {
      alert('Fehler beim Löschen des Paste');
    } finally {
      setDeleting(null);
    }
  };

  if (pastes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Sie haben noch keine Pastes erstellt.</p>
        <Link
          href="/paste/create"
          className="mt-4 inline-block text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Erstellen Sie Ihr erstes Paste
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Slug
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vorschau
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sprache
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pastes.map((paste) => (
            <tr key={paste.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <code className="text-sm font-mono text-indigo-600">
                  {paste.slug}
                </code>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 max-w-md truncate font-mono">
                  {paste.content.substring(0, 100)}
                  {paste.content.length > 100 ? '...' : ''}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {paste.syntaxHighlightingLanguage || '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  paste.isPublic
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {paste.isPublic ? 'Öffentlich' : 'Privat'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-3">
                  <Link
                    href={`/p/${paste.slug}`}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Ansehen"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </Link>
                  <a
                    href={`/p/${paste.slug}/raw`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900"
                    title="Raw anzeigen"
                  >
                    <DocumentTextIcon className="h-5 w-5" />
                  </a>
                  <button
                    onClick={() => handleDelete(paste.id)}
                    disabled={deleting === paste.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    title="Löschen"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

