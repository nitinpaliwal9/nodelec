import { Hero } from '@/components/nodelec/hero';
import { ProblemSection } from '@/components/nodelec/problem-section';
import { HowItWorksSection } from '@/components/nodelec/how-it-works-section';
import { RealProductSection } from '@/components/nodelec/real-product-section';
import { GuardrailSection } from '@/components/nodelec/guardrail-section';
import { RoiCalculatorSection } from '@/components/nodelec/roi-calculator-section';
import { IntegrationsHub } from '@/components/nodelec/integrations';
import { PricingTeaser } from '@/components/nodelec/pricing-teaser';
import { SecurityControlSection } from '@/components/nodelec/security-control-section';
import { PilotSection } from '@/components/nodelec/pilot-section';

export default function Home() {
  return (
    <div className="bg-background text-foreground overflow-hidden">
      <Hero />
      <ProblemSection />
      <HowItWorksSection />
      <RealProductSection />
      <GuardrailSection />
      <RoiCalculatorSection />
      <IntegrationsHub />
      <PricingTeaser />
      <SecurityControlSection />
      <PilotSection />
    </div>
  );
}
