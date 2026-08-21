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
      description: 'Every line of code is crafted with the same precision we demand from semiconductor manufacturing.',
    },
    {
      icon: Users,
      title: 'Human-Centric AI',
      description: 'AI that augments human expertise, not replaces it. Your team stays in control with our 15-day guardrail.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'From BOM receipt to professional quote in 60 seconds. No more waiting days for responses.',
    },
    {
      icon: Globe,
      title: 'Global Scale',
      description: 'Built for international semiconductor supply chains with multi-language support and global compliance.',
    },
  ];

  const milestones = [
    { year: '2023', event: 'Founded in Delhi NCR, India' },
    { year: '2024', event: 'First commercial deployment with leading distributor' },
    { year: '2024', event: 'Achieved 99.2% BOM parsing accuracy' },
    { year: '2024', event: 'Expanded to 10+ ERP integrations' },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen">
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
              The Nodelec Vision
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
              Democratizing AI-first supply chain automation for the semiconductor industry. We're building the future of intelligent distribution.
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
              In the semiconductor industry, every second counts. A delayed quote can mean lost business,
              while manual BOM processing creates bottlenecks that slow innovation. We're on a mission to
              eliminate these inefficiencies with AI that thinks like your best sales engineer - but works
              24/7 with perfect accuracy.
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
                  <div className="bg-gradient-to-br from-card/80 to-secondary/40 border border-primary/20 rounded-3xl p-8 backdrop-blur-xl h-full">
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
            <div className="bg-gradient-to-br from-card/80 to-secondary/40 border border-primary/20 rounded-3xl p-8 sm:p-12 backdrop-blur-xl">
              <p className="text-muted-foreground leading-relaxed mb-6">
                Founded in 2023, Nodelec emerged from the frontlines of semiconductor distribution.
                Our founders witnessed firsthand how manual processes were crippling growth in an industry
                that demands perfection and speed.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                What started as a simple automation script evolved into a comprehensive AI platform
                that understands the nuances of BOM processing, supplier negotiations, and customer
                communication patterns.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Today, we're proud to serve leading semiconductor distributors, OEMs, and EMS providers
                across Asia and beyond, processing thousands of quotes daily with unprecedented accuracy
                and speed.
              </p>
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-12 text-center">
              Our Journey
            </h2>
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-8"
                >
                  <div className="flex-shrink-0 w-20 text-right">
                    <span className="text-2xl font-bold text-primary">{milestone.year}</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-muted-foreground">{milestone.event}</p>
                  </div>
                </motion.div>
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
              Join Us in Transforming Supply Chains
            </h2>
            <p className="text-lg text-muted-foreground">
              Be part of the AI revolution in semiconductor distribution. Start your 15-day pilot today.
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