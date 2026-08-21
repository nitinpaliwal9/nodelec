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
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-secondary/5 to-background">
      <div className="max-w-5xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary">SAFETY FIRST</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" style={{ letterSpacing: '-0.02em' }}>
              The 15-Day Guardrail
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              <span className="text-primary font-semibold">Total Control, Zero Risk.</span> Your team stays in charge while AI learns your workflow.
            </p>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Description */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">How it works:</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/20 text-primary font-bold text-sm">
                        1
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Days 1-15: Human Verification</p>
                      <p className="text-sm text-muted-foreground">Nodelec drafts quotes, your team reviews and approves every response.</p>
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
                      <p className="text-sm text-muted-foreground">We measure approval rates. Once you hit 100% accuracy, unlock Full Auto mode.</p>
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
                      <p className="text-sm text-muted-foreground">Toggle to AI-driven responses. We notify you of every sent quote for transparency.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Benefits */}
              <div className="mt-8 pt-8 border-t border-border">
                <p className="text-sm font-semibold text-foreground mb-3">Why you'll love it:</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>Zero risk of bad quotes going out</span>
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
            <motion.div
              variants={itemVariants}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div
                className="relative rounded-3xl p-8 sm:p-10"
                style={{
                  backgroundColor: 'rgba(17, 17, 17, 0.6)',
                  border: '1px solid rgba(0, 229, 255, 0.2)',
                }}
              >
                {/* Toggle Switch */}
                <div className="flex flex-col items-center space-y-8">
                  <div className="w-full">
                    <p className="text-sm font-medium text-foreground mb-6 text-center">Verification Mode</p>

                    {/* Switch Container */}
                    <div className="relative h-20 rounded-2xl overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                      {/* Background states */}
                      <div
                        className="absolute inset-0 transition-all duration-300"
                        style={{
                          backgroundColor: isFullAuto ? 'rgba(0, 229, 255, 0.1)' : 'rgba(0, 229, 255, 0)',
                        }}
                      ></div>

                      {/* Slider */}
                      <motion.div
                        className="absolute top-2 bottom-2 w-1/2 rounded-xl"
                        style={{
                          backgroundColor: 'rgba(0, 229, 255, 0.3)',
                          border: '1px solid rgba(0, 229, 255, 0.4)',
                          left: isFullAuto ? '50%' : '0%',
                        }}
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
                          <p className="text-sm text-primary font-semibold mb-2">100% Accuracy Unlocked!</p>
                          <p className="text-xs text-muted-foreground">AI sends quotes autonomously. You get real-time notifications.</p>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>

                  {/* Stats below toggle */}
                  <div className="w-full pt-6 border-t border-primary/10 space-y-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Current Accuracy</p>
                      <motion.p
                        className="text-2xl font-bold text-primary"
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
