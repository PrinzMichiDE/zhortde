'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, LineChart, Line, ComposedChart } from 'recharts';
import { TrendingUp, Users, Globe, Smartphone, Clock, Monitor, Link as LinkIcon, MapPin, Download, Calendar, Activity, Zap, TrendingDown } from 'lucide-react';

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
    osBreakdown?: Record<string, number>;
    referrerBreakdown?: Record<string, number>;
    referrerDomains?: Record<string, number>;
    cityBreakdown?: Array<{ city: string | null; country: string | null; count: number }>;
    recentClicks: Array<{
      id: number;
      ipAddress: string | null;
      country: string | null;
      city?: string | null;
      deviceType: string | null;
      browser: string | null;
      os?: string | null;
      referer?: string | null;
      clickedAt: string;
    }>;
    clicksOverTime?: Array<{
      date: string;
      count: number;
    }>;
    hourlyBreakdown?: Record<number, number>;
    dayOfWeekBreakdown?: Record<number, number>;
    monthlyBreakdown?: Array<{ month: string; count: number }>;
    metrics?: {
      averageClicksPerDay: number;
      peakHour: number;
      peakHourClicks: number;
      peakDay: number;
      peakDayName: string;
      peakDayClicks: number;
      growthRate: number;
      daysSinceCreation: number;
      recentClicksCount: number;
      previousClicksCount: number;
    };
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

  const osData = Object.entries(analytics.osBreakdown || {}).map(([name, value]) => ({
    name: name || 'Unknown',
    value,
  }));

  const referrerData = Object.entries(analytics.referrerBreakdown || {})
    .map(([name, value]) => ({ 
      name: name === 'direct' ? 'Direct' : name.length > 30 ? name.substring(0, 30) + '...' : name, 
      value,
      fullName: name 
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const cityData = (analytics.cityBreakdown || [])
    .map((item) => ({
      name: item.city ? `${item.city}, ${item.country || ''}` : item.country || 'Unknown',
      value: item.count,
    }))
    .slice(0, 15);

  const timeData = analytics.clicksOverTime || [];

  // Hourly data (0-23)
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: analytics.hourlyBreakdown?.[i] || 0,
    label: `${i}:00`,
  }));

  // Day of week data
  const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const dayOfWeekData = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    name: dayNames[i],
    count: analytics.dayOfWeekBreakdown?.[i] || 0,
  }));

  // Monthly data
  const monthlyData = (analytics.monthlyBreakdown || []).map((item) => ({
    month: item.month,
    count: item.count,
  }));

  // Referrer domains data
  const referrerDomainsData = Object.entries(analytics.referrerDomains || {})
    .map(([domain, count]) => ({ name: domain, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const metrics = analytics.metrics || {
    averageClicksPerDay: 0,
    peakHour: 0,
    peakHourClicks: 0,
    peakDay: 0,
    peakDayName: 'Unknown',
    peakDayClicks: 0,
    growthRate: 0,
    daysSinceCreation: 0,
    recentClicksCount: 0,
    previousClicksCount: 0,
  };

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
            <div className="flex items-center gap-3">
              <a
                href={`/api/analytics/${params.linkId}/export?format=csv`}
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                CSV Export
              </a>
              <a href="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium">
                &larr; Zurück
              </a>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up">
          <StatCard
            title="Total Clicks"
            value={analytics.totalClicks}
            icon={<TrendingUp className="h-6 w-6" />}
            color="indigo"
            subtitle={`Ø ${metrics.averageClicksPerDay.toFixed(1)} pro Tag`}
          />
          <StatCard
            title="Unique Visitors"
            value={analytics.uniqueIps}
            icon={<Users className="h-6 w-6" />}
            color="purple"
            subtitle={`${metrics.daysSinceCreation} Tage aktiv`}
          />
          <StatCard
            title="Wachstum (7 Tage)"
            value={`${metrics.growthRate >= 0 ? '+' : ''}${metrics.growthRate.toFixed(1)}%`}
            icon={metrics.growthRate >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            color={metrics.growthRate >= 0 ? "green" : "red"}
            subtitle={`${metrics.recentClicksCount} vs ${metrics.previousClicksCount}`}
          />
          <StatCard
            title="Peak Stunde"
            value={`${metrics.peakHour}:00`}
            icon={<Zap className="h-6 w-6" />}
            color="orange"
            subtitle={`${metrics.peakHourClicks} Klicks`}
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <StatCard
            title="Peak Tag"
            value={metrics.peakDayName}
            icon={<Calendar className="h-6 w-6" />}
            color="pink"
            subtitle={`${metrics.peakDayClicks} Klicks`}
          />
          <StatCard
            title="Top Länder"
            value={Object.keys(analytics.countryBreakdown).length}
            icon={<Globe className="h-6 w-6" />}
            color="blue"
            subtitle={`${Object.values(analytics.countryBreakdown).reduce((a, b) => a + b, 0)} Klicks`}
          />
          <StatCard
            title="Geräte-Typen"
            value={Object.keys(analytics.deviceBreakdown).length}
            icon={<Smartphone className="h-6 w-6" />}
            color="teal"
            subtitle={`${Object.values(analytics.deviceBreakdown).reduce((a, b) => a + b, 0)} Klicks`}
          />
          <StatCard
            title="Referrer Domains"
            value={Object.keys(analytics.referrerDomains || {}).length}
            icon={<LinkIcon className="h-6 w-6" />}
            color="indigo"
            subtitle={`${Object.values(analytics.referrerDomains || {}).reduce((a, b) => a + b, 0)} Klicks`}
          />
        </div>

        {/* Time Series Chart */}
        {timeData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-100 dark:border-gray-700 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Klicks über Zeit (Täglich)
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

        {/* Hourly and Day of Week Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 animate-slide-up" style={{ animationDelay: '150ms' }}>
          {/* Hourly Breakdown */}
          {hourlyData.some(d => d.count > 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                Klicks nach Stunden
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="#9ca3af" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `${value}h`}
                    />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      labelFormatter={(value) => `${value}:00 Uhr`}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Day of Week Breakdown */}
          {dayOfWeekData.some(d => d.count > 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-pink-500" />
                Klicks nach Wochentag
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayOfWeekData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#9ca3af" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Monthly Chart */}
        {monthlyData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-100 dark:border-gray-700 animate-slide-up" style={{ animationDelay: '175ms' }}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Klicks nach Monat
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#9ca3af" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                </LineChart>
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

        {/* OS and Browser Breakdown */}
        {osData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 animate-slide-up" style={{ animationDelay: '250ms' }}>
            {/* OS Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-500" />
                Betriebssysteme
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={osData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Browser Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                <Monitor className="h-5 w-5 text-green-500" />
                Browser
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={browserData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Referrer and City Breakdown */}
        {(referrerData.length > 0 || cityData.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 animate-slide-up" style={{ animationDelay: '300ms' }}>
            {/* Referrer Domains Breakdown */}
            {referrerDomainsData.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-orange-500" />
                  Top Referrer Domains
                </h2>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={referrerDomainsData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} width={95} />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* City Breakdown */}
            {cityData.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-teal-500" />
                  Top Städte
                </h2>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cityData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} width={95} />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar dataKey="value" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl shadow-lg p-6 mb-8 border border-indigo-200 dark:border-indigo-800 animate-slide-up" style={{ animationDelay: '250ms' }}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Zusammenfassung
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4">
              <p className="text-gray-600 dark:text-gray-400 mb-1">Durchschnitt pro Tag</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.averageClicksPerDay.toFixed(1)}</p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4">
              <p className="text-gray-600 dark:text-gray-400 mb-1">Beste Stunde</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.peakHour}:00</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{metrics.peakHourClicks} Klicks</p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4">
              <p className="text-gray-600 dark:text-gray-400 mb-1">Bester Wochentag</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metrics.peakDayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{metrics.peakDayClicks} Klicks</p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4">
              <p className="text-gray-600 dark:text-gray-400 mb-1">Wachstum (7 Tage)</p>
              <p className={`text-2xl font-bold ${metrics.growthRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {metrics.growthRate >= 0 ? '+' : ''}{metrics.growthRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {metrics.recentClicksCount} vs {metrics.previousClicksCount}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Clicks */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" />
              Letzte Klicks
            </h2>
            <div className="flex gap-2">
              <a
                href={`/api/analytics/${params.linkId}/export?format=json`}
                download
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors"
              >
                <Download className="w-3 h-3" />
                JSON
              </a>
            </div>
          </div>
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
                    OS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Referrer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {analytics.recentClicks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
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
                        {click.city ? `${click.city}, ` : ''}{click.country || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {click.deviceType || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {click.browser || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {click.os || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={click.referer || 'Direct'}>
                        {click.referer ? (click.referer.length > 30 ? click.referer.substring(0, 30) + '...' : click.referer) : 'Direct'}
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
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-4 rounded-xl shadow-sm ${colorClasses[color as keyof typeof colorClasses] || colorClasses.indigo}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
