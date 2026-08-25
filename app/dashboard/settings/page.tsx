'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, AlertTriangle, CheckCircle2, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getOrganizationRules, updateOrganizationRules, ApiError, type OrganizationRules } from '@/lib/api';

export default function SettingsPage() {
  const [rules, setRules] = useState<OrganizationRules | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getOrganizationRules();
      setRules(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load settings.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    if (!rules) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateOrganizationRules({
        quote_validity_hours: rules.quote_validity_hours,
        default_margin_percent: rules.default_margin_percent,
        moq_enforcement_enabled: rules.moq_enforcement_enabled,
      });
      setRules(updated);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save settings.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Operational defaults applied to every BOM your organization processes. Change these anytime.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {rules === null && !error && (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading settings...
        </div>
      )}

      {rules !== null && (
        <>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Quote validity</CardTitle>
              <CardDescription>How long a completed quote&apos;s prices and matches should be treated as current.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Slider
                min={1}
                max={168}
                step={1}
                value={[rules.quote_validity_hours]}
                onValueChange={([v]) => setRules({ ...rules, quote_validity_hours: v })}
                className="flex-1"
              />
              <span className="font-mono text-sm w-20 text-right tabular-nums">
                {rules.quote_validity_hours} {rules.quote_validity_hours === 1 ? 'hour' : 'hours'}
              </span>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Default margin</CardTitle>
              <CardDescription>
                Reserved for when a customer has no specific price tier &mdash; not applied to quotes yet, since that needs a
                customer price-tier system that doesn&apos;t exist yet. Safe to set now.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Slider
                min={0}
                max={100}
                step={0.5}
                value={[rules.default_margin_percent]}
                onValueChange={([v]) => setRules({ ...rules, default_margin_percent: v })}
                className="flex-1"
              />
              <span className="font-mono text-sm w-20 text-right tabular-nums">
                {rules.default_margin_percent}%
              </span>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">MOQ enforcement</CardTitle>
              <CardDescription>
                Round requested quantities up to a component&apos;s minimum order / reel size when it&apos;s known. A
                component with no MOQ on file is left untouched.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-sm">Round up to full factory reel sizes</span>
              <Switch
                checked={rules.moq_enforcement_enabled}
                onCheckedChange={(checked) => setRules({ ...rules, moq_enforcement_enabled: checked })}
              />
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save changes'
              )}
            </Button>
            {savedAt && (
              <span className="flex items-center gap-1.5 text-sm text-primary">
                <CheckCircle2 className="w-4 h-4" />
                Saved
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
