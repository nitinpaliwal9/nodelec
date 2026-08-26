import type { Metadata } from 'next';
import FeaturesClient from '@/components/nodelec/features-client';

export const metadata: Metadata = {
  title: 'Features - RFQ & Quotation Automation | Nodelec',
  description: 'What Nodelec actually does: BOM extraction from email RFQs, Tally ERP sync, and a human review queue before anything reaches a quote.',
  keywords: ['RFQ automation', 'BOM parsing', 'ERP integration', 'electronics distribution'],
};

export default function FeaturesPage() {
  return <FeaturesClient />;
}