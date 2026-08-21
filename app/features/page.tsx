import type { Metadata } from 'next';
import FeaturesClient from '@/components/nodelec/features-client';

export const metadata: Metadata = {
  title: 'Features - AI-Powered BOM Processing | Nodelec',
  description: 'Discover Nodelec\'s advanced features: AI BOM parsing, multi-channel agents, and real-time inventory matching.',
  keywords: ['features', 'BOM parsing', 'AI automation', 'electronics distribution'],
};

export default function FeaturesPage() {
  return <FeaturesClient />;
}