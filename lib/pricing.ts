/**
 * Single source of truth for Nodelec's commercial pricing.
 * The pricing page, the homepage pricing teaser, and the ROI/business-case
 * calculator all read from here so a price never drifts out of sync
 * between components.
 */

export interface PricingTier {
  id: 'starter' | 'growth' | 'enterprise';
  name: string;
  /** Numeric monthly price in INR, or null for "Custom" (Enterprise). */
  monthlyPrice: number | null;
  priceLabel: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 25000,
    priceLabel: '₹25,000',
    period: '/mo',
    description: 'Email intake, BOM parsing, and human-verified matching',
    features: [
      'Email RFQ intake & BOM parsing',
      '15-Day Human-Verification Dashboard',
      'Stock & pricing matching',
      'Structured, quotation-ready output',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 50000,
    priceLabel: '₹50,000',
    period: '/mo',
    description: 'Everything in Starter, plus Tally ERP sync',
    features: [
      'Everything in Starter',
      'Tally ERP integration',
      'Pipeline summary dashboard',
      'Priority Support',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: null,
    priceLabel: 'Custom',
    period: '',
    description: 'SLA, on-premise deployment, and custom integration work',
    features: [
      'Everything in Growth',
      'Custom SLA Agreements',
      'On-premise Docker Deployment',
      'Custom ERP integration (built for your stack)',
      'Dedicated Account Manager',
      'Custom Feature Development',
    ],
  },
];

export const PILOT_FEE = 15000;
export const PILOT_FEE_LABEL = '₹15,000';
export const PILOT_DAYS = 15;

export function getTier(id: PricingTier['id']): PricingTier {
  const tier = PRICING_TIERS.find((t) => t.id === id);
  if (!tier) throw new Error(`Unknown pricing tier: ${id}`);
  return tier;
}

/**
 * Formats a number as Indian-grouped rupees, e.g. 1500000 -> "₹15,00,000".
 * Negative values place the sign before the currency symbol ("-₹4,50,000"),
 * not after it.
 */
export function formatINR(amount: number, opts: { decimals?: number } = {}): string {
  const { decimals = 0 } = opts;
  if (!Number.isFinite(amount)) return '₹0';
  const sign = amount < 0 ? '-' : '';
  const magnitude = Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${sign}₹${magnitude}`;
}
