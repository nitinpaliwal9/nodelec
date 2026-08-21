'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Check, Zap, Star, Users, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Pricing - Nodelec AI Automation Platform',
  description: 'Choose the right Nodelec plan for your semiconductor distribution business. From BOM parsing to automated quoting, scale your operations with AI-powered efficiency.',
  keywords: ['pricing', 'plans', 'subscription', 'BOM automation', 'quote generation', 'semiconductor pricing'],
  openGraph: {
    title: 'Pricing - Nodelec AI Automation Platform',
    description: 'Choose the right Nodelec plan for your semiconductor distribution business. From BOM parsing to automated quoting.',
    url: 'https://nodelec.ai/pricing',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Nodelec Pricing Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing - Nodelec AI Automation Platform',
    description: 'Choose the right Nodelec plan for your semiconductor distribution business.',
    images: ['/og-image.png'],
  },
};
'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Check, Zap, Star, Users, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { Metadata } from 'next';
import { Suspense } from 'react';
export const metadata: Metadata = {
  title: 'Pricing - Nodelec AI Automation Platform',
  description: 'Choose the right Nodelec plan for your semiconductor distribution business. From BOM parsing to automated quoting, scale your operations with AI-powered efficiency.',
  keywords: ['pricing', 'plans', 'subscription', 'BOM automation', 'quote generation', 'semiconductor pricing'],
  openGraph: {
    title: 'Pricing - Nodelec AI Automation Platform',
    description: 'Choose the right Nodelec plan for your semiconductor distribution business. From BOM parsing to automated quoting.',
    url: 'https://nodelec.ai/pricing',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Nodelec Pricing Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing - Nodelec AI Automation Platform',
    description: 'Choose the right Nodelec plan for your semiconductor distribution business.',
    images: ['/og-image.png'],
  },
};
export default function PricingPage() {
  return (
    <Suspense fallback={<div>Loading pricing...</div>}>
      <PricingContent />
    </Suspense>
  );
}
function PricingContent() {
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
    <div className="bg-background text-foreground min-h-screen relative">
      {/* Circuit board background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern
              id="pricing-circuit"
              x="0"
              y="0"
              width="300"
              height="300"
              patternUnits="userSpaceOnUse"
            >
              {/* Vertical lines */}
              <line
                x1="75"
                y1="0"
                x2="75"
                y2="300"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="0.5"
                opacity="0.8"
              />
              <line
                x1="150"
                y1="0"
                x2="150"
                y2="300"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="0.5"
                opacity="0.4"
              />
              <line
                x1="225"
                y1="0"
                x2="225"
                y2="300"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="0.5"
                opacity="0.4"
              />
              {/* Horizontal lines */}
              <line
                x1="0"
                y1="75"
                x2="300"
                y2="75"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="0.5"
                opacity="0.8"
              />
              <line
                x1="0"
                y1="150"
                x2="300"
                y2="150"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="0.5"
                opacity="0.4"
              />
              <line
                x1="0"
                y1="225"
                x2="300"
                y2="225"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="0.5"
                opacity="0.4"
              />
              {/* Connection nodes */}
              <circle
                cx="75"
                cy="75"
                r="3"
                fill="currentColor"
                className="text-primary"
                opacity="0.9"
              />
              <circle
                cx="225"
                cy="75"
                r="3"
                fill="currentColor"
                className="text-primary"
                opacity="0.6"
              />
              <circle
                cx="75"
                cy="225"
                r="3"
                fill="currentColor"
                className="text-primary"
                opacity="0.6"
              />
              <circle
                cx="225"
                cy="225"
                r="3"
                fill="currentColor"
                className="text-primary"
                opacity="0.9"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pricing-circuit)" />
        </svg>
      </div>
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 left-0 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight" style={{ letterSpacing: '-0.02em' }}>
              Choose Your Growth Engine
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
              Predictable pricing for automated distribution. Start with a 15-day pilot.
            </p>
          </motion.div>
        </div>
      </section>
      {/* Pilot Banner */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative group mb-16"
          >
            {/* Glow effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 rounded-3xl blur-2xl opacity-80 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
            {/* Main Card */}
            <div className="relative bg-gradient-to-br from-card/90 to-secondary/50 border border-primary/30 rounded-3xl overflow-hidden backdrop-blur-xl p-8 sm:p-12">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-8 h-8 text-primary" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                      Phase 1: The Agentic Pilot
                    </h2>
                  </div>
                  <p className="text-muted-foreground text-lg mb-6">
                    15 Days of AI Calibration & Human-in-the-Loop Verification
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-sm text-primary font-medium">Safe Toggle Active</span>
                  </div>
                </div>
                <div className="text-center lg:text-right">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                    ₹15,000
                  </div>
                  <p className="text-muted-foreground">One-time setup</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Pricing Grid */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid lg:grid-cols-3 gap-8"
          >
            {pricingTiers.map((tier, index) => (
              <motion.div key={tier.name} variants={itemVariants}>
                <div className={`group relative h-full ${tier.popular ? 'lg:scale-105' : ''}`}>
                  {/* Popular badge */}
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
                        <Star className="w-4 h-4" />
                        MOST POPULAR
                      </div>
                    </div>
                  )}
                  {/* Glow effect for popular */}
                  {tier.popular && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 rounded-3xl blur-xl opacity-60 animate-pulse"></div>
                  )}
                  {/* Main Card */}
                  <div className={`relative bg-gradient-to-br from-card/80 to-secondary/40 border rounded-3xl overflow-hidden backdrop-blur-xl p-8 h-full flex flex-col transition-all duration-300 ${
                    tier.popular
                      ? 'border-primary/50 shadow-2xl shadow-primary/10'
                      : 'border-primary/20 group-hover:border-primary/30'
                  }`}>
                    {/* Header */}
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-foreground mb-2">{tier.name}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{tier.description}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-primary">{tier.price}</span>
                        {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
                      </div>
                    </div>
                    {/* Features */}
                    <div className="flex-grow mb-8">
                      <ul className="space-y-4">
                        {tier.features.map((feature, featureIndex) => (
                          <motion.li
                            key={featureIndex}
                            initial={{ opacity: 0, x: -10 }}
                            whileHover={{ x: 5 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-start gap-3 group"
                          >
                            <motion.div
                              initial={{ scale: 0 }}
                              whileInView={{ scale: 1 }}
                              transition={{ delay: featureIndex * 0.1, duration: 0.3 }}
                              className="flex-shrink-0"
                            >
                              <Check className="w-5 h-5 text-primary group-hover:text-primary/80 transition-colors" />
                            </motion.div>
                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{feature}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                    {/* CTA Button */}
                    <Link href="/#contact" className="block">
                      <button className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                        tier.popular
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
                      }`}>
                        {tier.name === 'Enterprise' ? 'Contact Sales' : 'Start Pilot'}
                      </button>
                    </Link>
                    {/* Hover indicator */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      {/* Feature Comparison Table */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Feature Comparison
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Detailed breakdown of capabilities across all pricing tiers
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-card/80 to-secondary/40 border border-primary/20 rounded-3xl overflow-hidden backdrop-blur-xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/10">
                    <th className="text-left p-6 font-semibold text-foreground">Features</th>
                    <th className="text-center p-6 font-semibold text-foreground">Starter</th>
                    <th className="text-center p-6 font-semibold text-primary relative">
                      Growth
                      <div className="absolute inset-0 bg-primary/5 rounded-lg -m-2"></div>
                    </th>
                    <th className="text-center p-6 font-semibold text-foreground">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'WhatsApp Agent', starter: true, growth: true, enterprise: true },
                    { feature: 'Email Parsing', starter: true, growth: true, enterprise: true },
                    { feature: 'ERP Integration', starter: false, growth: true, enterprise: true },
                    { feature: 'Custom Margin Rules', starter: false, growth: true, enterprise: true },
                    { feature: 'Audit Logs', starter: '7 days', growth: '30 days', enterprise: 'Unlimited' },
                    { feature: 'Support Level', starter: 'Email', growth: 'Priority', enterprise: 'Dedicated' },
                    { feature: 'API Access', starter: false, growth: true, enterprise: true },
                    { feature: 'Custom Workflows', starter: false, growth: false, enterprise: true },
                    { feature: 'On-premise Deployment', starter: false, growth: false, enterprise: true },
                    { feature: 'SLA Guarantee', starter: false, growth: false, enterprise: true },
                  ].map((row, index) => (
                    <motion.tr
                      key={row.feature}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                      viewport={{ once: true }}
                      className="border-b border-primary/5 hover:bg-primary/5 transition-colors"
                    >
                      <td className="p-6 font-medium text-foreground">{row.feature}</td>
                      <td className="p-6 text-center">
                        {typeof row.starter === 'boolean' ? (
                          row.starter ? (
                            <Check className="w-5 h-5 text-primary mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">{row.starter}</span>
                        )}
                      </td>
                      <td className="p-6 text-center relative">
                        {typeof row.growth === 'boolean' ? (
                          row.growth ? (
                            <Check className="w-5 h-5 text-primary mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )
                        ) : (
                          <span className="text-sm text-primary font-medium">{row.growth}</span>
                        )}
                      </td>
                      <td className="p-6 text-center">
                        {typeof row.enterprise === 'boolean' ? (
                          row.enterprise ? (
                            <Check className="w-5 h-5 text-primary mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">{row.enterprise}</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>
      {/* ROI Calculator */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Calculator className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">ROI CALCULATOR</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Pay for the Tool, Save on the Team
            </h2>
            <p className="text-lg text-muted-foreground">
              One Nodelec Agent replaces 3 sales operations employees
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-card/80 to-secondary/40 border border-primary/20 rounded-3xl overflow-hidden backdrop-blur-xl p-8 sm:p-12"
          >
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">₹50,000</div>
                <div className="text-muted-foreground">Monthly Nodelec Cost</div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-2xl text-muted-foreground">=</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-destructive mb-2">₹150,000+</div>
                <div className="text-muted-foreground">3 Sales Ops Salaries Saved</div>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="mt-8 p-6 bg-primary/5 rounded-2xl border border-primary/10"
            >
              <p className="text-sm text-muted-foreground text-center">
                <strong className="text-primary">ROI Reality:</strong> Most customers see full ROI within 3 months.
                The AI doesn't sleep, doesn't take breaks, and processes quotes 24/7 with perfect accuracy.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about implementing Nodelec in your distribution workflow
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-card/80 to-secondary/40 border border-primary/20 rounded-3xl overflow-hidden backdrop-blur-xl p-8 sm:p-12"
          >
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="pilot" className="border-b border-primary/10 pb-4">
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary transition-colors">
                  How does the 15-day pilot work?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pt-2">
                  We calibrate the AI to your specific RFQ formats and inventory data. During this period,
                  every quote goes through human verification while the AI learns your patterns. By day 15,
                  the system achieves 99%+ accuracy and you have full confidence in automated processing.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="security" className="border-b border-primary/10 pb-4">
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary transition-colors">
                  Is my ERP data secure?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pt-2">
                  Yes, we use read-only encrypted connectors. Nodelec never writes to your ERP systems -
                  we only read inventory and pricing data to generate quotes. All data transmission is
                  encrypted end-to-end, and we comply with SOC 2 Type II standards.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="blurry" className="border-b border-primary/10 pb-4">
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary transition-colors">
                  Can it handle handwritten or blurry BOMs?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pt-2">
                  Our vision model handles high-res scans and digital PDFs with 99%+ accuracy. For handwritten
                  BOMs, we recommend scanning at 300+ DPI. The AI has been trained on thousands of real-world
                  BOM formats including handwritten notes, poor quality scans, and complex multi-column layouts.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="integration" className="border-b border-primary/10 pb-4">
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary transition-colors">
                  How long does integration take?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pt-2">
                  Most integrations are complete within 1-2 weeks. We provide pre-built connectors for SAP,
                  Oracle, Tally, and NetSuite. For custom ERPs, our team handles the development. The 15-day
                  pilot includes full integration and testing time.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="scaling">
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary transition-colors">
                  Can it scale with our quote volume?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pt-2">
                  Absolutely. Our cloud infrastructure scales automatically. We've processed over 100,000
                  quotes for customers handling 500+ RFQs monthly. The AI gets faster and more accurate
                  as it processes more of your specific BOM formats.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 
