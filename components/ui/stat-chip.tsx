import { cn } from '@/lib/utils';

type StatChipProps = {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  className?: string;
};

export function StatChip({ icon: Icon, value, label, className }: StatChipProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm min-h-[44px]',
        className
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="text-left">
        <div className="text-sm font-semibold text-foreground tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
