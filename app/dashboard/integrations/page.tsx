'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Plug,
  Copy,
  Check,
  MessageCircle,
  Mail,
  Database,
  Download,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  ApiError,
  getWhatsAppIntegration,
  saveWhatsAppIntegration,
  type WhatsAppIntegration,
  getEmailIntegration,
  mockConnectEmailOAuth,
  saveEmailImap,
  type EmailIntegration,
  getErpIntegration,
  saveErpIntegration,
  generateTallyAgentKey,
  type ErpIntegration,
  type ErpPlatform,
} from '@/lib/api';

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
    >
      {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      {message}
    </div>
  );
}

// -----------------------------------------------------------------
// WhatsApp Business API Setup
// -----------------------------------------------------------------

function WhatsAppCard() {
  const [config, setConfig] = useState<WhatsAppIntegration | null>(null);
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [businessAccountId, setBusinessAccountId] = useState('');
  const [systemToken, setSystemToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getWhatsAppIntegration();
      setConfig(data);
      setPhoneNumberId(data.phone_number_id ?? '');
      setBusinessAccountId(data.business_account_id ?? '');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load WhatsApp settings.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setError(null);
    if (!phoneNumberId.trim() || !businessAccountId.trim() || !systemToken.trim()) {
      setError('Phone number ID, business account ID, and system token are all required.');
      return;
    }
    setIsSaving(true);
    try {
      const updated = await saveWhatsAppIntegration({
        phone_number_id: phoneNumberId.trim(),
        business_account_id: businessAccountId.trim(),
        system_token: systemToken.trim(),
      });
      setConfig(updated);
      setSystemToken('');
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save WhatsApp settings.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <CardTitle className="text-base">WhatsApp Business API Setup</CardTitle>
        </div>
        <CardDescription>
          Connect your WhatsApp Business Cloud API credentials so RFQs sent to your business number can be picked up.
          Nothing sends or receives WhatsApp messages yet &mdash; this saves your credentials for that integration.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}
        {config === null && !error ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading...
          </div>
        ) : (
          <>
            {config?.connected && (
              <div className="flex items-center gap-1.5 text-sm text-primary">
                <CheckCircle2 className="w-4 h-4" />
                Credentials saved
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wa-phone-id">WHATSAPP_PHONE_NUMBER_ID</Label>
              <Input
                id="wa-phone-id"
                placeholder="e.g. 109876543212345"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wa-baid">WHATSAPP_BUSINESS_ACCOUNT_ID</Label>
              <Input
                id="wa-baid"
                placeholder="e.g. 987654321098765"
                value={businessAccountId}
                onChange={(e) => setBusinessAccountId(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wa-token">META_DEVELOPER_SYSTEM_TOKEN</Label>
              <Input
                id="wa-token"
                type="password"
                placeholder={config?.connected ? 'Re-enter to update (never shown once saved)' : 'System user access token'}
                value={systemToken}
                onChange={(e) => setSystemToken(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              <Label>Incoming webhook URL</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={config?.webhook_url ?? 'https://nodelec.in'} className="font-mono text-sm" />
                <CopyButton value={config?.webhook_url ?? 'https://nodelec.in'} />
              </div>
              <p className="text-xs text-muted-foreground">
                Paste this into Meta&apos;s App Dashboard under WhatsApp &gt; Configuration &gt; Webhook.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save WhatsApp credentials'
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
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------
// Email Ingestion
// -----------------------------------------------------------------

function EmailCard() {
  const [config, setConfig] = useState<EmailIntegration | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<'google' | 'outlook' | null>(null);
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState('993');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [folder, setFolder] = useState('INBOX');
  const [error, setError] = useState<string | null>(null);
  const [isSavingImap, setIsSavingImap] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getEmailIntegration();
      setConfig(data);
      if (data.imap.connected) {
        setImapHost(data.imap.imap_host ?? '');
        setImapPort(String(data.imap.imap_port ?? 993));
        setUsername(data.imap.username ?? '');
        setFolder(data.imap.folder ?? 'INBOX');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load email settings.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMockConnect(provider: 'google' | 'outlook') {
    setError(null);
    setConnectingProvider(provider);
    try {
      const updated = await mockConnectEmailOAuth(provider);
      setConfig(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not connect.');
    } finally {
      setConnectingProvider(null);
    }
  }

  async function handleSaveImap() {
    setError(null);
    if (!imapHost.trim() || !username.trim() || !password) {
      setError('IMAP host, username, and password are required.');
      return;
    }
    setIsSavingImap(true);
    try {
      const updated = await saveEmailImap({
        imap_host: imapHost.trim(),
        imap_port: Number(imapPort) || 993,
        username: username.trim(),
        password,
        folder: folder.trim() || 'INBOX',
      });
      setConfig(updated);
      setPassword('');
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save IMAP settings.');
    } finally {
      setIsSavingImap(false);
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <CardTitle className="text-base">Email Ingestion (Google Workspace / Outlook)</CardTitle>
        </div>
        <CardDescription>
          Have BOMs sent to your business inbox picked up automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {error && <ErrorBanner message={error} />}
        {config === null && !error ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading...
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleMockConnect('google')}
                  disabled={connectingProvider !== null}
                >
                  {connectingProvider === 'google' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Connect Business Google Account
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleMockConnect('outlook')}
                  disabled={connectingProvider !== null}
                >
                  {connectingProvider === 'outlook' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Connect Outlook Account
                </Button>
                {config?.oauth.connected && (
                  <span className="flex items-center gap-1.5 text-sm text-primary">
                    <CheckCircle2 className="w-4 h-4" />
                    {config.oauth.provider === 'google' ? 'Google' : 'Outlook'} connected
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Demo flow &mdash; this button doesn&apos;t perform a real Google/Microsoft OAuth handshake yet
                (that needs a verified OAuth consent screen). Nothing is polled from this connection until it's real.
                Use IMAP below for an inbox that actually gets polled today.
              </p>
            </div>

            <div className="h-px bg-border/50" />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">IMAP / SMTP fallback (real, polled)</p>
                {config?.imap.connected && (
                  <span className="flex items-center gap-1.5 text-sm text-primary">
                    <CheckCircle2 className="w-4 h-4" />
                    Connected
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="imap-host">IMAP host</Label>
                  <Input id="imap-host" placeholder="imap.gmail.com" value={imapHost} onChange={(e) => setImapHost(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="imap-port">Port</Label>
                  <Input id="imap-port" type="number" value={imapPort} onChange={(e) => setImapPort(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="imap-user">Username</Label>
                  <Input id="imap-user" placeholder="rfq@yourcompany.com" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="imap-folder">Folder</Label>
                  <Input id="imap-folder" value={folder} onChange={(e) => setFolder(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <Label htmlFor="imap-pass">Password</Label>
                  <Input
                    id="imap-pass"
                    type="password"
                    placeholder={config?.imap.connected ? 'Re-enter to update (never shown once saved)' : 'App password / mailbox password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleSaveImap} disabled={isSavingImap} variant="secondary">
                  {isSavingImap ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save IMAP credentials'
                  )}
                </Button>
                {savedAt && (
                  <span className="flex items-center gap-1.5 text-sm text-primary">
                    <CheckCircle2 className="w-4 h-4" />
                    Saved
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------
// ERP & Inventory Synchronization
// -----------------------------------------------------------------

const PLATFORM_LABELS: Record<ErpPlatform, string> = {
  tally: 'Tally ERP 9 / TallyPrime',
  sap_b1: 'SAP Business One',
  custom_cloud_api: 'Custom Cloud API',
};

function ErpCard() {
  const [config, setConfig] = useState<ErpIntegration | null>(null);
  const [platform, setPlatform] = useState<ErpPlatform>('tally');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('9000');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [newAgentKey, setNewAgentKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getErpIntegration();
      setConfig(data);
      if (data.platform) {
        setPlatform(data.platform);
        setHost(data.host ?? '');
        setPort(String(data.port ?? 9000));
        setCompanyName(data.company_name ?? '');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load ERP settings.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setError(null);
    if (platform === 'tally' && (!host.trim() || !companyName.trim())) {
      setError('Tally host and company name are required.');
      return;
    }
    setIsSaving(true);
    try {
      const updated = await saveErpIntegration({
        platform,
        host: platform === 'tally' ? host.trim() : undefined,
        port: platform === 'tally' ? Number(port) || 9000 : undefined,
        company_name: platform === 'tally' ? companyName.trim() : undefined,
      });
      setConfig(updated);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save ERP settings.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerateKey() {
    setError(null);
    setIsGeneratingKey(true);
    try {
      const result = await generateTallyAgentKey();
      setNewAgentKey(result.agent_key);
      const updated = await getErpIntegration();
      setConfig(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not generate agent key.');
    } finally {
      setIsGeneratingKey(false);
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <CardTitle className="text-base">ERP &amp; Inventory Synchronization</CardTitle>
        </div>
        <CardDescription>
          Keep your quoted prices and stock levels current from your own inventory system.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}
        {config === null && !error ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading...
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as ErpPlatform)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PLATFORM_LABELS) as ErpPlatform[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PLATFORM_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {platform === 'tally' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="erp-host">Tally host</Label>
                    <Input id="erp-host" placeholder="192.168.1.50 or localhost" value={host} onChange={(e) => setHost(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="erp-port">Port</Label>
                    <Input id="erp-port" type="number" value={port} onChange={(e) => setPort(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <Label htmlFor="erp-company">Company name (exactly as in Tally)</Label>
                    <Input id="erp-company" placeholder="Formax Electronics" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save Tally connection
                  </Button>
                  {savedAt && (
                    <span className="flex items-center gap-1.5 text-sm text-primary">
                      <CheckCircle2 className="w-4 h-4" />
                      Saved
                    </span>
                  )}
                </div>

                {config?.configured && config.platform === 'tally' && (
                  <div className="rounded-lg border border-border/50 bg-secondary/30 p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium">Nodelec Tally Agent</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Our servers usually can&apos;t reach into your local network to read Tally directly. The
                      agent runs on your machine instead, reads Tally locally, and pushes your stock items to
                      Nodelec securely using the key below.
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      <a href="/downloads/nodelec_tally_agent.py" download>
                        <Button type="button" variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1.5" />
                          Download Nodelec Tally Agent (Python script)
                        </Button>
                      </a>
                      <Button type="button" size="sm" onClick={handleGenerateKey} disabled={isGeneratingKey}>
                        {isGeneratingKey ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
                        {config.has_agent_key ? 'Regenerate TALLY_AGENT_KEY' : 'Generate TALLY_AGENT_KEY'}
                      </Button>
                    </div>

                    {newAgentKey && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <Input readOnly value={newAgentKey} className="font-mono text-xs" />
                          <CopyButton value={newAgentKey} />
                        </div>
                        <p className="text-xs text-destructive">
                          Shown once &mdash; store it now. Pass it to the agent script as --agent-key or
                          NODELEC_TALLY_AGENT_KEY.
                        </p>
                      </div>
                    )}

                    {!newAgentKey && config.has_agent_key && (
                      <p className="text-xs text-muted-foreground">
                        A key was already generated for this connection. Regenerate if it&apos;s been lost.
                      </p>
                    )}

                    {config.last_synced_at && (
                      <p className="text-xs text-muted-foreground">
                        Last synced {new Date(config.last_synced_at).toLocaleString()} &mdash; {config.last_sync_status}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-border/50 p-4 text-sm text-muted-foreground">
                {PLATFORM_LABELS[platform]} isn&apos;t wired up yet &mdash; there&apos;s no live connector for it. Saving
                your choice here just records the intent so we know to prioritize it.
                <div className="mt-3">
                  <Button onClick={handleSave} disabled={isSaving} size="sm" variant="outline">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save platform choice
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Plug className="w-5 h-5 text-primary" />
          Integrations
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Connect the channels BOMs and inventory flow through. Each section saves independently.
        </p>
      </div>

      <WhatsAppCard />
      <EmailCard />
      <ErpCard />
    </div>
  );
}
