'use client';

import { motion } from 'framer-motion';
import { AlertCircle, Zap } from 'lucide-react';

export function GapSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-secondary/5 to-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-4" style={{ letterSpacing: '-0.02em' }}>
            The Gap We Bridge
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            See how Nodelec transforms manual chaos into AI-driven precision. Your sales desk reclaims 90% of lost time.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-8"
        >
          {/* The Manual Mess */}
          <motion.div variants={itemVariants} className="group">
            <div className="bg-card border border-border hover:border-border/50 rounded-2xl p-8 h-full" style={{ borderColor: '#ffffff15' }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-red-900/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-700" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">The Manual Mess</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Data Entry</span>
                    <span className="text-xs text-red-700">78 hours</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="h-full w-1/3 bg-gradient-to-r from-red-800 via-red-700 to-red-600 rounded-full opacity-70"
                    ></motion.div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Error Correction</span>
                    <span className="text-xs text-red-700">45 hours</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
                      className="h-full w-1/4 bg-gradient-to-r from-red-800 via-red-700 to-red-600 rounded-full opacity-70"
                    ></motion.div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Manual Communication</span>
                    <span className="text-xs text-red-700">67 hours</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2.8, repeat: Infinity, delay: 0.6 }}
                      className="h-full w-1/2 bg-gradient-to-r from-red-800 via-red-700 to-red-600 rounded-full opacity-70"
                    ></motion.div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">ERP Reconciliation</span>
                    <span className="text-xs text-red-700">56 hours</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 3.2, repeat: Infinity, delay: 0.9 }}
                      className="h-full w-2/5 bg-gradient-to-r from-red-800 via-red-700 to-red-600 rounded-full opacity-70"
                    ></motion.div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Average time per RFQ:</p>
                <p className="text-3xl font-bold text-red-700">213 hours/month</p>
              </div>
            </div>
          </motion.div>

          {/* The Nodelec Engine */}
          <motion.div variants={itemVariants} className="group">
            <div className="bg-card border border-primary/30 hover:border-primary/60 rounded-2xl p-8 h-full bg-gradient-to-br from-card to-primary/5" style={{ borderColor: '#ffffff15' }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">The Nodelec Engine</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">BOM Parsing</span>
                    <span className="text-xs text-primary">2 sec</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      animate={{ opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="h-full w-1/12 bg-gradient-to-r from-primary to-primary/70 rounded-full"
                      style={{
                        boxShadow: '0 0 12px rgba(0, 229, 255, 0.8), inset 0 0 8px rgba(0, 229, 255, 0.4)',
                      }}
                    ></motion.div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Validation</span>
                    <span className="text-xs text-primary">4 sec</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      animate={{ opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                      className="h-full w-1/12 bg-gradient-to-r from-primary to-primary/70 rounded-full"
                      style={{
                        boxShadow: '0 0 12px rgba(0, 229, 255, 0.8), inset 0 0 8px rgba(0, 229, 255, 0.4)',
                      }}
                    ></motion.div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">AI Pricing</span>
                    <span className="text-xs text-primary">28 sec</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      animate={{ opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                      className="h-full w-1/3 bg-gradient-to-r from-primary to-primary/70 rounded-full"
                      style={{
                        boxShadow: '0 0 12px rgba(0, 229, 255, 0.8), inset 0 0 8px rgba(0, 229, 255, 0.4)',
                      }}
                    ></motion.div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">ERP Integration</span>
                    <span className="text-xs text-primary">8 sec</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      animate={{ opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
                      className="h-full w-1/12 bg-gradient-to-r from-primary to-primary/70 rounded-full"
                      style={{
                        boxShadow: '0 0 12px rgba(0, 229, 255, 0.8), inset 0 0 8px rgba(0, 229, 255, 0.4)',
                      }}
                    ></motion.div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">Average time per RFQ:</p>
                <p className="text-3xl font-bold text-primary">42 seconds</p>
                <p className="text-xs text-primary/70 mt-2">That is 99.2% faster than manual entry.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Impact stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
        >
          {[
            { label: '90%', value: 'Sales Desk Workload Reduced' },
            { label: '18.3x', value: 'Faster Response' },
            { label: '₹5.2M', value: 'Annual Savings' },
            { label: '24/7', value: 'Always Active' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
              viewport={{ once: true }}
              className="rounded-xl p-4 text-center hover:border-primary/40 transition-all backdrop-blur-md"
              style={{
                backgroundColor: 'rgba(17, 17, 17, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <p className="text-2xl sm:text-3xl font-bold text-primary mb-1" style={{ letterSpacing: '-0.01em' }}>{stat.label}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
