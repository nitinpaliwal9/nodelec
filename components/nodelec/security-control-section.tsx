'use client';

import { motion } from 'framer-motion';
import { KeyRound, Database, Cable, ShieldCheck, Server, ArrowRight } from 'lucide-react';

export function SecurityControlSection() {
  const controls = [
    {
      icon: KeyRound,
      title: 'Access',
      description:
        'Every dashboard request is authenticated with a hashed API key or session token — never stored in a form that could be read back — and scoped to your organization. A request for another organization’s data returns nothing, the same as if it didn’t exist.',
    },
    {
      icon: Database,
      title: 'Data',
      description:
        'RFQs and BOMs you send in are processed and stored under your organization’s own record in our database. Nothing is shared across organizations.',
    },
    {
      icon: Cable,
      title: 'ERP control',
      description:
        'Nodelec only reads from Tally — it fetches stock and pricing through Tally’s own export request and never sends anything back. Connection credentials are hashed or encrypted at rest, never stored in plain text.',
    },
    {
      icon: ShieldCheck,
      title: 'Human review',
      description:
        'Matches the system isn’t confident about are routed to the Review Queue. Nothing reaches a quote without your team confirming or rejecting it first.',
    },
    {
      icon: Server,
      title: 'Deployment',
      description:
        'Nodelec runs as a single containerized service. On-premise deployment is available on the Enterprise plan — talk to us about the specifics of your environment.',
    },
  ];

  return (
    <section id="security" className="section-band px-4 sm:px-6 lg:px-8 border-t border-border scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" style={{ letterSpacing: '-0.02em' }}>
            Built for controlled automation
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            No fake certifications, no vague promises &mdash; here&apos;s exactly what controls the
            implementation actually has today.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {controls.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="rounded-xl border border-border bg-surface p-6">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{c.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
              </div>
            );
          })}

          {/* Risk-control flow, compact -- not a repeat of the full How It Works diagram */}
          <div className="rounded-xl border border-border bg-surface p-6 flex flex-col justify-center">
            <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-4">
              When the system is uncertain
            </p>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-xs sm:text-sm">
              <span className="text-muted-foreground">Extraction / Matching</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
              <span className="text-primary font-medium">Review Queue</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
              <span className="text-muted-foreground">Human verification</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
              <span className="text-muted-foreground">Next step</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            No SOC 2, ISO 27001, or similar certifications yet &mdash; we&apos;d rather tell you that
            plainly than put up a badge we haven&apos;t earned. More in the{' '}
            <a href="/pricing#faq" className="text-primary hover:underline">
              security FAQ
            </a>
            .
          </p>
        </motion.div>
      </div>
    </section>
  );
}
