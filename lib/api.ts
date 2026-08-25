// lib/api.ts
//
// Thin client for the Nodelec backend API. Auth is a bearer API key
// (see backend/auth.py) stored in localStorage -- there's no human
// login/session system yet, so this is deliberately the simplest
// thing that works: paste the key issued by
// `python manage_api_keys.py issue-key`, it's attached to every
// request from here on.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const STORAGE_KEY = 'nodelec_api_key';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getStoredApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setStoredApiKey(key: string) {
  window.localStorage.setItem(STORAGE_KEY, key);
}

export function clearStoredApiKey() {
  window.localStorage.removeItem(STORAGE_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getStoredApiKey();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // response wasn't JSON -- keep statusText
    }
    throw new ApiError(response.status, detail);
  }

  return response.json();
}

// ---------------------------------------------------------------
// Types (mirror backend/main.py's response shapes)
// ---------------------------------------------------------------

export interface ReviewQueueItem {
  row_id: string;
  file_id: string;
  submitted_by: string;
  uploaded_at: string;
  input: string;
  quantity: number;
  suggested_mpn: string | null;
  confidence: number;
  review_reason: string | null;
  unit_price: number | null;
  line_total: number | null;
  currency: string | null;
}

export interface FileSummary {
  file_id: string;
  status: string;
  distributor: string;
  created_at: string;
}

export interface MatchRow {
  row: number;
  input: string;
  matched_mpn: string | null;
  confidence: number;
  match_type: string;
  quantity: number;
  quoted_quantity: number | null;
  moq_rounded: boolean;
  unit_price: number | null;
  line_total: number | null;
  currency: string | null;
  review_action: string | null;
  row_id: string;
}

export interface FileStatus {
  file_id: string;
  status: string;
  distributor: string;
  quote_expires_at: string | null;
  summary: {
    rows_processed: number;
    exact_matches: number;
    fuzzy_matches: number;
    needs_review: number;
    unmatched: number;
    errors: number;
    total_quote_value: number | null;
    currency: string | null;
    rows_missing_price: number;
  };
  matches: MatchRow[];
  unmatched_parts: { part: string; quantity: number; reason: string | null }[];
  processing_errors: { stage: string; error: string }[];
}

// ---------------------------------------------------------------
// API calls
// ---------------------------------------------------------------

export async function verifyApiKey(): Promise<boolean> {
  try {
    await request('/api/bom/files');
    return true;
  } catch {
    return false;
  }
}

export function getReviewQueue(): Promise<ReviewQueueItem[]> {
  return request('/api/bom/review-queue');
}

export function reviewRow(
  rowId: string,
  action: 'confirm' | 'reject'
): Promise<{ row_id: string; review_action: string; reviewed_at: string }> {
  return request(`/api/bom/rows/${rowId}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
}

export function listFiles(): Promise<FileSummary[]> {
  return request('/api/bom/files');
}

export interface OrganizationRules {
  quote_validity_hours: number;
  default_margin_percent: number;
  moq_enforcement_enabled: boolean;
  is_default: boolean;
}

export function getOrganizationRules(): Promise<OrganizationRules> {
  return request('/api/organization/rules');
}

export function updateOrganizationRules(
  rules: Omit<OrganizationRules, 'is_default'>
): Promise<OrganizationRules> {
  return request('/api/organization/rules', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rules),
  });
}

export function getFileStatus(fileId: string): Promise<FileStatus> {
  return request(`/api/bom/status/${fileId}`);
}

export async function uploadFile(
  file: File,
  distributorId: string
): Promise<{ message: string; file_id: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('distributor_id', distributorId);

  return request('/api/bom/upload', {
    method: 'POST',
    body: formData,
  });
}
