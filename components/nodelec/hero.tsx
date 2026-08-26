'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="pt-32 pb-20 sm:pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Single restrained ambient wash -- no pulsing, no circuit motif */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[36rem] h-[36rem] bg-primary/[0.06] rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border-strong to-transparent"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center"
        >
          <p className="text-xs font-mono uppercase tracking-wide text-primary mb-4">
            For electronics &amp; industrial distributors
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight" style={{ letterSpacing: '-0.02em' }}>
            Hire your first
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
              AI Sales Engineer.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Nodelec turns incoming RFQs into quotation-ready data &mdash; extracting BOM line items from
            email and Excel, matching them against your real stock and pricing, and routing anything
            uncertain to your team for review.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <Link href="/contact">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base font-semibold">
                Start your 15-day pilot
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-12 px-8 text-base font-semibold"
              >
                See how it works
              </Button>
            </a>
          </div>
          <p className="text-sm text-muted-foreground font-mono mb-8">No credit card needed for the pilot.</p>

          {/* Minimal verified proof -- what's live, not a speed claim */}
          <div className="inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-primary" />
              Email intake &mdash; live
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-primary" />
              Tally ERP sync &mdash; live
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-primary" />
              Human-verified by default
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
