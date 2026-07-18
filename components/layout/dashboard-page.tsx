import type { HTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type DashboardPageProps = HTMLAttributes<HTMLDivElement> & {
  maxWidth?: '4xl' | '6xl' | '7xl' | 'full';
};

const maxWidthClass = {
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
} as const;

export function DashboardPage({
  children,
  className,
  maxWidth = '7xl',
  ...props
}: DashboardPageProps) {
  return (
    <div className={cn('min-h-full bg-background', className)} {...props}>
      <div className={cn(maxWidthClass[maxWidth], 'mx-auto px-4 py-8 sm:px-6 lg:px-10')}>
        {children}
      </div>
    </div>
  );
}

type DashboardPageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function DashboardPageHeader({
  title,
  description,
  actions,
  className,
}: DashboardPageHeaderProps) {
  return (
    <header
      className={cn(
        'mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-2 text-muted-foreground leading-relaxed">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function DashboardBackLink({
  href = '/dashboard',
  children = '← Zurück zum Dashboard',
  className,
}: {
  href?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-block text-sm font-medium text-primary hover:underline mb-4',
        className
      )}
    >
      {children}
    </Link>
  );
}

export function DashboardPanel({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-border bg-card p-6 shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function DashboardEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-16 px-6 text-center',
        className
      )}
    >
      {icon ? <div className="mb-4 text-4xl" aria-hidden>{icon}</div> : null}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description ? <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p> : null}
      {action}
    </div>
  );
}
