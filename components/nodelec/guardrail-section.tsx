'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useState } from 'react';

export function GuardrailSection() {
  const [isFullAuto, setIsFullAuto] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section className="section-band px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary tracking-wide">SAFETY FIRST</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" style={{ letterSpacing: '-0.02em' }}>
              The 15-Day Guardrail
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              <span className="text-foreground font-semibold">Don&apos;t hand your quotation workflow to AI on day one.</span>{' '}
              Prove it first &mdash; your team reviews every output while Nodelec learns your business.
            </p>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Description */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">How trust is built:</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/20 text-primary font-bold text-sm">
                        1
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Days 1-15: Human Verification</p>
                      <p className="text-base text-muted-foreground mt-0.5">Nodelec drafts quotes, your team reviews and approves every response.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/20 text-primary font-bold text-sm">
                        2
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Accuracy Tracking</p>
                      <p className="text-base text-muted-foreground mt-0.5">We measure approval rates. Once you hit 100% accuracy, unlock Full Auto mode.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/20 text-primary font-bold text-sm">
                        3
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Full Auto Mode</p>
                      <p className="text-base text-muted-foreground mt-0.5">Toggle to AI-driven responses. We notify you of every sent quote for transparency.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Benefits */}
              <div className="mt-8 pt-8 border-t border-border">
                <p className="text-sm font-semibold text-foreground mb-3">Why you'll love it:</p>
                <ul className="space-y-2 text-base text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Nothing reaches a customer without a human checking it first</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>AI learns your pricing, terms, and style</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Gradual transition—no big bang deployment</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Right: Toggle Switch Visual */}
            <motion.div variants={itemVariants} className="relative">
              <div className="relative rounded-3xl p-8 sm:p-10 bg-surface border border-border">
                <p className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground/70 text-center mb-6">
                  Interactive example
                </p>

                {/* Toggle Switch */}
                <div className="flex flex-col items-center space-y-8">
                  <div className="w-full">
                    <p className="text-sm font-medium text-foreground mb-6 text-center">Verification Mode</p>

                    {/* Switch Container */}
                    <div className="relative h-20 rounded-2xl overflow-hidden bg-muted/50">
                      {/* Slider */}
                      <motion.div
                        className="absolute top-2 bottom-2 w-1/2 rounded-xl bg-primary/20 border border-primary/40"
                        animate={{ left: isFullAuto ? '50%' : '0%' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                      ></motion.div>

                      {/* Labels */}
                      <div className="relative h-full flex items-center justify-between px-6 cursor-pointer" onClick={() => setIsFullAuto(!isFullAuto)}>
                        <span className={`text-sm font-medium transition-colors ${!isFullAuto ? 'text-primary' : 'text-muted-foreground'}`}>
                          Human Review
                        </span>
                        <span className={`text-sm font-medium transition-colors ${isFullAuto ? 'text-primary' : 'text-muted-foreground'}`}>
                          Full Auto
                        </span>
                      </div>
                    </div>

                    {/* Status Text */}
                    <motion.div className="mt-6 text-center">
                      {!isFullAuto ? (
                        <motion.div
                          key="human"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <p className="text-sm text-foreground font-semibold mb-2">Days 1-15</p>
                          <p className="text-xs text-muted-foreground">Your team reviews every AI-drafted quote before sending</p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="auto"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <p className="text-sm text-foreground font-semibold mb-2">100% accuracy unlocked</p>
                          <p className="text-xs text-muted-foreground">AI sends quotes autonomously. You get real-time notifications.</p>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>

                  {/* Stats below toggle */}
                  <div className="w-full pt-6 border-t border-border space-y-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Sample accuracy value</p>
                      <motion.p
                        className="text-2xl font-bold text-foreground"
                        key={isFullAuto ? 'full' : 'partial'}
                      >
                        {isFullAuto ? '100%' : '87%'}
                      </motion.p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
