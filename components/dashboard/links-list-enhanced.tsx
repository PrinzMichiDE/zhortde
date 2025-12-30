'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { TrashIcon, EyeIcon, ClipboardIcon, MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { links } from '@/lib/db/schema';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LinkPreviewCard } from '@/components/link-preview-card';
import { cn } from '@/lib/utils';

type LinkType = typeof links.$inferSelect;

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
      <div className="text-center py-12 text-muted-foreground">
        <p>Sie haben noch keine Links erstellt.</p>
        <Link
          href="/"
          className="mt-4 inline-block text-primary hover:text-primary/90 font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
        >
          Erstellen Sie Ihren ersten Link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              Alle
            </Button>
            <Button
              variant={filterStatus === 'public' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('public')}
            >
              Öffentlich
            </Button>
            <Button
              variant={filterStatus === 'private' ? 'default' : 'outline'}
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
            className="px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-input min-h-[44px]"
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
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              aria-label="Tabellenansicht"
            >
              📊
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
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
            <span className="text-sm text-muted-foreground">Aktive Filter:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground rounded text-sm">
                Suche: {searchQuery}
                <button onClick={() => setSearchQuery('')} className="hover:text-foreground">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground rounded text-sm">
                Status: {filterStatus === 'public' ? 'Öffentlich' : 'Privat'}
                <button onClick={() => setFilterStatus('all')} className="hover:text-foreground">
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
        <div className="mt-2 text-sm text-muted-foreground">
          {filteredLinks.length} von {links.length} Links angezeigt
        </div>
      </div>

      {/* Links Display */}
      {filteredLinks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Keine Links gefunden, die den Filtern entsprechen.</p>
          <Button variant="outline" onClick={clearFilters} className="mt-4">
            Filter zurücksetzen
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Short Code
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ziel-URL
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Klicks
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredLinks.map((link) => (
                <tr key={link.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <code className="text-sm font-mono text-primary">
                        {link.shortCode}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyShortUrl(link.shortCode)}
                        title="Kopieren"
                        aria-label={`Short Code ${link.shortCode} kopieren`}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <ClipboardIcon className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="text-sm text-foreground max-w-md truncate">
                      {link.longUrl}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{link.hits}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      link.isPublic
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {link.isPublic ? 'Öffentlich' : 'Privat'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <a
                        href={`/s/${link.shortCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ansehen"
                        aria-label={`Link ${link.shortCode} öffnen`}
                        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "h-8 w-8 text-primary hover:text-primary/80")}
                      >
                        <EyeIcon className="h-4 w-4" aria-hidden="true" />
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(link.id)}
                        disabled={deleting === link.id}
                        className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                        title="Löschen"
                        aria-label={`Link ${link.shortCode} löschen`}
                      >
                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
                      </Button>
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
