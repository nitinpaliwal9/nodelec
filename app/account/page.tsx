'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, User as UserIcon, Building2, Mail, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getMyProfile, logoutUser, getStoredSessionToken, ApiError, type UserProfile } from '@/lib/api';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!getStoredSessionToken()) {
      router.replace('/login');
      return;
    }

    try {
      const profile = await getMyProfile();
      setUser(profile);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace('/login');
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Could not load your account.');
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSignOut() {
    await logoutUser();
    router.replace('/login');
  }

  if (error) {
    return (
      <div className="bg-background text-foreground min-h-screen pt-28 px-4 flex items-start justify-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-background text-foreground min-h-screen pt-28 px-4 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen pt-28 md:pt-36 pb-20 px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 blur-[80px] md:blur-[120px] rounded-full" />

      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Your account</h1>
            <p className="text-muted-foreground text-sm mt-1">Welcome back, {user.full_name.split(' ')[0]}.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </Button>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm">
              <UserIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              {user.full_name}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              {user.company_name}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              {user.email}
            </div>
          </CardContent>
        </Card>

        {user.has_dashboard_access ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Dashboard access</CardTitle>
              <CardDescription>Your organization is set up and ready.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/login">
                <Button>
                  Go to dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 border-dashed">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Dashboard access not set up yet</CardTitle>
              </div>
              <CardDescription>
                Your account is registered, but there&apos;s no organization or API key attached to it yet
                &mdash; that gets provisioned once you&apos;re on a paid plan. Reach out and we&apos;ll get
                you set up.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/contact">
                <Button variant="outline">
                  Talk to us
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
