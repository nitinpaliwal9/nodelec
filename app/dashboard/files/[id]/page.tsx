'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { getFileStatus, ApiError, type FileStatus } from '@/lib/api';

const MATCH_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  exact: 'default',
  fuzzy: 'secondary',
  review: 'outline',
  unmatched: 'destructive',
};

export default function FileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<FileStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await getFileStatus(id);
      setData(result);
      setError(null);

      if (result.status === 'pending' || result.status === 'processing') {
        setTimeout(load, 2000);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load this file.');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/files"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to files
      </Link>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {!data && !error && (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading...
        </div>
      )}

      {data && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={STATUS_VARIANT(data.status)} className="capitalize">
                  {data.status}
                </Badge>
                <span className="text-sm text-muted-foreground">submitted by {data.distributor}</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight font-mono">{id.slice(0, 8)}</h1>
            </div>
            {data.summary.total_quote_value !== null && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Quote total</p>
                <p className="text-2xl font-bold tabular-nums">
                  {data.summary.currency} {data.summary.total_quote_value.toLocaleString()}
                </p>
                {data.summary.rows_missing_price > 0 && (
                  <p className="text-xs text-orange-400">
                    {data.summary.rows_missing_price} row{data.summary.rows_missing_price > 1 ? 's' : ''} not
                    priced yet
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Stat label="Rows" value={data.summary.rows_processed} />
            <Stat label="Exact" value={data.summary.exact_matches} tone="good" />
            <Stat label="Fuzzy" value={data.summary.fuzzy_matches} />
            <Stat label="Needs review" value={data.summary.needs_review} tone="warn" />
            <Stat label="Unmatched" value={data.summary.unmatched} tone="bad" />
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Matched rows</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Input</TableHead>
                    <TableHead>Matched</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Line total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.matches.map((m) => (
                    <TableRow key={m.row}>
                      <TableCell className="font-mono text-xs max-w-[240px] truncate">{m.input}</TableCell>
                      <TableCell className="font-mono text-xs">{m.matched_mpn ?? '—'}</TableCell>
                      <TableCell className="tabular-nums text-xs">{m.confidence}%</TableCell>
                      <TableCell>
                        <Badge variant={MATCH_VARIANT[m.match_type] ?? 'outline'} className="capitalize">
                          {m.match_type}
                        </Badge>
                        {m.review_action && (
                          <span className="text-[11px] text-muted-foreground ml-1.5 capitalize">
                            ({m.review_action})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{m.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {m.line_total !== null ? `${m.currency} ${m.line_total.toLocaleString()}` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function STATUS_VARIANT(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'completed') return 'default';
  if (status === 'failed') return 'destructive';
  return 'secondary';
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'good' | 'warn' | 'bad';
}) {
  const toneClass =
    tone === 'good'
      ? 'text-primary'
      : tone === 'warn'
        ? 'text-yellow-400'
        : tone === 'bad'
          ? 'text-destructive'
          : 'text-foreground';

  return (
    <Card className="border-border/50">
      <CardContent className="py-3">
        <p className={`text-2xl font-bold tabular-nums ${toneClass}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
