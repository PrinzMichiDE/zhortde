import { cn } from '@/lib/utils';

type FeatureCardProps = {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  title: string;
  description: string;
  className?: string;
};

export function FeatureCard({ icon: Icon, title, description, className }: FeatureCardProps) {
  return (
    <article
      className={cn(
        'group flex flex-col h-full rounded-xl border border-border bg-card p-6 shadow-sm',
        'transition-shadow duration-200 hover:shadow-md hover:border-primary/30',
        className
      )}
    >
      <div
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">{description}</p>
    </article>
  );
}
