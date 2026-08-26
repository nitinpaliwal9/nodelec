'use client';

import { motion, Variants } from 'framer-motion';
import {
  Cpu,
  Mail,
  Lock,
  Database,
  ShieldCheck,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

export default function FeaturesClient() {
  // Fixed Variants with proper TS typing
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const features = [
    {
      title: 'BOM Extraction',
      desc: 'Extract structured part numbers, quantities, and descriptions from Excel and PDF BOMs attached to incoming RFQ emails.',
      icon: <Cpu className="w-6 h-6 text-primary" />,
    },
    {
      title: 'Email Intake',
      desc: 'RFQs arrive as email — no new portal for your customers to learn. Nodelec reads the message and its attachments directly.',
      icon: <Mail className="w-6 h-6 text-primary" />,
    },
    {
      title: 'Tally ERP Sync',
      desc: 'A lightweight local agent keeps your stock levels and pricing current, so every match reflects what you actually have on hand.',
      icon: <Database className="w-6 h-6 text-primary" />,
    },
    {
      title: 'Review Queue',
      desc: 'Every match below a confidence threshold is flagged for your team, with the suggested part and a one-click confirm or reject.',
      icon: <ShieldCheck className="w-6 h-6 text-primary" />,
    },
    {
      title: 'Pipeline Dashboard',
      desc: 'See file status, review-queue volume, and open quote value across your organization at a glance.',
      icon: <BarChart3 className="w-6 h-6 text-primary" />,
    },
    {
      title: 'Secure Access',
      desc: 'Dashboard access is credentialed per organization, with hashed API keys — no shared logins.',
      icon: <Lock className="w-6 h-6 text-primary" />,
    },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen pb-20">
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 relative">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-6 inline-block">
              Platform Capabilities
            </span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight"
          >
            What Nodelec <span className="text-primary">actually does</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-3xl mx-auto"
          >
            Concrete capabilities, built into your existing workflow &mdash; not a list of buzzwords.
          </motion.p>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 divide-y divide-border lg:divide-y-0 lg:divide-x border border-border rounded-2xl overflow-hidden"
          >
            {features.map((feat, index) => (
              <motion.div key={index} variants={itemVariants} className="p-8 bg-surface">
                <div className="mb-5 p-2.5 rounded-lg bg-primary/10 border border-primary/20 w-fit">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2.5">{feat.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-base">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Workflow diagram -- input / processing / validation / output */}
      <section className="py-24 px-4 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">How a quote actually gets built</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Four stages, from an incoming RFQ to a quote your team has approved.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-4 divide-y divide-border md:divide-y-0 md:divide-x border border-border rounded-2xl overflow-hidden"
          >
            {[
              { step: 'INPUT', title: 'RFQ received', desc: 'Email or Excel BOM arrives from a customer.' },
              { step: 'PROCESSING', title: 'Parse & match', desc: 'Line items are extracted and matched against your real stock and pricing.' },
              { step: 'VALIDATION', title: 'Human review', desc: 'Low-confidence matches route to your team in the Review Queue.' },
              { step: 'OUTPUT', title: 'Quotation-ready data', desc: 'Validated part numbers, quantities, and pricing are ready for your team to turn into a quote.' },
            ].map((stage, i) => (
              <div key={stage.step} className="p-6 bg-surface relative">
                <p className="text-[10px] font-mono uppercase tracking-wide text-primary mb-3">{stage.step}</p>
                <h3 className="text-base font-semibold text-foreground mb-2">{stage.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{stage.desc}</p>
                {i < 3 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-background border border-border items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}