'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Link as LinkIcon, 
  FileText, 
  Key, 
  Webhook, 
  Users, 
  Zap, 
  Settings,
  Lock,
  Share2,
  CloudUpload,
  BarChart3,
  Package,
  Menu,
  X,
  Fingerprint
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Links', href: '/dashboard/links', icon: LinkIcon },
    { name: 'Pastes', href: '/dashboard/pastes', icon: FileText },
    { name: 'Password Sharing', href: '/passwords/create', icon: Lock },
    { name: 'P2P File Sharing', href: '/p2p/create', icon: Share2 },
    { name: 'Passkeys', href: '/dashboard/passkeys', icon: Fingerprint },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Bulk Shorten', href: '/dashboard/bulk', icon: Package },
    { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
    { name: 'Webhooks', href: '/dashboard/webhooks', icon: Webhook },
    { name: 'Teams', href: '/dashboard/teams', icon: Users },
    { name: 'Integrations', href: '/dashboard/integrations', icon: Zap },
    { name: 'Bio Pages', href: '/dashboard/bio', icon: CloudUpload },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b-2 border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-lg">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">Z</span>
          </div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Zhort
          </span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white dark:bg-gray-900 pt-16">
          <nav className="overflow-y-auto h-full p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                             (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 dark:text-gray-400'
                    )}
                  />
                  <span className="flex-1">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r-2 border-gray-200 dark:border-gray-800 h-screen sticky top-0 shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b-2 border-gray-200 dark:border-gray-800 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                <span className="text-white font-bold text-xl">Z</span>
              </div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Zhort
              </span>
            </Link>
          </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
                           (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 shadow-md shadow-indigo-500/10'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 hover:shadow-sm'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-r-full" />
                )}
                <Icon
                  className={cn(
                    'w-5 h-5 transition-all duration-200',
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 scale-110'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:scale-110'
                  )}
                />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t-2 border-gray-200 dark:border-gray-800 mt-auto">
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs">🔒</span>
              </div>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                Zero-Knowledge
              </p>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Your data is encrypted end-to-end
            </p>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
