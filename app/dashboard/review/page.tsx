'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, XCircle, Loader2, Inbox, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getReviewQueue, reviewRow, ApiError, type ReviewQueueItem } from '@/lib/api';
import { FilterChip } from '@/components/nodelec/filter-chip';

type ReasonKey = 'digit_value_mismatch' | 'below_auto_accept_confidence' | 'description_match_not_mpn' | 'other';

const REASON_META: Record<ReasonKey, { label: string; short: string; border: string; badge: string }> = {
  digit_value_mismatch: {
    label: 'Value may differ (digits don’t match exactly)',
    short: 'Value mismatch',
    border: 'border-l-orange-500',
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  },
  below_auto_accept_confidence: {
    label: 'Below auto-accept confidence',
    short: 'Low confidence',
    border: 'border-l-yellow-500',
    badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  },
  description_match_not_mpn: {
    label: 'Matched by description, not part number',
    short: 'Description match',
    border: 'border-l-primary/60',
    badge: 'bg-primary/10 text-primary border-primary/20',
  },
  other: {
    label: 'Needs confirmation',
    short: 'Needs confirmation',
    border: 'border-l-border',
    badge: 'bg-secondary text-muted-foreground border-border',
  },
};

function reasonKey(reason: string | null): ReasonKey {
  if (reason === 'digit_value_mismatch' || reason === 'below_auto_accept_confidence' || reason === 'description_match_not_mpn') {
    return reason;
  }
  return 'other';
}

function confidenceColor(confidence: number) {
  if (confidence >= 95) return 'text-primary';
  if (confidence >= 85) return 'text-yellow-400';
  return 'text-orange-400';
}

type SortMode = 'newest' | 'confidence_asc' | 'confidence_desc';

