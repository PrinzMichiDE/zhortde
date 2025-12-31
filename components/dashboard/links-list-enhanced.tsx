'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TrashIcon, EyeIcon, ClipboardIcon, MagnifyingGlassIcon, XMarkIcon, EllipsisVerticalIcon, ChartBarIcon, ClockIcon, CalendarIcon, QrCodeIcon, ShieldCheckIcon, PencilIcon } from '@heroicons/react/24/outline';
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

  // Edit state
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);
  const [editForm, setEditForm] = useState({ longUrl: '', isPublic: false, shortCode: '' });
  const [saving, setSaving] = useState(false);

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

  const handleEditClick = (link: LinkType) => {
    setEditingLink(link);
    setEditForm({ longUrl: link.longUrl, isPublic: link.isPublic, shortCode: link.shortCode });
    setOpenMenuId(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/links/${editingLink.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          longUrl: editForm.longUrl,
          isPublic: editForm.isPublic,
          shortCode: editForm.shortCode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Aktualisieren');
      }

      const updatedLink = await response.json();
      
      // Update local state
      setLinks(links.map(l => l.id === updatedLink.id ? updatedLink : l));
      setEditingLink(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Fehler beim Aktualisieren';
      alert(message);
    } finally {
      setSaving(false);
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
                              <button 
                                onClick={() => handleEditClick(link)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <PencilIcon className="h-4 w-4" /> Bearbeiten
                              </button>
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

      {/* Edit Modal */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Link bearbeiten</h3>
              <button onClick={() => setEditingLink(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ziel-URL
                </label>
                <Input
                  value={editForm.longUrl}
                  onChange={(e) => setEditForm({...editForm, longUrl: e.target.value})}
                  placeholder="https://..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Short Code
                </label>
                <div className="flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                    zhort.de/s/
                  </span>
                  <input
                    type="text"
                    value={editForm.shortCode}
                    onChange={(e) => setEditForm({...editForm, shortCode: e.target.value})}
                    className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 min-h-[42px] px-3 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={editForm.isPublic}
                  onChange={(e) => setEditForm({...editForm, isPublic: e.target.checked})}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                  Öffentlich sichtbar
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingLink(null)}>
                  Abbrechen
                </Button>
                <Button type="submit" loading={saving}>
                  Speichern
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
