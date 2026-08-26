'use client';

import { motion } from 'framer-motion';
import { Lock, CheckCircle2, XCircle } from 'lucide-react';

export function RealProductSection() {
  return (
    <section className="section-band px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            <span className="text-xs font-medium text-primary tracking-wide">THE REVIEW QUEUE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" style={{ letterSpacing: '-0.02em' }}>
            Here&apos;s the actual interface
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Review incoming RFQs, inspect extracted data, and verify exceptions before they move forward
            &mdash; this isn&apos;t a mockup, it&apos;s a recreation of the real dashboard your team would use.
          </p>
        </motion.div>

        {/* Browser-chrome product preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto mt-10 rounded-2xl overflow-hidden border border-border bg-background shadow-2xl shadow-black/40"
        >
          {/* Chrome bar */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-secondary/60 border-b border-border/50">
            <div className="flex gap-1.5 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-primary/50"></div>
            </div>
            <div className="flex-1 flex justify-center min-w-0">
              <div className="flex items-center gap-1.5 bg-background/70 border border-border/50 rounded-md px-3 py-1 text-[11px] text-muted-foreground font-mono truncate">
                <Lock className="w-3 h-3 shrink-0" />
                app.nodelec.in/dashboard/review
              </div>
            </div>
          </div>

          {/* App content */}
          <div className="p-4 sm:p-6 text-left">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-foreground">Review Queue</p>
                <p className="text-[11px] text-muted-foreground">2 matches need a second look</p>
              </div>
              <div className="hidden sm:flex gap-1.5">
                <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono">All 2</span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-secondary text-muted-foreground border border-border font-mono">Value mismatch 1</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="rounded-lg border border-border/50 border-l-4 border-l-orange-500 bg-card/60 px-3.5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded border bg-orange-500/10 text-orange-400 border-orange-500/20">Value mismatch</span>
                    <span className="text-[10px] text-muted-foreground font-mono">qty 200</span>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground truncate">&quot;2n3906 transistor to-92&quot;</p>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-[11px] text-muted-foreground">suggests</span>
                    <span className="font-mono font-semibold text-xs text-foreground">2N3906TAR</span>
                    <span className="font-mono text-xs font-bold text-yellow-400">89%</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-7 h-7 rounded-md border border-destructive/30 text-destructive flex items-center justify-center">
                    <XCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border/50 border-l-4 border-l-primary/60 bg-card/60 px-3.5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded border bg-primary/10 text-primary border-primary/20">Description match</span>
                    <span className="text-[10px] text-muted-foreground font-mono">qty 500</span>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground truncate">&quot;10k 0402 resistor 1% tol&quot;</p>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-[11px] text-muted-foreground">suggests</span>
                    <span className="font-mono font-semibold text-xs text-foreground">RC0402FR-0710KL</span>
                    <span className="font-mono text-xs font-bold text-primary">97%</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-7 h-7 rounded-md border border-destructive/30 text-destructive flex items-center justify-center">
                    <XCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Beyond the Review Queue -- other real dashboard surfaces, referenced not re-mocked */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          viewport={{ once: true }}
          className="grid sm:grid-cols-3 gap-4 mt-10 max-w-3xl mx-auto"
        >
          {[
            { title: 'Files', desc: 'Every uploaded or emailed BOM, with its processing status.' },
            { title: 'File Detail', desc: 'Line-by-line matches for a single RFQ, with inline confirm/reject.' },
            { title: 'Organization Summary', desc: 'File counts by status and open quote value, at a glance.' },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-surface p-5">
              <p className="text-sm font-semibold text-foreground mb-1.5">{item.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
