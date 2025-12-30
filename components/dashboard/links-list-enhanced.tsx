'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { TrashIcon, EyeIcon, ClipboardIcon, MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { Link as LinkType } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LinkPreviewCard } from '@/components/link-preview-card';

interface LinksListEnhancedProps {
  links: LinkType[];
}

type SortOption = 'newest' | 'oldest' | 'clicks-desc' | 'clicks-asc' | 'url-asc' | 'url-desc';
type FilterStatus = 'all' | 'public' | 'private';

export function LinksListEnhanced({ links: initialLinks }: LinksListEnhancedProps) {
  const [links, setLinks] = useState(initialLinks);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Get unique tags from all links (would need to fetch from API in real implementation)
  const allTags = useMemo(() => {
    // In production, fetch tags from API
    return [] as string[];
  }, []);

  // Filter and sort links
  const filteredLinks = useMemo(() => {
    let filtered = [...links];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(link =>
        link.shortCode.toLowerCase().includes(query) ||
        link.longUrl.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(link =>
        filterStatus === 'public' ? link.isPublic : !link.isPublic
      );
    }

    // Tag filter (would need tag data)
    // if (selectedTags.length > 0) {
    //   filtered = filtered.filter(link => 
    //     linkTags[link.id]?.some(tag => selectedTags.includes(tag))
    //   );
    // }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'clicks-desc':
          return b.hits - a.hits;
        case 'clicks-asc':
          return a.hits - b.hits;
        case 'url-asc':
          return a.longUrl.localeCompare(b.longUrl);
        case 'url-desc':
          return b.longUrl.localeCompare(a.longUrl);
        default:
          return 0;
      }
    });

    return filtered;
  }, [links, searchQuery, sortBy, filterStatus, selectedTags]);

  const handleDelete = async (id: number) => {
    if (!confirm('Möchten Sie diesen Link wirklich löschen?')) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/links/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setLinks(links.filter(link => link.id !== id));
      } else {
        alert('Fehler beim Löschen des Links');
      }
    } catch (error) {
      alert('Fehler beim Löschen des Links');
    } finally {
      setDeleting(null);
    }
  };

  const copyShortUrl = (shortCode: string) => {
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/s/${shortCode}`);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setSelectedTags([]);
  };

  if (links.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>Sie haben noch keine Links erstellt.</p>
        <Link
          href="/"
          className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
        >
          Erstellen Sie Ihren ersten Link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Nach Short Code oder URL suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              Alle
            </Button>
            <Button
              variant={filterStatus === 'public' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('public')}
            >
              Öffentlich
            </Button>
            <Button
              variant={filterStatus === 'private' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('private')}
            >
              Privat
            </Button>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
          >
            <option value="newest">Neueste zuerst</option>
            <option value="oldest">Älteste zuerst</option>
            <option value="clicks-desc">Meiste Klicks</option>
            <option value="clicks-asc">Wenigste Klicks</option>
            <option value="url-asc">URL A-Z</option>
            <option value="url-desc">URL Z-A</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              aria-label="Tabellenansicht"
            >
              📊
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
              aria-label="Kartenansicht"
            >
              🎴
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || filterStatus !== 'all' || selectedTags.length > 0) && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 dark:text-gray-400">Aktive Filter:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-sm">
                Suche: {searchQuery}
                <button onClick={() => setSearchQuery('')} className="hover:text-indigo-900">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-sm">
                Status: {filterStatus === 'public' ? 'Öffentlich' : 'Privat'}
                <button onClick={() => setFilterStatus('all')} className="hover:text-indigo-900">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Alle zurücksetzen
            </Button>
          </div>
        )}

        {/* Results Count */}
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {filteredLinks.length} von {links.length} Links angezeigt
        </div>
      </div>

      {/* Links Display */}
      {filteredLinks.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>Keine Links gefunden, die den Filtern entsprechen.</p>
          <Button variant="outline" onClick={clearFilters} className="mt-4">
            Filter zurücksetzen
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Short Code
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ziel-URL
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Klicks
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLinks.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <code className="text-sm font-mono text-indigo-600 dark:text-indigo-400">
                        {link.shortCode}
                      </code>
                      <button
                        onClick={() => copyShortUrl(link.shortCode)}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                        title="Kopieren"
                        aria-label={`Short Code ${link.shortCode} kopieren`}
                      >
                        <ClipboardIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100 max-w-md truncate">
                      {link.longUrl}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{link.hits}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      link.isPublic
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                    }`}>
                      {link.isPublic ? 'Öffentlich' : 'Privat'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <a
                        href={`/s/${link.shortCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                        title="Ansehen"
                        aria-label={`Link ${link.shortCode} öffnen`}
                      >
                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                      </a>
                      <button
                        onClick={() => handleDelete(link.id)}
                        disabled={deleting === link.id}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                        title="Löschen"
                        aria-label={`Link ${link.shortCode} löschen`}
                      >
                        <TrashIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((link) => {
            const shortUrl = `${window.location.origin}/s/${link.shortCode}`;
            return (
              <LinkPreviewCard
                key={link.id}
                linkId={link.id}
                longUrl={link.longUrl}
                shortUrl={shortUrl}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
