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
  Fingerprint,
  Building2,
  Folder,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ZhortLogo } from '@/components/zhort-logo';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navLinkClass = (isActive: boolean) =>
  cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary/10 text-primary border border-primary/20'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
  );

export function DashboardSidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Links', href: '/dashboard/links', icon: LinkIcon },
    { name: 'Collections', href: '/dashboard/collections', icon: Folder },
    { name: 'Pastes', href: '/dashboard/pastes', icon: FileText },
    { name: 'Password Sharing', href: '/passwords/create', icon: Lock },
    { name: 'P2P File Sharing', href: '/p2p/create', icon: Share2 },
    { name: 'Passkeys', href: '/dashboard/passkeys', icon: Fingerprint },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Bulk Shorten', href: '/dashboard/bulk', icon: Package },
    { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
    { name: 'Webhooks', href: '/dashboard/webhooks', icon: Webhook },
    { name: 'Teams', href: '/dashboard/teams', icon: Users },
    { name: 'Enterprise', href: '/dashboard/enterprise', icon: Building2 },
    { name: 'Integrations', href: '/dashboard/integrations', icon: Zap },
    { name: 'Bio Pages', href: '/dashboard/bio', icon: CloudUpload },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const renderNav = (onNavigate?: () => void) =>
    navItems.map((item) => {
      const isActive =
        pathname === item.href ||
        (item.href !== '/dashboard' && pathname?.startsWith(item.href));
      const Icon = item.icon;

      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={navLinkClass(!!isActive)}
        >
          <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
          <span className="flex-1">{item.name}</span>
          {item.badge ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
              {item.badge}
            </span>
          ) : null}
        </Link>
      );
    });

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-foreground">
          <ZhortLogo size="sm" />
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Menü"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen ? (
        <div className="lg:hidden fixed inset-0 z-40 bg-background pt-16">
          <nav className="h-full overflow-y-auto p-4 space-y-0.5">{renderNav(() => setMobileMenuOpen(false))}</nav>
        </div>
      ) : null}

      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card h-screen sticky top-0">
        <div className="border-b border-border p-5">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-foreground">
            <ZhortLogo size="sm" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">{renderNav()}</nav>

        <div className="border-t border-border p-4">
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <p className="text-xs font-semibold text-foreground mb-1">Zero-Knowledge</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your data is encrypted end-to-end
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
