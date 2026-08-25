'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Loader2, Inbox, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getReviewQueue, reviewRow, ApiError, type ReviewQueueItem } from '@/lib/api';

function confidenceColor(confidence: number) {
  if (confidence >= 95) return 'text-primary';
  if (confidence >= 85) return 'text-yellow-400';
  return 'text-orange-400';
}

function reviewReasonLabel(reason: string | null) {
  switch (reason) {
    case 'digit_value_mismatch':
      return 'Value may differ (digits don’t match exactly)';
    case 'below_auto_accept_confidence':
      return 'Below auto-accept confidence';
    case 'description_match_not_mpn':
      return 'Matched by description, not part number';
    default:
      return 'Needs confirmation';
  }
}

export default function ReviewQueuePage() {
  const [items, setItems] = useState<ReviewQueueItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

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

  async function handleAction(rowId: string, action: 'confirm' | 'reject') {
    setActingOn(rowId);
    try {
      await reviewRow(rowId, action);
      setItems((prev) => prev?.filter((item) => item.row_id !== rowId) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That action failed. Try again.');
    } finally {
      setActingOn(null);
    }
  }

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

      <div className="flex flex-col gap-3">
        {items?.map((item) => (
          <Card key={item.row_id} className="border-border/50">
            <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <Badge variant="outline" className="font-mono text-[11px]">
                    qty {item.quantity}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {item.submitted_by} &middot; {new Date(item.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-mono text-sm truncate" title={item.input}>
                  {item.input}
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <span className="text-muted-foreground">suggests</span>
                  <span className="font-mono font-medium">{item.suggested_mpn ?? '—'}</span>
                  <span className={`font-mono text-xs font-semibold ${confidenceColor(item.confidence)}`}>
                    {item.confidence}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{reviewReasonLabel(item.review_reason)}</p>
                {item.line_total !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
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
                  disabled={actingOn === item.row_id}
                  onClick={() => handleAction(item.row_id, 'reject')}
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  disabled={actingOn === item.row_id}
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
