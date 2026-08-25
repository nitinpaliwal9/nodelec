'use client';

import { useEffect, useState, useCallback, useMemo, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle2, XCircle, Search, PackagePlus, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { FilterChip } from '@/components/nodelec/filter-chip';
import { getFileStatus, reviewRow, ApiError, type FileStatus, type MatchRow } from '@/lib/api';

const MATCH_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  exact: 'default',
  fuzzy: 'secondary',
  review: 'outline',
  unmatched: 'destructive',
};

const MATCH_TYPE_ORDER = ['exact', 'fuzzy', 'review', 'unmatched'];

export default function FileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<FileStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | 'all'>('all');
  const [search, setSearch] = useState('');

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

  async function handleReview(rowId: string, action: 'confirm' | 'reject') {
    setActingOn(rowId);
    try {
      const result = await reviewRow(rowId, action);
      setData((prev) =>
        prev
          ? {
              ...prev,
              matches: prev.matches.map((m) =>
                m.row_id === rowId ? { ...m, review_action: result.review_action } : m
              ),
            }
          : prev
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That action failed. Try again.');
    } finally {
      setActingOn(null);
    }
  }

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of data?.matches ?? []) {
      counts[m.match_type] = (counts[m.match_type] ?? 0) + 1;
    }
    return counts;
  }, [data]);

  const visibleMatches = useMemo(() => {
    let list = data?.matches ?? [];

    if (typeFilter !== 'all') {
      list = list.filter((m) => m.match_type === typeFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) => m.input.toLowerCase().includes(q) || (m.matched_mpn ?? '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [data, typeFilter, search]);

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
                {data.quote_expires_at && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3" />
                    Valid until {new Date(data.quote_expires_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Stat label="Rows" value={data.summary.rows_processed} onClick={() => setTypeFilter('all')} />
            <Stat label="Exact" value={data.summary.exact_matches} tone="good" onClick={() => setTypeFilter('exact')} />
            <Stat label="Fuzzy" value={data.summary.fuzzy_matches} onClick={() => setTypeFilter('fuzzy')} />
            <Stat
              label="Needs review"
              value={data.summary.needs_review}
              tone="warn"
              onClick={() => setTypeFilter('review')}
            />
            <Stat
              label="Unmatched"
              value={data.summary.unmatched}
              tone="bad"
              onClick={() => setTypeFilter('unmatched')}
            />
          </div>

          {data.processing_errors.length > 0 && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-base text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Processing errors ({data.processing_errors.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {data.processing_errors.map((e, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-muted-foreground font-mono text-xs uppercase mr-2">{e.stage}</span>
                    {e.error}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {data.unmatched_parts.length > 0 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PackagePlus className="w-4 h-4 text-muted-foreground" />
                  Unmatched parts ({data.unmatched_parts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {data.unmatched_parts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm border-t border-border/50 first:border-t-0 pt-2 first:pt-0">
                    <span className="font-mono text-xs truncate">{p.part}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-muted-foreground text-xs">{p.reason ?? 'No matching component found'}</span>
                      <span className="tabular-nums text-xs">qty {p.quantity}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {data.matches.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <FilterChip active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} label="All" count={data.matches.length} />
                {MATCH_TYPE_ORDER.filter((t) => typeCounts[t] > 0).map((t) => (
                  <FilterChip
                    key={t}
                    active={typeFilter === t}
                    onClick={() => setTypeFilter(t)}
                    label={t.charAt(0).toUpperCase() + t.slice(1)}
                    count={typeCounts[t]}
                  />
                ))}

                <div className="relative ml-auto w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search input or matched MPN..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              </div>

              <Card className="border-border/50">
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
                        <TableHead className="w-[180px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleMatches.map((m) => (
                        <MatchRowLine key={m.row_id} m={m} actingOn={actingOn} onReview={handleReview} />
                      ))}

                      {visibleMatches.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                            No rows match this filter.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}

function MatchRowLine({
  m,
  actingOn,
  onReview,
}: {
  m: MatchRow;
  actingOn: string | null;
  onReview: (rowId: string, action: 'confirm' | 'reject') => void;
}) {
  const needsAction = m.match_type === 'review' && !m.review_action;
  const isActing = actingOn === m.row_id;

  return (
    <TableRow>
      <TableCell className="font-mono text-xs max-w-[220px] truncate">{m.input}</TableCell>
      <TableCell className="font-mono text-xs">{m.matched_mpn ?? '—'}</TableCell>
      <TableCell className="tabular-nums text-xs">{m.confidence}%</TableCell>
      <TableCell>
        <Badge variant={MATCH_VARIANT[m.match_type] ?? 'outline'} className="capitalize">
          {m.match_type}
        </Badge>
        {m.review_action && (
          <span className="text-[11px] text-muted-foreground ml-1.5 capitalize">({m.review_action})</span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {m.quantity}
        {m.moq_rounded && (
          <span
            className="ml-1.5 text-[10px] text-primary font-medium align-middle"
            title={`Rounded up to ${m.quoted_quantity} for MOQ`}
          >
            &rarr;{m.quoted_quantity}
          </span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {m.line_total !== null ? `${m.currency} ${m.line_total.toLocaleString()}` : '—'}
      </TableCell>
      <TableCell>
        {needsAction && (
          <div className="flex items-center gap-1.5 justify-end">
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isActing}
              onClick={() => onReview(m.row_id, 'reject')}
            >
              <XCircle className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" className="h-7 px-2" disabled={isActing} onClick={() => onReview(m.row_id, 'confirm')}>
              {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
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
  onClick,
}: {
  label: string;
  value: number;
  tone?: 'good' | 'warn' | 'bad';
  onClick?: () => void;
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
    <Card
      className={`border-border/50 ${onClick ? 'cursor-pointer hover:border-border-strong transition-colors' : ''}`}
      onClick={onClick}
    >
      <CardContent className="py-3">
        <p className={`text-2xl font-bold tabular-nums ${toneClass}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
