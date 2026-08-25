'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Loader2,
  AlertTriangle,
  FileStack,
  ListChecks,
  DollarSign,
  Upload,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOrganizationSummary, ApiError, type OrganizationSummary } from '@/lib/api';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  processing: 'secondary',
  pending: 'secondary',
  failed: 'destructive',
};

export default function DashboardHomePage() {
  const [summary, setSummary] = useState<OrganizationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getOrganizationSummary();
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your dashboard.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">What&apos;s happening across your organization.</p>
        </div>
        <Link href="/dashboard/files">
          <Button size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload BOM
          </Button>
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {summary === null && !error && (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading...
        </div>
      )}

      {summary !== null && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={FileStack}
              label="Total files"
              value={summary.total_files}
              href="/dashboard/files"
            />
            <StatCard
              icon={ListChecks}
              label="Needs review"
              value={summary.review_queue_count}
              href="/dashboard/review"
              tone={summary.review_queue_count > 0 ? 'warn' : undefined}
            />
            <StatCard
              icon={AlertTriangle}
              label="Failed"
              value={summary.files_by_status.failed ?? 0}
              href="/dashboard/files"
              tone={(summary.files_by_status.failed ?? 0) > 0 ? 'bad' : undefined}
            />
            <StatCard
              icon={DollarSign}
              label="Open quote value"
              value={
                summary.total_quote_value !== null
                  ? `${summary.currency ?? ''} ${summary.total_quote_value.toLocaleString()}`
                  : '—'
              }
              href="/dashboard/files"
            />
          </div>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent files</CardTitle>
              <Link
                href="/dashboard/files"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                View all
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {summary.recent_files.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No files yet &mdash; upload your first BOM to get started.
                </p>
              ) : (
                summary.recent_files.map((f) => (
                  <Link
                    key={f.file_id}
                    href={`/dashboard/files/${f.file_id}`}
                    className="flex items-center justify-between gap-4 py-2.5 px-2 -mx-2 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant={STATUS_VARIANT[f.status] ?? 'outline'} className="capitalize shrink-0">
                        {f.status}
                      </Badge>
                      <span className="text-sm truncate">{f.distributor}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(f.created_at).toLocaleString()}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  href: string;
  tone?: 'warn' | 'bad';
}) {
  const valueClass = tone === 'warn' ? 'text-yellow-400' : tone === 'bad' ? 'text-destructive' : 'text-foreground';

  return (
    <Link href={href}>
      <Card className="border-border/50 hover:border-border-strong transition-colors h-full">
        <CardContent className="py-4 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icon className="w-3.5 h-3.5" />
            <span className="text-xs">{label}</span>
          </div>
          <p className={`text-2xl font-bold tabular-nums ${valueClass}`}>{value}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
