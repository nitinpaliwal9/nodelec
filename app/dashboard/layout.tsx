'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileStack, LogOut, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStoredApiKey, clearStoredApiKey } from '@/lib/api';

const NAV_LINKS = [
  { name: 'Review Queue', href: '/dashboard/review', icon: LayoutDashboard },
  { name: 'Files', href: '/dashboard/files', icon: FileStack },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const isLoginPage = pathname === '/dashboard/login';
    const hasKey = !!getStoredApiKey();

    if (!hasKey && !isLoginPage) {
      router.replace('/dashboard/login');
      return;
    }

    setChecked(true);
  }, [pathname, router]);

  if (pathname === '/dashboard/login') {
    return <>{children}</>;
  }

  if (!checked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50 bg-card/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard/review" className="flex items-center gap-2 font-bold text-lg">
              <Zap className="w-5 h-5 text-primary" />
              Nodelec
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const active = pathname?.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              clearStoredApiKey();
              router.replace('/dashboard/login');
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
