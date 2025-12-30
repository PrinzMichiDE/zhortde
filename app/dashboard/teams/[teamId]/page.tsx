'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Users, UserPlus, Shield, Settings, Mail, Calendar } from 'lucide-react';

type TeamDetails = {
  id: number;
  name: string;
  createdAt: string;
  ownerId: number;
  currentUserRole: string;
};

type TeamMember = {
  userId: number;
  email: string;
  role: string;
  joinedAt: string;
};

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'members' | 'settings'>('members');
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Invite state
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    if (params.teamId) {
      fetchTeamData();
    }
  }, [params.teamId]);

  const fetchTeamData = async () => {
    try {
      // Fetch Team Details
      const teamRes = await fetch(`/api/teams/${params.teamId}`);
      if (!teamRes.ok) throw new Error('Failed to load team');
      const teamData = await teamRes.json();
      setTeam(teamData);

      // Fetch Members
      const membersRes = await fetch(`/api/teams/${params.teamId}/members`);
      if (!membersRes.ok) throw new Error('Failed to load members');
      const membersData = await membersRes.json();
      setMembers(membersData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const res = await fetch(`/api/teams/${params.teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to invite user');
      }

      setInviteSuccess(`Einladung an ${inviteEmail} gesendet!`);
      setInviteEmail('');
      setIsInviting(false);
      
      // Refresh members list
      fetchTeamData();

    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">⚠️ {error || 'Team nicht gefunden'}</p>
          <Button onClick={() => router.push('/dashboard/teams')}>Zurück zur Übersicht</Button>
        </div>
      </div>
    );
  }

  const canManageTeam = team.currentUserRole === 'owner' || team.currentUserRole === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                 <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Team</span>
                 <span className="text-gray-300 dark:text-gray-600">|</span>
                 <span className="text-sm text-gray-500 dark:text-gray-400">Gegründet {new Date(team.createdAt).toLocaleDateString()}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                {team.name}
                <span className={`text-sm font-normal px-3 py-1 rounded-full border ${
                   team.currentUserRole === 'owner' 
                   ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' 
                   : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                }`}>
                  {team.currentUserRole}
                </span>
              </h1>
            </div>
            
            <div className="flex gap-3">
               <Button variant="outline" onClick={() => router.push('/dashboard/teams')}>
                 &larr; Zurück
               </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-4 px-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'members'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Mitglieder ({members.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-4 px-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Einstellungen
            </div>
          </button>
        </div>

        {activeTab === 'members' && (
          <div className="space-y-6">
            
            {/* Invite Box */}
            {canManageTeam && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Neues Mitglied einladen</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fügen Sie Kollegen zu Ihrem Team hinzu.</p>
                  </div>
                  {!isInviting && (
                    <Button onClick={() => setIsInviting(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Mitglied einladen
                    </Button>
                  )}
                </div>

                {isInviting && (
                  <form onSubmit={handleInvite} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg animate-fade-in border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-Mail Adresse</label>
                        <Input 
                          type="email" 
                          placeholder="kollege@firma.de" 
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="w-full md:w-48">
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rolle</label>
                         <select 
                           value={inviteRole}
                           onChange={(e) => setInviteRole(e.target.value)}
                           className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                         >
                           <option value="member">Mitglied</option>
                           <option value="admin">Admin</option>
                         </select>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <Button type="button" variant="outline" onClick={() => setIsInviting(false)}>
                          Abbrechen
                        </Button>
                        <Button type="submit" loading={inviteLoading}>
                          Einladen
                        </Button>
                      </div>
                    </div>
                    {inviteError && <p className="text-red-600 text-sm mt-2">{inviteError}</p>}
                    {inviteSuccess && <p className="text-green-600 text-sm mt-2">{inviteSuccess}</p>}
                  </form>
                )}
              </div>
            )}

            {/* Members List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
               <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                 <thead className="bg-gray-50 dark:bg-gray-700/50">
                   <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rolle</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dabei seit</th>
                     {canManageTeam && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aktionen</th>}
                   </tr>
                 </thead>
                 <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                   {members.map((member) => (
                     <tr key={member.userId}>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center">
                           <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                             {member.email.charAt(0).toUpperCase()}
                           </div>
                           <div className="ml-4">
                             <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.email}</div>
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                           <Shield className="h-4 w-4 mr-1 text-gray-400" />
                           {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                           <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                           {new Date(member.joinedAt).toLocaleDateString()}
                         </div>
                       </td>
                       {canManageTeam && (
                         <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                           {member.role !== 'owner' && (
                             <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Entfernen</button>
                           )}
                         </td>
                       )}
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Team Einstellungen</h3>
            <p className="text-gray-500 dark:text-gray-400">Einstellungen für den Team-Namen und Löschung kommen bald.</p>
          </div>
        )}

      </div>
    </div>
  );
}
