'use client';

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { Shield, Check, Calculator } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PRICING_TIERS, PILOT_FEE_LABEL } from '@/lib/pricing';

export default function PricingClient() {
  // Fixed: Added explicit 'Variants' type to solve the 'ease' string error
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
      transition: { 
        duration: 0.6, 
        ease: 'easeOut' // Now TS knows this is a valid easing string
      },
    },
  };

  return (
    <div className="bg-background text-foreground min-h-screen relative pb-20">
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">Pricing for a real workflow system</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            You&apos;re not buying a chatbot &mdash; you&apos;re connecting RFQ intake, catalog matching, human
            review, and your ERP into one workflow. Start with a 15-day pilot.
          </p>
        </motion.div>
      </section>

      {/* Pilot Banner */}
      <section className="pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-surface p-8 sm:p-12 flex flex-col md:flex-row justify-between items-center gap-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">The 15-Day Pilot</h2>
              </div>
              <p className="text-muted-foreground">Human-verified processing on your own RFQs before any monthly commitment.</p>
            </div>
            <div className="text-center md:text-right">
              <div className="text-3xl font-bold text-foreground">{PILOT_FEE_LABEL}</div>
              <p className="text-sm text-muted-foreground">One-time setup fee</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8"
        >
          {PRICING_TIERS.map((tier) => (
            <motion.div key={tier.id} variants={itemVariants}>
              <div className={`relative bg-surface border rounded-2xl p-8 h-full flex flex-col ${tier.popular ? 'border-primary' : 'border-border'}`}>
                {tier.popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Most Popular</span>}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-primary">{tier.priceLabel}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                </div>
                <ul className="flex-grow space-y-4 mb-8">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className="w-full">
                  <button className={`w-full py-3 rounded-xl font-bold transition-colors ${tier.popular ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}>
                    {tier.name === 'Enterprise' ? 'Contact Sales' : 'Start Pilot'}
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Feature Comparison */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-4">Capability</th>
                <th className="p-4 text-center">Starter</th>
                <th className="p-4 text-center text-primary">Growth</th>
                <th className="p-4 text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-border">
                <td className="p-4 font-medium">Email intake &amp; parsing</td>
                <td className="p-4 text-center"><Check className="mx-auto text-primary w-4 h-4" /></td>
                <td className="p-4 text-center"><Check className="mx-auto text-primary w-4 h-4" /></td>
                <td className="p-4 text-center"><Check className="mx-auto text-primary w-4 h-4" /></td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-4 font-medium">Tally ERP integration</td>
                <td className="p-4 text-center">—</td>
                <td className="p-4 text-center"><Check className="mx-auto text-primary w-4 h-4" /></td>
                <td className="p-4 text-center"><Check className="mx-auto text-primary w-4 h-4" /></td>
              </tr>
              <tr>
                <td className="p-4 font-medium">On-premise deployment</td>
                <td className="p-4 text-center">—</td>
                <td className="p-4 text-center">—</td>
                <td className="p-4 text-center"><Check className="mx-auto text-primary w-4 h-4" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Value framing */}
      <section className="py-12 px-4 max-w-4xl mx-auto text-center">
        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-10">
          <Calculator className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Less time on data entry, more time on the deal</h2>
          <p className="text-muted-foreground">
            Nodelec handles the repetitive part &mdash; reading the BOM, looking up stock and pricing,
            flagging what&apos;s uncertain &mdash; so your team spends its time on judgment calls, not
            re-typing part numbers.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4 max-w-3xl mx-auto scroll-mt-20">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>How does the 15-day pilot work?</AccordionTrigger>
            <AccordionContent>We calibrate the system to your RFQ formats and inventory data. During this phase, your team verifies every match in the Review Queue before it&apos;s used in a quote &mdash; nothing goes out unreviewed.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Does Nodelec write to my ERP?</AccordionTrigger>
            <AccordionContent>No. Nodelec only reads from Tally &mdash; it fetches stock and pricing through Tally&apos;s own export request and never sends anything back. The credential used to authenticate the connection is hashed the same way a password would be, and can&apos;t be read back by us or anyone else.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>How is my data handled?</AccordionTrigger>
            <AccordionContent>RFQs and BOMs you send in are processed and stored under your organization&apos;s own record in our database. Every request is authenticated and scoped to your organization &mdash; a request for another organization&apos;s data returns nothing, the same as if it didn&apos;t exist.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>What happens when Nodelec is uncertain about a match?</AccordionTrigger>
            <AccordionContent>It doesn&apos;t guess. Anything below a confidence threshold routes to the Review Queue, where your team confirms or rejects it before it&apos;s used in a quote.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>Can we deploy Nodelec in our own environment?</AccordionTrigger>
            <AccordionContent>On-premise Docker deployment is available on the Enterprise plan. If that&apos;s a requirement for your environment, talk to us about the specifics.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-6">
            <AccordionTrigger>How long is data retained?</AccordionTrigger>
            <AccordionContent>We don&apos;t have a published retention policy yet. Data stays tied to your organization for as long as your account is active &mdash; if you need something specific for procurement, ask us directly.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-7">
            <AccordionTrigger>Can it handle handwritten BOMs?</AccordionTrigger>
            <AccordionContent>Not yet. Nodelec currently extracts structured data from digital Excel and PDF BOMs. Handwritten or scanned documents aren&apos;t supported today.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}