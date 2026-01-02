import type { Metadata } from 'next';
import { DashboardSidebar } from '@/components/dashboard/sidebar';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardSidebar />
      <main className="flex-1 overflow-x-hidden lg:ml-0 pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}

