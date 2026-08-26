'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Info, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PRICING_TIERS, PILOT_FEE_LABEL, PILOT_DAYS, formatINR, type PricingTier } from '@/lib/pricing';

const AUTOMATION_PRESETS = [25, 50, 75] as const;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground mb-1.5 block">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
          className="w-full h-11 rounded-lg border border-border bg-background px-3 text-base text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {suffix && <span className="text-sm text-muted-foreground whitespace-nowrap">{suffix}</span>}
      </div>
    </label>
  );
}

export function RoiCalculatorSection() {
  const [monthlyRfqs, setMonthlyRfqs] = useState(200);
  const [minutesPerRfq, setMinutesPerRfq] = useState(15);
  const [peopleInvolved, setPeopleInvolved] = useState(2);
  const [workingDays, setWorkingDays] = useState(22);
  const [hourlyCost, setHourlyCost] = useState(500);
  const [automationPct, setAutomationPct] = useState<number>(50);
  const [tierId, setTierId] = useState<PricingTier['id']>('growth');
  const [inputsExpanded, setInputsExpanded] = useState(true);

  const tier = PRICING_TIERS.find((t) => t.id === tierId) ?? PRICING_TIERS[1];

  const calc = useMemo(() => {
    const rfqs = clamp(monthlyRfqs, 0, 1_000_000);
    const minutes = clamp(minutesPerRfq, 0, 480);
    const people = clamp(peopleInvolved, 1, 1000);
    const days = clamp(workingDays, 1, 31);
    const cost = clamp(hourlyCost, 0, 1_000_000);
    const automation = clamp(automationPct, 0, 100);

    const monthlyManualHours = (rfqs * minutes) / 60;
    const annualManualHours = monthlyManualHours * 12;
    const annualLaborCost = annualManualHours * cost;

    const potentialAnnualHoursRecovered = annualManualHours * (automation / 100);
    const potentialAnnualValue = potentialAnnualHoursRecovered * cost;
    const monthlyOperationalValue = potentialAnnualValue / 12;

    const annualNodelecCost = tier.monthlyPrice != null ? tier.monthlyPrice * 12 : null;
    const netAnnualValue = annualNodelecCost != null ? potentialAnnualValue - annualNodelecCost : null;

    let paybackMonths: number | null = null;
    if (tier.monthlyPrice != null && monthlyOperationalValue > 0) {
      paybackMonths = tier.monthlyPrice / monthlyOperationalValue;
    }

    const rfqsPerPersonPerDay = people > 0 && days > 0 ? rfqs / people / days : 0;

    return {
      monthlyManualHours,
      annualManualHours,
      annualLaborCost,
      potentialAnnualHoursRecovered,
      potentialAnnualValue,
      monthlyOperationalValue,
      annualNodelecCost,
      netAnnualValue,
      paybackMonths,
      rfqsPerPersonPerDay,
    };
  }, [monthlyRfqs, minutesPerRfq, peopleInvolved, workingDays, hourlyCost, automationPct, tier]);

  const hasNoValue = calc.monthlyOperationalValue <= 0;
  const showsShortfall = calc.netAnnualValue !== null && calc.netAnnualValue < 0;

  const contactParams = new URLSearchParams({
    source: 'roi_calculator',
    rfqs: String(Math.round(monthlyRfqs)),
    hours: calc.annualManualHours.toFixed(0),
    automation: String(automationPct),
    plan: tier.name,
    value: calc.potentialAnnualValue.toFixed(0),
  });

  return (
    <section id="business-case" className="section-band px-4 sm:px-6 lg:px-8 border-t border-border scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" style={{ letterSpacing: '-0.02em' }}>
            Build your Nodelec business case
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Put in your own numbers. We&apos;d rather you test the economics yourself than take our word for it.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="grid lg:grid-cols-2 gap-6"
        >
          {/* LEFT: Inputs */}
          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setInputsExpanded((v) => !v)}
              className="flex items-center justify-between w-full mb-2 lg:pointer-events-none lg:mb-6"
            >
              <span className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Your assumptions</span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground lg:hidden transition-transform ${inputsExpanded ? 'rotate-180' : ''}`} />
            </button>

            {/* Compact summary shown on mobile when collapsed */}
            {!inputsExpanded && (
              <p className="text-sm text-muted-foreground font-mono lg:hidden mb-2">
                {monthlyRfqs} RFQs &middot; {minutesPerRfq} min &middot; ₹{hourlyCost}/hr &middot; {automationPct}% &middot; {tier.name}
              </p>
            )}

            <div className={inputsExpanded ? 'block' : 'hidden lg:block'}>
              <div className="space-y-5 pt-4 lg:pt-0">
                    <NumberField label="Monthly RFQs" value={monthlyRfqs} onChange={setMonthlyRfqs} min={0} max={100000} step={10} />
                    <NumberField label="Average manual processing time per RFQ" value={minutesPerRfq} onChange={setMinutesPerRfq} min={0} max={480} suffix="minutes" />

                    <div className="grid grid-cols-2 gap-4">
                      <NumberField label="People involved" value={peopleInvolved} onChange={setPeopleInvolved} min={1} max={100} />
                      <NumberField label="Working days / month" value={workingDays} onChange={setWorkingDays} min={1} max={31} />
                    </div>

                    <NumberField label="Approximate loaded hourly cost" value={hourlyCost} onChange={setHourlyCost} min={0} max={1000000} step={50} suffix="₹/hour" />

                    <div>
                      <span className="text-sm font-medium text-foreground mb-1.5 block">Estimated automation opportunity</span>
                      <div className="flex gap-2">
                        {AUTOMATION_PRESETS.map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setAutomationPct(pct)}
                            className={`flex-1 h-10 rounded-lg border text-sm font-semibold transition-colors ${
                              automationPct === pct
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        An illustrative assumption you choose &mdash; not a measured Nodelec benchmark.
                      </p>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-foreground mb-1.5 block">Compare against plan</span>
                      <div className="flex gap-2 flex-wrap">
                        {PRICING_TIERS.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTierId(t.id)}
                            className={`px-3 h-10 rounded-lg border text-sm font-semibold transition-colors ${
                              tierId === t.id
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                            }`}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Results */}
          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 flex flex-col">
            <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-6">Your estimated business case</p>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground">Current manual workload</span>
                <span className="font-mono text-foreground">{calc.monthlyManualHours.toFixed(0)} hrs/month</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground">Estimated automation opportunity</span>
                <span className="font-mono text-foreground">{automationPct}%</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground">Potential hours recovered</span>
                <span className="font-mono text-foreground">{calc.potentialAnnualHoursRecovered.toFixed(0)} hrs/year</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground">Illustrative operational value</span>
                <span className="font-mono text-foreground">{formatINR(calc.potentialAnnualValue)}/year</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground">{tier.name} subscription</span>
                <span className="font-mono text-foreground">
                  {calc.annualNodelecCost != null ? `${formatINR(calc.annualNodelecCost)}/year` : 'Custom'}
                </span>
              </div>
              {peopleInvolved > 0 && workingDays > 0 && (
                <div className="flex justify-between items-baseline text-xs text-muted-foreground/70 pt-1">
                  <span>≈ per person, per working day</span>
                  <span className="font-mono">{calc.rfqsPerPersonPerDay.toFixed(1)} RFQs</span>
                </div>
              )}
            </div>

            {/* Dominant result */}
            <div className="rounded-xl border border-border bg-background p-5 mb-4">
              {calc.annualNodelecCost === null ? (
                <>
                  <p className="text-xs text-muted-foreground mb-1">Estimated operational value</p>
                  <p className="text-3xl font-bold text-foreground">{formatINR(calc.potentialAnnualValue)}<span className="text-base text-muted-foreground font-normal">/year</span></p>
                  <p className="text-sm text-muted-foreground mt-2">Enterprise pricing is custom &mdash; talk to us for an exact comparison.</p>
                </>
              ) : showsShortfall ? (
                <>
                  <p className="text-xs text-muted-foreground mb-1">Estimated net operational value</p>
                  <p className="text-3xl font-bold text-foreground">{formatINR(calc.netAnnualValue!)}<span className="text-base text-muted-foreground font-normal">/year</span></p>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                    {hasNoValue
                      ? 'Based on these inputs, there isn’t enough estimated operational value to model a payback period.'
                      : 'Based on these inputs, labor savings alone may not justify the current subscription.'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-1">Estimated net operational value</p>
                  <p className="text-3xl font-bold text-primary">{formatINR(calc.netAnnualValue!)}<span className="text-base text-muted-foreground font-normal">/year</span></p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Estimated payback: <span className="text-foreground font-semibold">{calc.paybackMonths!.toFixed(1)} months</span>
                  </p>
                </>
              )}
            </div>

            {/* Disclaimer -- readable, not buried */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 flex gap-3 mb-6">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Illustrative estimate based on the assumptions you entered. It models direct operational
                labor only &mdash; not faster turnaround, added quotation capacity, or accuracy gains, which
                Nodelec may also provide but which aren&apos;t part of this calculation. Actual results depend
                on workflow complexity, document quality, and review rates.
              </p>
            </div>

            <div className="mt-auto flex flex-col sm:flex-row gap-3">
              <Link href={`/contact?${contactParams.toString()}`} className="flex-1">
                <Button className="w-full h-11 font-semibold">
                  Build My Business Case
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/contact" className="flex-1">
                <Button variant="outline" className="w-full h-11 font-semibold">
                  Start a Pilot ({PILOT_FEE_LABEL})
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Want Nodelec modeled against your actual workflow? A {PILOT_DAYS}-day pilot is the fastest way to find out.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
