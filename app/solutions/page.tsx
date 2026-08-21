'use client';

import Link from 'next/link';
import { motion, Variants } from 'framer-motion'; // Variants type import kiya
import { Building2, Factory, Cpu, Truck, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SolutionsPage() {
  // Explicitly typing variants to fix TS/runtime errors
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

  const solutions = [
    {
      icon: Building2,
      title: 'Semiconductor Distributors',
      description: 'Transform high-volume BOM processing with AI-powered automation designed specifically for semiconductor distribution.',
      challenges: [
        'Complex multi-supplier BOMs',
        'Time-sensitive quote requirements',
        'High-volume transaction processing',
        'Multi-channel customer communication',
      ],
      benefits: [
        '60-second quote generation',
        '99.2% BOM parsing accuracy',
        '24/7 automated processing',
        'Multi-language support',
      ],
      metrics: '500+ distributors using Nodelec',
    },
    {
      icon: Factory,
      title: 'OEM Manufacturers',
      description: 'Streamline procurement and quoting workflows for original equipment manufacturers with integrated ERP synchronization.',
      challenges: [
        'Complex supply chain coordination',
        'Multiple vendor negotiations',
        'Quality assurance requirements',
        'Cost optimization pressures',
      ],
      benefits: [
        'Automated vendor quote comparison',
        'Real-time inventory visibility',
        'Quality compliance tracking',
        'Cost optimization algorithms',
      ],
      metrics: '200+ OEMs optimized',
    },
    {
      icon: Cpu,
      title: 'EMS Providers',
      description: 'Accelerate electronics manufacturing services with intelligent BOM processing and automated quoting systems.',
      challenges: [
        'Rapid prototyping requirements',
        'Component availability tracking',
        'Multi-project coordination',
        'Quality control standards',
      ],
      benefits: [
        'Instant prototype quoting',
        'Component availability alerts',
        'Automated project tracking',
        'Quality assurance integration',
      ],
      metrics: '150+ EMS companies',
    },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
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
              Industry Solutions
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
              Tailored automation solutions for semiconductor distributors, OEMs, and EMS providers. Built for your industry's unique challenges.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible" // "animate" ki jagah whileInView use krna better h
            viewport={{ once: true }}
            className="space-y-20"
          >
            {solutions.map((solution, index) => {
              const Icon = solution.icon;
              return (
                <motion.div key={solution.title} variants={itemVariants}>
                  <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Content */}
                    <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                      <div className="inline-flex w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-6">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>

                      <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                        {solution.title}
                      </h2>

                      <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                        {solution.description}
                      </p>

                      <div className="grid sm:grid-cols-2 gap-8 mb-8">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-4">Key Challenges</h3>
                          <ul className="space-y-2">
                            {solution.challenges.map((challenge, challengeIndex) => (
                              <li key={challengeIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0"></span>
                                {challenge}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-4">Nodelec Benefits</h3>
                          <ul className="space-y-2">
                            {solution.benefits.map((benefit, benefitIndex) => (
                              <li
                                key={benefitIndex}
                                className="text-sm text-muted-foreground flex items-start gap-2"
                              >
                                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                        <Truck className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">{solution.metrics}</span>
                      </div>
                    </div>

                    {/* Visual */}
                    <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                      <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur-2xl opacity-60"></div>
                        <div className="relative bg-gradient-to-br from-card/80 to-secondary/40 border border-primary/20 rounded-3xl p-8 backdrop-blur-xl">
                          <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                            <Icon className="w-24 h-24 text-primary/60" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
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
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Ready to Join Industry Leaders?
            </h2>
            <p className="text-lg text-muted-foreground">
              See how Nodelec is transforming semiconductor supply chains across the industry.
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