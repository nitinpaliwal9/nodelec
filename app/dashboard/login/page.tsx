'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { setStoredApiKey, verifyApiKey } from '@/lib/api';

export default function DashboardLoginPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!apiKey.trim()) return;

    setIsChecking(true);
    setError(null);

    setStoredApiKey(apiKey.trim());

    const valid = await verifyApiKey();

    if (!valid) {
      setError('That key was rejected. Double-check it and try again.');
      setIsChecking(false);
      return;
    }

    router.replace('/dashboard/review');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-xl">Sign in to Nodelec</CardTitle>
          <CardDescription>Enter your organization&apos;s API key</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="nk_live_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pl-9 font-mono text-sm"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isChecking || !apiKey.trim()} className="w-full">
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Don&apos;t have a key? Ask whoever set up your organization to run{' '}
            <code className="text-[11px] bg-secondary px-1 py-0.5 rounded">manage_api_keys.py issue-key</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
