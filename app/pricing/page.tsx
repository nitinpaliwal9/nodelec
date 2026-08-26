import type { Metadata } from 'next';
import PricingClient from '@/components/nodelec/pricing-clients';

export const metadata: Metadata = {
  title: 'Pricing | Nodelec',
  description: 'Transparent pricing for RFQ and quotation automation. Start with a 15-day pilot on your own RFQs.',
};

export default function PricingPage() {
  return <PricingClient />;
}