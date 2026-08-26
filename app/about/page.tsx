'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Target, Users, Zap, Globe, ArrowRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const values = [
    {
      icon: Target,
      title: 'Precision Engineering',
      description: 'Every match is built to be checked, not just trusted — the same precision we expect from the industry we serve.',
    },
    {
      icon: Users,
      title: 'Human-Centric AI',
      description: 'AI that augments human expertise, not replaces it. Your team stays in control with our 15-day guardrail.',
    },
    {
      icon: Zap,
      title: 'No Re-Entry',
      description: 'Extracted BOM data flows straight from RFQ to review — no retyping part numbers into a spreadsheet.',
    },
    {
      icon: Globe,
      title: 'Real Infrastructure',
      description: 'A production backend, a live ERP integration, and a real pilot running today — not a concept demo.',
    },
  ];

  const today = [
    { title: 'Live pilot in production', description: 'Nodelec is running on a real customer’s catalog today, not a sandbox.' },
    { title: 'Email intake & Tally ERP sync', description: 'Both are live integrations, actively used, not roadmap items.' },
    { title: 'Human-verified by default', description: 'Every uncertain match is reviewed by a person before it’s used in a quote.' },
    { title: 'Actively expanding', description: 'More ERP connectors and intake channels are in active development.' },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Single restrained ambient wash -- no pulsing */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/[0.06] rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight" style={{ letterSpacing: '-0.02em' }}>
              The Nodelec Vision
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
              We build AI-assisted RFQ and quotation automation for industrial sales teams &mdash; a real product,
              running on a real pilot, today.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              In industrial distribution, a delayed or error-prone quote can mean lost business, while manual
              BOM processing eats up hours that could go toward actually selling. We're on a mission to remove
              that repetitive work with AI that handles the extraction, matching, and lookups &mdash; while your
              team stays in control of what actually goes out.
            </p>
          </motion.div>

          {/* Values Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 gap-8 mb-20"
          >
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div key={value.title} variants={itemVariants}>
                  <div className="bg-surface border border-border rounded-2xl p-8 h-full">
                    <div className="inline-flex w-12 h-12 rounded-xl bg-primary/10 items-center justify-center mb-6">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Story Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 text-center">
              Our Story
            </h2>
            <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12">
              <p className="text-muted-foreground leading-relaxed mb-6">
                Nodelec started with a simple observation: sales teams at industrial distributors spend a huge
                share of their time on work that has nothing to do with selling &mdash; re-typing BOM line
                items, looking up stock and pricing by hand, and reconciling quotes against ERP data before
                anything can go out.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                We built Nodelec to take that work off their plate. The product is live: it reads RFQs from
                email, extracts and matches BOM line items against real stock and pricing, and routes anything
                it isn&apos;t confident about to a human reviewer. It syncs with Tally today, with more ERP
                integrations in active development.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We&apos;re an early-stage company running a real pilot on a real production system &mdash; not
                a concept demo. We&apos;d rather tell you exactly what&apos;s built today than promise more than
                we can show you.
              </p>
            </div>
          </motion.div>

          {/* Where things stand today */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-12 text-center">
              Where things stand today
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {today.map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-surface p-6">
                  <p className="font-semibold text-foreground mb-1.5">{item.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <Heart className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">Built with Purpose</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              See it work on your own RFQs
            </h2>
            <p className="text-lg text-muted-foreground">
              Start a 15-day pilot and judge the output for yourself.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/pricing">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3">
                View Pricing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="border-primary/30 text-foreground hover:bg-primary/10 px-8 py-3">
                Start Your 15-Day Pilot
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}