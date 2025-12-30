'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TrashIcon, EyeIcon, ClipboardIcon, MagnifyingGlassIcon, XMarkIcon, EllipsisVerticalIcon, ChartBarIcon, ClockIcon, CalendarIcon, QrCodeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
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
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter and sort links
  const filteredLinks = useMemo(() => {
    let filtered = [...links];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(link =>
        link.shortCode.toLowerCase().includes(query) ||
        link.longUrl.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(link =>
        filterStatus === 'public' ? link.isPublic : !link.isPublic
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'clicks-desc': return b.hits - a.hits;
        case 'clicks-asc': return a.hits - b.hits;
        case 'url-asc': return a.longUrl.localeCompare(b.longUrl);
        case 'url-desc': return b.longUrl.localeCompare(a.longUrl);
        default: return 0;
      }
    });

    return filtered;
  }, [links, searchQuery, sortBy, filterStatus]);

  const handleDelete = async (id: number) => {
    if (!confirm('Möchten Sie diesen Link wirklich löschen?')) return;
    setDeleting(id);
    try {
      const response = await fetch(`/api/links/${id}`, { method: 'DELETE' });
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
    // Optional: Toast notification here
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setSelectedTags([]);
  };

  const toggleMenu = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
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
          <div className="flex-1 relative">
             <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
             <Input
               type="text"
               placeholder="Suchen..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="pl-10"
             />
          </div>
          <div className="flex gap-2">
            <Button variant={filterStatus === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus('all')}>Alle</Button>
            <Button variant={filterStatus === 'public' ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus('public')}>Öffentlich</Button>
            <Button variant={filterStatus === 'private' ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus('private')}>Privat</Button>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 border border-input rounded-lg bg-background text-foreground text-sm min-h-[40px]"
          >
            <option value="newest">Neueste</option>
            <option value="oldest">Älteste</option>
            <option value="clicks-desc">Klicks ↓</option>
            <option value="clicks-asc">Klicks ↑</option>
            <option value="url-asc">A-Z</option>
          </select>
          <div className="flex gap-2">
            <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('table')}>📊</Button>
            <Button variant={viewMode === 'cards' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('cards')}>🎴</Button>
          </div>
        </div>
        {(searchQuery || filterStatus !== 'all') && (
          <div className="mt-4 flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearFilters}>Filter zurücksetzen</Button>
          </div>
        )}
      </div>

      {filteredLinks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Keine Links gefunden.</div>
      ) : viewMode === 'table' ? (
        <div className="overflow-visible rounded-lg border border-border bg-card">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Link</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ziel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Klicks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLinks.map((link) => (
                <tr key={link.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-primary font-bold">{link.shortCode}</code>
                      <button onClick={() => copyShortUrl(link.shortCode)} className="text-muted-foreground hover:text-foreground">
                        <ClipboardIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-foreground max-w-xs truncate" title={link.longUrl}>{link.longUrl}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{link.hits}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${link.isPublic ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                      {link.isPublic ? 'Öffentlich' : 'Privat'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <div className="flex justify-end gap-2 items-center">
                      <a href={`/s/${link.shortCode}`} target="_blank" className="text-primary hover:text-primary/80 p-1">
                        <EyeIcon className="h-5 w-5" />
                      </a>
                      <div className="relative" ref={openMenuId === link.id ? menuRef : null}>
                        <button 
                          onClick={(e) => toggleMenu(link.id, e)} 
                          className="p-1 rounded-md hover:bg-muted transition-colors"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5 text-muted-foreground" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openMenuId === link.id && (
                          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-in fade-in zoom-in-95 duration-100">
                            <div className="py-1">
                              <Link href={`/dashboard/analytics/${link.id}`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <ChartBarIcon className="h-4 w-4" /> Analytics
                              </Link>
                              <Link href={`/dashboard/links/${link.id}/history`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <ClockIcon className="h-4 w-4" /> Verlauf
                              </Link>
                              <Link href={`/dashboard/links/${link.id}/schedule`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <CalendarIcon className="h-4 w-4" /> Zeitplan
                              </Link>
                              <Link href={`/dashboard/links/${link.id}/masking`} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                <ShieldCheckIcon className="h-4 w-4" /> Masking / Splash
                              </Link>
                              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                              <button 
                                onClick={() => handleDelete(link.id)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <TrashIcon className="h-4 w-4" /> Löschen
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((link) => (
            <LinkPreviewCard key={link.id} linkId={link.id} longUrl={link.longUrl} shortUrl={`${window.location.origin}/s/${link.shortCode}`} />
          ))}
        </div>
      )}
    </div>
  );
}
