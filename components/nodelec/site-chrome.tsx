'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/nodelec/header';
import { ContactFooter } from '@/components/nodelec/contact-footer';

/**
 * The dashboard is a separate product experience from the marketing
 * site, not another marketing page -- it shouldn't carry the
 * marketing nav/footer. Keeping this as a pathname check in one place
 * (rather than restructuring routes into parallel root layouts) keeps
 * the existing marketing routes untouched.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      {children}
      <ContactFooter />
    </>
  );
}
