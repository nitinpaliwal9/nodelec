'use client';

import { motion } from 'framer-motion';
import { Check, Zap, MessageCircle, Mail, Cog, FileText } from 'lucide-react';

export function Hero() {
  // Animation for the scanning line
  const scanLineVariants = {
    animate: {
      y: ['0%', '100%'],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  };

  // Animation for floating particles
  const particleVariants = {
    animate: (i: number) => ({
      y: [0, -10, 0],
      opacity: [0.3, 0.8, 0.3],
      transition: {
        duration: 3 + i * 0.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    }),
  };

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Circuit board background pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="absolute inset-0 w-full h-full opacity-15"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern
              id="circuit-board"
              x="0"
              y="0"
              width="200"
              height="200"
              patternUnits="userSpaceOnUse"
            >
              {/* Vertical lines */}
              <line
                x1="50"
                y1="0"
                x2="50"
                y2="200"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="0.5"
                opacity="0.6"
              />
              <line
                x1="100"
                y1="0"
                x2="100"
                y2="200"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="0.5"
                opacity="0.3"
              />
              <line
                x1="150"
                y1="0"
                x2="150"
                y2="200"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="0.5"
                opacity="0.3"
              />
              {/* Horizontal lines */}
              <line
                x1="0"
                y1="50"
                x2="200"
                y2="50"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="0.5"
                opacity="0.6"
              />
              <line
                x1="0"
                y1="100"
                x2="200"
                y2="100"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="0.5"
                opacity="0.3"
              />
              <line
                x1="0"
                y1="150"
                x2="200"
                y2="150"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="0.5"
                opacity="0.3"
              />
              {/* Connection nodes */}
              <circle
                cx="50"
                cy="50"
                r="2"
                fill="currentColor"
                className="text-primary"
                opacity="0.8"
              />
              <circle
                cx="150"
                cy="50"
                r="2"
                fill="currentColor"
                className="text-primary"
                opacity="0.5"
              />
              <circle
                cx="50"
                cy="150"
                r="2"
                fill="currentColor"
                className="text-primary"
                opacity="0.5"
              />
              <circle
                cx="150"
                cy="150"
                r="2"
                fill="currentColor"
                className="text-primary"
                opacity="0.8"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit-board)" />
        </svg>
      </div>

      {/* Aggressive glowing gradient overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/15 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Glow lines */}
        <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
        <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight" style={{ letterSpacing: '-0.02em' }}>
            Hire Your First
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
              AI Sales Engineer.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto mb-4">
            Nodelec automates your WhatsApp and Email RFQs. From incoming BOM to final quotation in 60 seconds, with zero manual entry.
          </p>
        </motion.div>

        {/* Animated Workflow Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative group">
            {/* Outer glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-60 group-hover:opacity-100"></div>

            {/* Main Card */}
            <div className="relative bg-gradient-to-br from-card/80 to-secondary/40 border border-primary/20 rounded-3xl overflow-hidden backdrop-blur-xl p-8 sm:p-12">
              {/* Workflow Header */}
              <div className="mb-12">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm font-medium text-primary">AGENTIC WORKFLOW</span>
                </div>
              </div>

              {/* Workflow Steps */}
              <div className="relative">
                {/* Connection line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2 hidden md:block"></div>

                {/* Three workflow nodes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative z-10">
                  {/* Step 1: Input Message */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative mb-4">
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center"
                        style={{
                          backgroundColor: 'rgba(0, 229, 255, 0.1)',
                          border: '1px solid rgba(0, 229, 255, 0.3)',
                        }}
                      >
                        <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                      </motion.div>
                      <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-primary/80 text-xs text-primary-foreground flex items-center justify-center font-bold">
                        1
                      </div>
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2 text-center">WhatsApp/Email</h3>
                    <p className="text-xs text-muted-foreground text-center">Incoming RFQ with BOM</p>
                  </motion.div>

                  {/* Step 2: AI Processing */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative mb-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center"
                        style={{
                          backgroundColor: 'rgba(0, 229, 255, 0.1)',
                          border: '1px solid rgba(0, 229, 255, 0.3)',
                        }}
                      >
                        <Cog className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                      </motion.div>
                      <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-primary/80 text-xs text-primary-foreground flex items-center justify-center font-bold">
                        2
                      </div>
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2 text-center">Nodelec AI</h3>
                    <p className="text-xs text-muted-foreground text-center">Processes in 60 seconds</p>
                  </motion.div>

                  {/* Step 3: PDF Quote */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative mb-4">
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center"
                        style={{
                          backgroundColor: 'rgba(0, 229, 255, 0.1)',
                          border: '1px solid rgba(0, 229, 255, 0.3)',
                        }}
                      >
                        <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                      </motion.div>
                      <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-primary/80 text-xs text-primary-foreground flex items-center justify-center font-bold">
                        3
                      </div>
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2 text-center">PDF Quote</h3>
                    <p className="text-xs text-muted-foreground text-center">Professional quotation ready</p>
                  </motion.div>
                </div>
              </div>

              {/* Workflow footer */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mt-12 pt-8 border-t border-primary/10 flex flex-wrap justify-center gap-6 sm:gap-12 text-xs sm:text-sm"
              >
                <div className="text-center">
                  <p className="text-primary font-semibold">60 seconds</p>
                  <p className="text-muted-foreground">Total Processing</p>
                </div>
                <div className="text-center">
                  <p className="text-primary font-semibold">Zero Manual Entry</p>
                  <p className="text-muted-foreground">Fully Automated</p>
                </div>
                <div className="text-center">
                  <p className="text-primary font-semibold">Multi-Channel</p>
                  <p className="text-muted-foreground">WhatsApp • Email • ERP</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
