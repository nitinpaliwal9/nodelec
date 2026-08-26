'use client';

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { Mail, FileText, ShieldCheck, Database, FileCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SolutionsPage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const stages = [
    {
      icon: Mail,
      title: 'RFQ Intake',
      description: 'Capture and structure incoming quotation requests as they arrive by email, with the BOM attached as Excel or PDF.',
      detail: 'Live today.',
    },
    {
      icon: FileText,
      title: 'BOM Processing',
      description: 'Extract and normalize part numbers, quantities, and descriptions from the quotation document, then match them against your real stock and pricing.',
      detail: 'Live today.',
    },
    {
      icon: ShieldCheck,
      title: 'Human Review',
      description: 'Anything below a confidence threshold routes to the Review Queue, where your team confirms or rejects the match before it moves forward.',
      detail: 'Live today.',
    },
    {
      icon: Database,
      title: 'ERP Workflow',
      description: 'Stock and pricing data is kept current through a direct sync with your ERP, so every match reflects what you actually have.',
      detail: 'Tally integration live today; additional connectors in development.',
    },
    {
      icon: FileCheck,
      title: 'Quotation Preparation',
      description: 'Once reviewed, validated line items — parts, quantities, and pricing — are ready for your team to turn into a quote.',
      detail: 'Live today.',
    },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/[0.06] rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight" style={{ letterSpacing: '-0.02em' }}>
              How Nodelec fits your workflow
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
              Five stages, from an incoming RFQ to quotation-ready data. Here&apos;s exactly what happens at
              each one &mdash; and what&apos;s live today versus still in development.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Workflow stages */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-4"
          >
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <motion.div key={stage.title} variants={itemVariants}>
                  <div className="flex gap-5 rounded-2xl border border-border bg-surface p-6 sm:p-8">
                    <div className="flex-shrink-0 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      {index < stages.length - 1 && (
                        <div className="hidden sm:block w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-2">
                      <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground mb-1">
                        Stage {index + 1}
                      </p>
                      <h2 className="text-xl font-semibold text-foreground mb-2">{stage.title}</h2>
                      <p className="text-base text-muted-foreground leading-relaxed mb-3">
                        {stage.description}
                      </p>
                      <p className="text-xs font-mono text-primary">{stage.detail}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Want to see this run on your own RFQs?
            </h2>
            <p className="text-lg text-muted-foreground">
              Start a 15-day pilot with your real BOMs and real ERP data.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/contact">
              <Button className="px-8 py-3">
                Start Your 15-Day Pilot
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="px-8 py-3">
                View Pricing
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
