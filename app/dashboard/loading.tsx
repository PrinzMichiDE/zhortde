import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-12 space-y-3">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-6 w-96 max-w-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>

      <div className="space-y-8">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
