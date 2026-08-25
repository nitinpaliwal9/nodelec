// lib/supabase.ts
//
// Lazy Supabase client for the marketing site's lead-capture forms
// (contact page, pilot-request footer). Created on first use, not at
// module load -- createClient() throws synchronously when the URL is
// missing, and both callers used to create their client at module
// scope inside components rendered site-wide (ContactFooter is in
// the root layout), which meant a missing
// NEXT_PUBLIC_SUPABASE_URL/ANON_KEY crashed the prerender of every
// page on the site, not just the ones that actually submit a form.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  client = url && anonKey ? createClient(url, anonKey) : null;

  return client;
}
