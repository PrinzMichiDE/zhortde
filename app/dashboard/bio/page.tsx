'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import Link from 'next/link';

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
    const newLinks = [...links];
    // @ts-ignore
    newLinks[index][field] = value;
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="p-8 text-center">
        <p>Bitte melden Sie sich an.</p>
        <Link href="/login" className="text-indigo-600 hover:underline">Zum Login</Link>
      </div>
    );
  }

  if (fetching) {
    return <div className="p-12 text-center text-gray-500">Lade Profil...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-12">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Link-in-Bio Editor</h1>
          <p className="text-gray-600 dark:text-gray-400">Erstellen Sie Ihre persönliche Profilseite.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor Column */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 space-y-6">
              
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Profil Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Username (URL)</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                        zhort.de/bio/
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 min-h-[42px] px-3"
                        placeholder="ihr-name"
                      />
                    </div>
                  </div>

                  <Input 
                    label="Anzeigename" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    placeholder="Max Mustermann"
                  />

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px] p-3 text-gray-900 dark:text-gray-100"
                      placeholder="Erzählen Sie etwas über sich..."
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Links</h2>
                <div className="space-y-4">
                  {links.map((link, idx) => (
                    <div key={idx} className="flex gap-3 items-start bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex-1 space-y-3">
                        <Input 
                          placeholder="Link Titel (z.B. Meine Website)" 
                          value={link.title}
                          onChange={(e) => updateLink(idx, 'title', e.target.value)}
                        />
                        <Input 
                          placeholder="URL (https://...)" 
                          value={link.url}
                          onChange={(e) => updateLink(idx, 'url', e.target.value)}
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeLink(idx)}
                        className="text-red-500 hover:text-red-700 p-2"
                        title="Entfernen"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  
                  <Button type="button" variant="outline" onClick={addLink} fullWidth>
                    + Link hinzufügen
                  </Button>
                </div>
              </div>

              {error && <Alert variant="error">{error}</Alert>}
              {success && <Alert variant="success">Profil erfolgreich gespeichert!</Alert>}

              <div className="pt-4">
                <Button type="submit" loading={loading} size="lg" fullWidth>
                  Speichern & Veröffentlichen
                </Button>
              </div>

              {username && (
                <div className="mt-4 text-center">
                  <Link 
                    href={`/bio/${username}`} 
                    target="_blank"
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                  >
                    Öffentliche Profilseite ansehen &rarr;
                  </Link>
                </div>
              )}

            </form>
          </div>

          {/* Live Preview Column */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 text-center">Vorschau</h2>
              <div className="border-8 border-gray-900 rounded-[3rem] overflow-hidden shadow-2xl bg-white h-[800px] relative">
                {/* Phone Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-xl z-20"></div>
                
                {/* Preview Content */}
                <div className="h-full overflow-y-auto bg-white text-gray-900 p-6 pt-12 flex flex-col items-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 flex items-center justify-center text-3xl font-bold text-gray-600">
                    {displayName ? displayName.charAt(0).toUpperCase() : '?'}
                  </div>
                  <h3 className="font-bold text-xl mb-1 text-center">{displayName || 'Ihr Name'}</h3>
                  <p className="text-center text-gray-600 text-sm mb-6">{bio || 'Ihre Bio erscheint hier...'}</p>
                  
                  <div className="w-full space-y-3">
                    {links.map((link, idx) => (
                      <div key={idx} className="w-full p-3 bg-gray-100 rounded-lg text-center font-medium border border-gray-200 truncate">
                        {link.title || 'Link Titel'}
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-8 text-xs text-gray-400">
                    Powered by Zhort
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
