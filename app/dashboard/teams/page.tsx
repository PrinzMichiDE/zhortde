'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

type Team = {
  id: number;
  name: string;
  role: string;
  memberCount: number;
};

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!newTeamName.trim()) throw new Error('Team Name ist erforderlich');
      
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Erstellen des Teams');
      }
      
      // Update list
      const newTeam: Team = {
        id: data.id,
        name: data.name,
        role: 'owner', // Default for creator
        memberCount: 1 // Only creator
      };

      setTeams([...teams, newTeam]);
      setIsCreating(false);
      setNewTeamName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen des Teams');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
              Teams
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Arbeiten Sie gemeinsam an Links und Kampagnen.
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} size="lg" className="shadow-lg hover:shadow-xl">
            + Neues Team erstellen
          </Button>
        </div>

        {/* Create Modal / Form (Inline for simplicity now) */}
        {isCreating && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 mb-8 animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Neues Team erstellen</h2>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <Input 
                label="Team Name"
                placeholder="z.B. Marketing Department"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                required
              />
              {error && <Alert variant="error">{error}</Alert>}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" loading={loading}>
                  Team erstellen
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Teams Grid */}
        {fetching ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[1, 2, 3].map((i) => (
               <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
             ))}
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            {teams.length === 0 && !isCreating ? (
              <div className="col-span-full text-center py-16 bg-white/50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <span className="text-6xl mb-4 block">👥</span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Keine Teams vorhanden</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Erstellen Sie Ihr erstes Team, um loszulegen.
                </p>
                <Button onClick={() => setIsCreating(true)}>
                  Jetzt Team erstellen
                </Button>
              </div>
            ) : (
              teams.map((team) => (
                <div key={team.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                      team.role === 'owner' 
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' 
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                    }`}>
                      {team.role}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{team.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {team.memberCount} {team.memberCount === 1 ? 'Mitglied' : 'Mitglieder'}
                  </p>

                  <div className="flex gap-2">
                    <Button variant="outline" fullWidth size="sm" onClick={() => router.push(`/dashboard/teams/${team.id}`)}>
                      Einstellungen
                    </Button>
                    <Button fullWidth size="sm" onClick={() => router.push(`/dashboard/teams/${team.id}`)}>
                      Ansehen &rarr;
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
