'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, Globe, Smartphone, Clock } from 'lucide-react';

type AnalyticsData = {
  link: {
    id: number;
    shortCode: string;
    longUrl: string;
    createdAt: string;
  };
  analytics: {
    totalClicks: number;
    uniqueIps: number;
    deviceBreakdown: Record<string, number>;
    countryBreakdown: Record<string, number>;
    browserBreakdown: Record<string, number>;
    recentClicks: Array<{
      id: number;
      ipAddress: string | null;
      country: string | null;
      deviceType: string | null;
      browser: string | null;
      clickedAt: string;
    }>;
    clicksOverTime?: Array<{
      date: string;
      count: number;
    }>;
  };
};

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function AnalyticsDashboardPage() {
  const params = useParams();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(`/api/analytics/${params.linkId}`);
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const analytics = await res.json();
        setData(analytics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [params.linkId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-xl mb-4">⚠️ {error || 'Keine Daten verfügbar'}</p>
          <a href="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Zurück zum Dashboard
          </a>
        </div>
      </div>
    );
  }

  const { link, analytics } = data;

  // Transform data for charts
  const deviceData = Object.entries(analytics.deviceBreakdown).map(([name, value]) => ({
    name: name || 'Unknown',
    value,
  }));

  const countryData = Object.entries(analytics.countryBreakdown)
    .map(([name, value]) => ({ name: name || 'Unknown', value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const browserData = Object.entries(analytics.browserBreakdown).map(([name, value]) => ({
    name: name || 'Unknown',
    value,
  }));

  const timeData = analytics.clicksOverTime || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-8 border border-gray-100 dark:border-gray-700 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Analytics Dashboard</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-md font-bold">/{link.shortCode}</span>
                <span className="text-gray-400 dark:text-gray-600">→</span>
                <span className="truncate max-w-md" title={link.longUrl}>{link.longUrl}</span>
              </div>
            </div>
            <a href="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium">
              &larr; Zurück
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up">
          <StatCard
            title="Total Clicks"
            value={analytics.totalClicks}
            icon={<TrendingUp className="h-6 w-6" />}
            color="indigo"
          />
          <StatCard
            title="Unique Visitors"
            value={analytics.uniqueIps}
            icon={<Users className="h-6 w-6" />}
            color="purple"
          />
          <StatCard
            title="Top Countries"
            value={Object.keys(analytics.countryBreakdown).length}
            icon={<Globe className="h-6 w-6" />}
            color="pink"
          />
          <StatCard
            title="Device Types"
            value={Object.keys(analytics.deviceBreakdown).length}
            icon={<Smartphone className="h-6 w-6" />}
            color="blue"
          />
        </div>

        {/* Time Series Chart */}
        {timeData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-100 dark:border-gray-700 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Klicks über Zeit
            </h2>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
          {/* Device Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-purple-500" />
              Geräte
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Country Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <Globe className="h-5 w-5 text-pink-500" />
              Top Länder
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Clicks */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-500" />
            Letzte Klicks
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Zeit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Land
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Gerät
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Browser
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {analytics.recentClicks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      Noch keine Klicks verzeichnet.
                    </td>
                  </tr>
                ) : (
                  analytics.recentClicks.map((click) => (
                    <tr key={click.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {new Date(click.clickedAt).toLocaleString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {click.country || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {click.deviceType || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {click.browser || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-500 font-mono">
                        {click.ipAddress ? `${click.ipAddress.substring(0, 7)}...` : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{value.toLocaleString()}</p>
        </div>
        <div className={`p-4 rounded-xl shadow-sm ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
