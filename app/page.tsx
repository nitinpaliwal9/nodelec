import { Hero } from '@/components/nodelec/hero';
import { GuardrailSection } from '@/components/nodelec/guardrail-section';
import { MultiChannelSection } from '@/components/nodelec/multi-channel-section';
import { GapSection } from '@/components/nodelec/gap-section';
import { FeaturesGrid } from '@/components/nodelec/features-grid';
import { IntegrationsHub } from '@/components/nodelec/integrations';
import { EfficiencyCalculator } from '@/components/nodelec/efficiency-calculator';

export default function Home() {
  return (
    <div className="bg-background text-foreground overflow-hidden">
      <Hero />
      <GuardrailSection />
      <MultiChannelSection />
      <GapSection />
      <section id="features">
        <FeaturesGrid />
      </section>
      <IntegrationsHub />
      <EfficiencyCalculator />
    </div>
  );
}
