'use client';

import { motion } from 'framer-motion';
import { Mail, FileSearch, Target, ShieldCheck, Database } from 'lucide-react';

export function HowItWorksSection() {
  const steps = [
    {
      n: '01',
      icon: Mail,
      title: 'Receive',
      description: 'An incoming RFQ arrives by email, with the BOM attached as Excel or PDF.',
    },
    {
      n: '02',
      icon: FileSearch,
      title: 'Extract',
      description: 'Structured part numbers, quantities, and descriptions are extracted from the document.',
    },
    {
      n: '03',
      icon: Target,
      title: 'Match',
      description: 'Each line item is matched against your production catalog — real stock and pricing.',
    },
    {
      n: '04',
      icon: ShieldCheck,
      title: 'Review',
      description: 'Anything below a confidence threshold routes to the Review Queue for your team.',
    },
    {
      n: '05',
      icon: Database,
      title: 'Sync & Prepare',
      description: 'Validated data syncs with Tally and is ready for your team to turn into a quotation.',
    },
  ];

  return (
    <section id="how-it-works" className="section-band px-4 sm:px-6 lg:px-8 border-t border-border scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" style={{ letterSpacing: '-0.02em' }}>
            How Nodelec works
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            The same chain of work from the problem above &mdash; handled automatically, with your team
            in control of the parts that matter.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-5 divide-y divide-border sm:divide-y-0 sm:divide-x border border-border rounded-2xl overflow-hidden"
        >
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.n} className="p-6 bg-surface flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-muted-foreground/30 font-mono">{step.n}</span>
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
