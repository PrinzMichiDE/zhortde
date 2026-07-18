import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12 space-y-4">
        <Skeleton className="h-8 w-48 mx-auto rounded-full" />
        <Skeleton className="h-16 w-full max-w-2xl mx-auto" />
        <Skeleton className="h-6 w-full max-w-xl mx-auto" />
      </div>
      <Skeleton className="h-64 w-full max-w-3xl mx-auto rounded-3xl" />
    </div>
  );
}
