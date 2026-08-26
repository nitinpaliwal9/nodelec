'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export function ProblemSection() {
  const pains = [
    'Someone opens every attachment by hand and retypes part numbers into a spreadsheet.',
    'Stock and pricing get looked up one line at a time, often against data that’s already stale.',
    'Ambiguous descriptions and near-miss part numbers get guessed at, not verified.',
    'By the time a quote is ready to send, the RFQ has already sat in an inbox for hours.',
  ];

  return (
    <section id="problem" className="section-band px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" style={{ letterSpacing: '-0.02em' }}>
            Your sales team shouldn&apos;t spend its best hours processing RFQs.
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            This is what happens before a quote can even be drafted &mdash; on every RFQ, no matter how
            simple the request actually is.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="flex flex-col gap-3 text-left max-w-xl mx-auto"
        >
          {pains.map((pain) => (
            <div key={pain} className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3.5">
              <X className="w-4 h-4 text-muted-foreground/60 mt-0.5 shrink-0" />
              <span className="text-sm sm:text-base text-muted-foreground leading-relaxed">{pain}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
