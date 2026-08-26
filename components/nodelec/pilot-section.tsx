'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PILOT_FEE_LABEL, PILOT_DAYS } from '@/lib/pricing';

export function PilotSection() {
  const steps = [
    { n: '01', title: 'Connect', description: 'Connect your email intake, and Tally if you use it, so real RFQs start flowing in.' },
    { n: '02', title: 'Configure', description: 'We help set up your product catalog and matching so it reflects your actual parts and suppliers.' },
    { n: '03', title: 'Process', description: 'Real RFQs run through extraction and matching — not sample data.' },
    { n: '04', title: 'Review', description: 'Your team verifies every match in the Review Queue before anything is used in a quote.' },
    { n: '05', title: 'Evaluate', description: 'At the end of the pilot, you have real output on real RFQs to judge — and decide if it fits.' },
  ];

  return (
    <section id="pilot" className="section-band px-4 sm:px-6 lg:px-8 border-t border-border scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" style={{ letterSpacing: '-0.02em' }}>
            What happens during a pilot
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            {PILOT_DAYS} days, {PILOT_FEE_LABEL}, on your own RFQs &mdash; here&apos;s exactly what that looks like.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-5 divide-y divide-border sm:divide-y-0 sm:divide-x border border-border rounded-2xl overflow-hidden mb-10"
        >
          {steps.map((step) => (
            <div key={step.n} className="p-6 bg-surface">
              <span className="text-2xl font-bold text-muted-foreground/30 font-mono block mb-3">{step.n}</span>
              <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link href="/contact">
            <Button size="lg" className="h-12 px-8 text-base font-semibold">
              Start Your 15-Day Pilot
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
