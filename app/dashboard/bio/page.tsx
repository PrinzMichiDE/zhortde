'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import Link from 'next/link';
import { Trash2, GripVertical, ArrowUp, ArrowDown, ExternalLink, Plus } from 'lucide-react';

export default function BioDashboardPage() {
  const { data: session } = useSession();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [links, setLinks] = useState<{ title: string; url: string }[]>([{ title: '', url: '' }]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Design settings
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/bio');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setUsername(data.username || '');
          setDisplayName(data.displayName || '');
          setBio(data.bio || '');
          if (data.links && data.links.length > 0) {
            setLinks(data.links);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const addLink = () => {
    setLinks([...links, { title: '', url: '' }]);
  };

  const removeLink = (index: number) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    setLinks(newLinks);
  };

  const updateLink = (index: number, field: 'title' | 'url', value: string) => {
    setLinks((prev) =>
      prev.map((link, i) => {
        if (i !== index) return link;
        return field === 'title' ? { ...link, title: value } : { ...link, url: value };
      })
    );
  };

  const moveLink = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === links.length - 1) return;
    
    const newLinks = [...links];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newLinks[index];
    newLinks[index] = newLinks[targetIndex];
    newLinks[targetIndex] = temp;
    setLinks(newLinks);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          displayName,
          bio,
          links: links.filter(l => l.title && l.url) // Only save valid links
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Speichern');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Fehler beim Speichern';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <p className="text-xl mb-4 text-gray-700 dark:text-gray-300">Bitte melden Sie sich an, um Ihr Profil zu bearbeiten.</p>
          <Link href="/login" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            Zum Login
          </Link>
        </div>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Link-in-Bio Editor</h1>
            <p className="text-gray-600 dark:text-gray-400">Gestalten Sie Ihre persönliche Landingpage für Social Media.</p>
          </div>
          {username && (
             <a 
               href={`/bio/${username}`} 
               target="_blank"
               className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
             >
               Profil ansehen <ExternalLink className="ml-2 h-4 w-4" />
             </a>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Editor Column */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Profile Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  👤 Profil Details
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                      Öffentliche URL
                    </label>
                    <div className="flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm font-mono">
                        zhort.de/bio/
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 min-h-[42px] px-3 sm:text-sm"
                        placeholder="ihr-name"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Dies ist die Adresse Ihres Profils.</p>
                  </div>

                  <Input 
                    label="Anzeigename" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    placeholder="Max Mustermann"
                  />

                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Biografie</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px] p-3 text-gray-900 dark:text-gray-100 text-sm shadow-sm"
                      placeholder="Erzählen Sie Ihren Besuchern kurz, wer Sie sind..."
                    />
                  </div>
                </div>
              </div>

              {/* Links Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    🔗 Links
                  </h2>
                  <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                    {links.length} Links
                  </span>
                </div>
                
                <div className="space-y-4">
                  {links.map((link, idx) => (
                    <div key={idx} className="group flex gap-3 items-start bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700 transition-all hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-sm">
                      
                      {/* Drag Handle & Sort Buttons */}
                      <div className="flex flex-col gap-1 pt-2">
                        <button 
                          type="button" 
                          onClick={() => moveLink(idx, 'up')}
                          disabled={idx === 0}
                          className="text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-400"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => moveLink(idx, 'down')}
                          disabled={idx === links.length - 1}
                          className="text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-400"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex-1 space-y-3">
                        <input 
                          type="text"
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 font-medium"
                          placeholder="Link Titel (z.B. Meine Website)" 
                          value={link.title}
                          onChange={(e) => updateLink(idx, 'title', e.target.value)}
                        />
                        <input 
                          type="url"
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-500 dark:text-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs px-3 py-2 font-mono"
                          placeholder="URL (https://...)" 
                          value={link.url}
                          onChange={(e) => updateLink(idx, 'url', e.target.value)}
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeLink(idx)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors mt-1"
                        title="Entfernen"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addLink} 
                    className="w-full border-dashed border-2 py-4 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Neuen Link hinzufügen
                  </Button>
                </div>
              </div>

              {/* Status Messages */}
              {error && <Alert variant="error">{error}</Alert>}
              {success && <Alert variant="success">Profil erfolgreich gespeichert!</Alert>}

              {/* Action Bar */}
              <div className="sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center gap-4">
                 <span className="text-sm text-gray-500 hidden sm:inline">
                   Vergessen Sie nicht zu speichern!
                 </span>
                 <Button type="submit" loading={loading} size="lg" className="w-full sm:w-auto shadow-lg shadow-indigo-500/20">
                   Speichern & Veröffentlichen
                 </Button>
              </div>

            </form>
          </div>

          {/* Live Preview Column */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="sticky top-24">
              <div className="flex justify-center mb-6 gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit mx-auto">
                <button
                  onClick={() => setPreviewTheme('light')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    previewTheme === 'light' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                  }`}
                >
                  Light Mode
                </button>
                <button
                  onClick={() => setPreviewTheme('dark')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    previewTheme === 'dark' 
                    ? 'bg-gray-800 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                  }`}
                >
                  Dark Mode
                </button>
              </div>

              <div className="mx-auto w-[320px] h-[680px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl relative border-4 border-gray-800 ring-1 ring-white/10">
                {/* Phone Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-xl z-20 pointer-events-none"></div>
                
                {/* Power Button */}
                <div className="absolute top-24 -right-1.5 w-1 h-12 bg-gray-800 rounded-r-md"></div>
                {/* Volume Buttons */}
                <div className="absolute top-24 -left-1.5 w-1 h-8 bg-gray-800 rounded-l-md"></div>
                <div className="absolute top-36 -left-1.5 w-1 h-8 bg-gray-800 rounded-l-md"></div>

                {/* Preview Content */}
                <div className={`h-full w-full rounded-[2.5rem] overflow-hidden overflow-y-auto ${
                  previewTheme === 'dark' ? 'bg-slate-950 text-white' : 'bg-white text-gray-900'
                }`}>
                  <div className="min-h-full p-6 pt-16 flex flex-col items-center transition-colors duration-300">
                    
                    {/* Avatar Placeholder */}
                    <div className={`w-24 h-24 rounded-full mb-4 flex items-center justify-center text-3xl font-bold border-4 shadow-sm ${
                      previewTheme === 'dark' 
                      ? 'bg-slate-800 border-slate-700 text-slate-300' 
                      : 'bg-gray-100 border-white text-gray-500'
                    }`}>
                      {displayName ? displayName.charAt(0).toUpperCase() : '?'}
                    </div>
                    
                    <h3 className="font-bold text-xl mb-1 text-center px-2">{displayName || 'Ihr Name'}</h3>
                    <p className={`text-center text-sm mb-8 px-2 leading-relaxed ${
                      previewTheme === 'dark' ? 'text-slate-400' : 'text-gray-600'
                    }`}>
                      {bio || 'Ihre Bio erscheint hier...'}
                    </p>
                    
                    <div className="w-full space-y-3 mb-8">
                      {links.filter(l => l.title).map((link, idx) => (
                        <div key={idx} className={`w-full p-4 rounded-xl text-center font-medium border shadow-sm transition-all transform hover:scale-[1.02] ${
                          previewTheme === 'dark' 
                          ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-slate-700' 
                          : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300'
                        }`}>
                          {link.title}
                        </div>
                      ))}
                      {links.filter(l => l.title).length === 0 && (
                         <div className={`w-full p-4 rounded-xl text-center border border-dashed opacity-50 ${
                           previewTheme === 'dark' ? 'border-slate-700 text-slate-500' : 'border-gray-300 text-gray-400'
                         }`}>
                           Links erscheinen hier
                         </div>
                      )}
                    </div>

                    <div className="mt-auto pt-8 pb-4">
                       <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${
                         previewTheme === 'dark' ? 'bg-slate-900 text-slate-500' : 'bg-gray-100 text-gray-400'
                       }`}>
                         zhort.de
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
