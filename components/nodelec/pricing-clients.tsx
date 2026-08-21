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

  const pricingTiers = [
    {
      name: 'Starter',
      price: '₹25,000',
      period: '/mo',
      description: 'BOM Parsing & Email Automation',
      features: [
        'Agentic Email/WhatsApp Listener',
        '15-Day Human-Verification Dashboard',
        'Real-time Inventory Matching',
        'PDF Quote Generator',
      ],
      popular: false,
    },
    {
      name: 'Growth',
      price: '₹50,000',
      period: '/mo',
      description: 'Full WhatsApp + Email Agentic Workflow + ERP Sync',
      features: [
        'Everything in Starter',
        'Multi-channel Agentic Processing',
        'ERP System Integration',
        'Advanced Analytics Dashboard',
        'Priority Support',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'SLA, On-premise Docker, and SAP/Oracle Integration',
      features: [
        'Everything in Growth',
        'Custom SLA Agreements',
        'On-premise Docker Deployment',
        'SAP/Oracle ERP Integration',
        'Dedicated Account Manager',
        'Custom Feature Development',
      ],
      popular: false,
    },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen relative pb-20">
      {/* Circuit board background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="pricing-circuit" x="0" y="0" width="300" height="300" patternUnits="userSpaceOnUse">
              <line x1="75" y1="0" x2="75" y2="300" stroke="currentColor" className="text-primary" strokeWidth="0.5" />
              <line x1="0" y1="75" x2="300" y2="75" stroke="currentColor" className="text-primary" strokeWidth="0.5" />
              <circle cx="75" cy="75" r="3" fill="currentColor" className="text-primary" />
              <circle cx="225" cy="225" r="3" fill="currentColor" className="text-primary" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pricing-circuit)" />
        </svg>
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">Choose Your Growth Engine</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Predictable pricing for automated distribution. Start with a 15-day pilot.</p>
        </motion.div>
      </section>

      {/* Pilot Banner */}
      <section className="pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-primary/10 rounded-3xl blur-xl"></div>
            <div className="relative bg-card/90 border border-primary/30 rounded-3xl p-8 sm:p-12 backdrop-blur-xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-8 h-8 text-primary" />
                  <h2 className="text-2xl font-bold">Phase 1: The Agentic Pilot</h2>
                </div>
                <p className="text-muted-foreground">15 Days of AI Calibration & Human-in-the-Loop Verification</p>
              </div>
              <div className="text-center md:text-right">
                <div className="text-3xl font-bold text-primary">₹15,000</div>
                <p className="text-sm text-muted-foreground">One-time setup fee</p>
              </div>
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
          {pricingTiers.map((tier) => (
            <motion.div key={tier.name} variants={itemVariants}>
              <div className={`relative bg-card border rounded-3xl p-8 h-full flex flex-col transition-all ${tier.popular ? 'border-primary shadow-2xl lg:scale-105' : 'border-border'}`}>
                {tier.popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Most Popular</span>}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-primary">{tier.price}</span>
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
                <td className="p-4 font-medium">WhatsApp/Email Agent</td>
                <td className="p-4 text-center"><Check className="mx-auto text-primary w-4 h-4" /></td>
                <td className="p-4 text-center"><Check className="mx-auto text-primary w-4 h-4" /></td>
                <td className="p-4 text-center"><Check className="mx-auto text-primary w-4 h-4" /></td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-4 font-medium">ERP Integration</td>
                <td className="p-4 text-center">—</td>
                <td className="p-4 text-center"><Check className="mx-auto text-primary w-4 h-4" /></td>
                <td className="p-4 text-center"><Check className="mx-auto text-primary w-4 h-4" /></td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-4 font-medium">Custom Margin Rules</td>
                <td className="p-4 text-center">—</td>
                <td className="p-4 text-center"><Check className="mx-auto text-primary w-4 h-4" /></td>
                <td className="p-4 text-center"><Check className="mx-auto text-primary w-4 h-4" /></td>
              </tr>
              <tr>
                <td className="p-4 font-medium">On-Premise Deployment</td>
                <td className="p-4 text-center">—</td>
                <td className="p-4 text-center">—</td>
                <td className="p-4 text-center"><Check className="mx-auto text-primary w-4 h-4" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-12 px-4 max-w-4xl mx-auto text-center">
        <div className="bg-primary/5 border border-primary/20 rounded-3xl p-10">
          <Calculator className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Pay for the tool, save on the team</h2>
          <p className="text-muted-foreground mb-6">1 Nodelec Agent can handle the workload of 3 Sales Operations employees.</p>
          <div className="flex justify-around items-center border-t border-primary/10 pt-6">
            <div><div className="text-2xl font-bold text-primary">₹50k</div><div className="text-xs text-muted-foreground uppercase">AI Cost</div></div>
            <div className="text-xl">vs</div>
            <div><div className="text-2xl font-bold text-destructive">₹1.5L+</div><div className="text-xs text-muted-foreground uppercase">Human Ops Cost</div></div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>How does the 15-day pilot work?</AccordionTrigger>
            <AccordionContent>We calibrate the AI to your specific QRF formats and inventory data. During this phase, every quote is verified before sending to ensure 99%+ accuracy.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Is my ERP data secure?</AccordionTrigger>
            <AccordionContent>Yes. We use read-only encrypted connectors. Nodelec never writes to your ERP; it only pulls data required to generate accurate quotes.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Can it handle handwritten BOMs?</AccordionTrigger>
            <AccordionContent>Our vision model handles high-res scans and digital PDFs flawlessly. For handwriting, we achieve ~90% accuracy which is refined during the pilot.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}