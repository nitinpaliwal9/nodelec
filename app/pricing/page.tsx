import type { Metadata } from 'next';
import PricingClient from '@/components/nodelec/pricing-clients';

export const metadata: Metadata = {
  title: 'Pricing - Choose Your Growth Engine | Nodelec',
  description: 'Predictable pricing for automated distribution. Start with a 15-day pilot and scale your BOM processing with AI.',
};

export default function PricingPage() {
  return <PricingClient />;
}