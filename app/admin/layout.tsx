import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { isSuperAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users and system settings</p>
          </div>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
