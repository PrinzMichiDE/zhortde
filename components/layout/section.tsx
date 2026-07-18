import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type SectionProps = HTMLAttributes<HTMLElement> & {
  as?: 'section' | 'div';
};

export function PageShell({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('min-h-[calc(100vh-4rem)] bg-background', className)} {...props}>
      {children}
    </div>
  );
}

export function PageContainer({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8', className)} {...props}>
      {children}
    </div>
  );
}

export function Section({ as: Tag = 'section', children, className, ...props }: SectionProps) {
  return (
    <Tag className={cn('py-14 sm:py-16', className)} {...props}>
      {children}
    </Tag>
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: SectionHeaderProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <header className={cn('mb-10 sm:mb-12 max-w-2xl', alignClass, className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed">
          {description}
        </p>
      ) : null}
    </header>
  );
}

export function Surface({
  children,
  className,
  elevated,
  ...props
}: HTMLAttributes<HTMLDivElement> & { elevated?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card text-card-foreground',
        elevated ? 'shadow-md' : 'shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
