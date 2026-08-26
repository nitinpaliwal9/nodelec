'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PRICING_TIERS, PILOT_FEE_LABEL, PILOT_DAYS } from '@/lib/pricing';

export function PricingTeaser() {
  return (
    <section id="pricing" className="section-band px-4 sm:px-6 lg:px-8 border-t border-border scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" style={{ letterSpacing: '-0.02em' }}>
            Transparent pricing, real pilot
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            A {PILOT_FEE_LABEL} pilot gets you {PILOT_DAYS} days of human-verified processing on your own
            RFQs before any monthly commitment.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="grid sm:grid-cols-3 gap-4"
        >
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-2xl p-6 border ${tier.popular ? 'border-primary/40 bg-primary/[0.04]' : 'border-border bg-surface'}`}
            >
              <p className="text-sm font-semibold text-foreground mb-1">{tier.name}</p>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-bold text-foreground">{tier.priceLabel}</span>
                <span className="text-muted-foreground text-sm">{tier.period}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{tier.description}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link href="/pricing">
            <Button variant="outline">
              View full pricing
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