export default function ReviewQueuePage() {
  const [items, setItems] = useState<ReviewQueueItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [bulkActing, setBulkActing] = useState(false);
  const [reasonFilter, setReasonFilter] = useState<ReasonKey | 'all'>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const data = await getReviewQueue();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the review queue.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reasonCounts = useMemo(() => {
    const counts: Record<ReasonKey, number> = {
      digit_value_mismatch: 0,
      below_auto_accept_confidence: 0,
      description_match_not_mpn: 0,
      other: 0,
    };
    for (const item of items ?? []) {
      counts[reasonKey(item.review_reason)]++;
    }
    return counts;
  }, [items]);

  const visibleItems = useMemo(() => {
    let list = items ?? [];

    if (reasonFilter !== 'all') {
      list = list.filter((item) => reasonKey(item.review_reason) === reasonFilter);
    }

    list = [...list].sort((a, b) => {
      if (sortMode === 'confidence_asc') return a.confidence - b.confidence;
      if (sortMode === 'confidence_desc') return b.confidence - a.confidence;
      return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
    });

    return list;
  }, [items, reasonFilter, sortMode]);

  function toggleSelected(rowId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelected((prev) => {
      const allVisibleSelected = visibleItems.length > 0 && visibleItems.every((item) => prev.has(item.row_id));
      if (allVisibleSelected) return new Set();
      return new Set(visibleItems.map((item) => item.row_id));
    });
  }

  async function handleAction(rowId: string, action: 'confirm' | 'reject') {
    setActingOn(rowId);
    try {
      await reviewRow(rowId, action);
      setItems((prev) => prev?.filter((item) => item.row_id !== rowId) ?? null);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(rowId);
        return next;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That action failed. Try again.');
    } finally {
      setActingOn(null);
    }
  }

  async function handleBulkAction(action: 'confirm' | 'reject') {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    setBulkActing(true);
    setError(null);

    const failed: string[] = [];

    for (const rowId of ids) {
      try {
        await reviewRow(rowId, action);
      } catch {
        failed.push(rowId);
      }
    }

    setItems((prev) => prev?.filter((item) => failed.includes(item.row_id) || !ids.includes(item.row_id)) ?? null);
    setSelected(new Set());
    setBulkActing(false);

    if (failed.length > 0) {
      setError(`${failed.length} of ${ids.length} action${ids.length > 1 ? 's' : ''} failed. The rest went through.`);
    }
  }

  const allVisibleSelected = visibleItems.length > 0 && visibleItems.every((item) => selected.has(item.row_id));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review Queue</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Matches the system isn&apos;t confident enough to accept on its own. Confirm the ones that look
          right &mdash; it&apos;ll remember them next time. Reject the ones that don&apos;t.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {items === null && !error && (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading queue...
        </div>
      )}

      {items !== null && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Inbox className="w-6 h-6 text-primary" />
          </div>
          <p className="font-medium">Queue is clear</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Every uncertain match has been confirmed or rejected. New uploads that need a second look will
            show up here.
          </p>
        </div>
      )}

      {items !== null && items.length > 0 && (
        <>
          {/* Filter chips + sort */}
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip
              active={reasonFilter === 'all'}
              onClick={() => setReasonFilter('all')}
              label={`All`}
              count={items.length}
            />
            {(Object.keys(REASON_META) as ReasonKey[]).map((key) =>
              reasonCounts[key] > 0 ? (
                <FilterChip
                  key={key}
                  active={reasonFilter === key}
                  onClick={() => setReasonFilter(key)}
                  label={REASON_META[key].short}
                  count={reasonCounts[key]}
                />
              ) : null
            )}

            <div className="ml-auto flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
              <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                <SelectTrigger size="sm" className="w-[168px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="confidence_desc">Highest confidence</SelectItem>
                  <SelectItem value="confidence_asc">Lowest confidence</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Select-all + bulk action bar */}
          <div className="flex items-center gap-3 -mb-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
              <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAllVisible} />
              {selected.size > 0 ? `${selected.size} selected` : `Select all ${visibleItems.length}`}
            </label>

            {selected.size > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={bulkActing}
                  onClick={() => handleBulkAction('reject')}
                >
                  {bulkActing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <XCircle className="w-4 h-4 mr-1.5" />}
                  Reject {selected.size}
                </Button>
                <Button size="sm" disabled={bulkActing} onClick={() => handleBulkAction('confirm')}>
                  {bulkActing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
                  Confirm {selected.size}
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {visibleItems.map((item) => {
              const meta = REASON_META[reasonKey(item.review_reason)];
              const isSelected = selected.has(item.row_id);

              return (
                <Card key={item.row_id} className={`border-border/50 border-l-4 ${meta.border} py-0`}>
                  <CardContent className="flex items-start sm:items-center gap-4 py-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelected(item.row_id)}
                      className="mt-1 sm:mt-0 shrink-0"
                    />

                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <Badge variant="outline" className={`text-[11px] ${meta.badge}`}>
                            {meta.short}
                          </Badge>
                          <Badge variant="outline" className="font-mono text-[11px]">
                            qty {item.quantity}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {item.submitted_by} &middot; {new Date(item.uploaded_at).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="font-mono text-xs text-muted-foreground truncate" title={item.input}>
                          {item.input}
                        </p>

                        <div className="flex items-baseline gap-2 mt-1.5">
                          <span className="text-sm text-muted-foreground">suggests</span>
                          <span className="font-mono font-semibold text-base">{item.suggested_mpn ?? '—'}</span>
                          <span className={`font-mono text-sm font-bold tabular-nums ${confidenceColor(item.confidence)}`}>
                            {item.confidence}%
                          </span>
                        </div>

                        {item.line_total !== null && (
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {item.currency} {item.unit_price} &times; {item.quantity} ={' '}
                            <span className="text-foreground font-medium">
                              {item.currency} {item.line_total}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={actingOn === item.row_id || bulkActing}
                          onClick={() => handleAction(item.row_id, 'reject')}
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={actingOn === item.row_id || bulkActing}
                          onClick={() => handleAction(item.row_id, 'confirm')}
                        >
                          {actingOn === item.row_id ? (
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          )}
                          Confirm
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {visibleItems.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-12">No rows match this filter.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
