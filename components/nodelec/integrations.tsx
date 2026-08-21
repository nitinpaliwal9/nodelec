'use client';

import { motion } from 'framer-motion';
import { Database } from 'lucide-react';

export function IntegrationsHub() {
  const integrations = [
    { name: 'Tally', icon: 'T' },
    { name: 'SAP', icon: 'S' },
    { name: 'Oracle', icon: 'O' },
    { name: 'NetSuite', icon: 'N' },
    { name: 'Odoo', icon: 'D' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4 },
    },
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Integration Hub
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Works seamlessly with your existing enterprise systems. Connect Nodelec to any ERP, database, or custom infrastructure.
          </p>
        </motion.div>

        {/* Integrations Grid with Circuit Trace */}
        <div className="relative">
          {/* Circuit trace SVG background */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ minHeight: '300px' }}
            viewBox="0 0 1200 300"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="circuit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Center node to each integration */}
            <g>
              {/* Lines to each node */}
              <line x1="600" y1="150" x2="200" y2="80" stroke="url(#circuit-gradient)" strokeWidth="2" />
              <line x1="600" y1="150" x2="400" y2="50" stroke="url(#circuit-gradient)" strokeWidth="2" />
              <line x1="600" y1="150" x2="600" y2="30" stroke="url(#circuit-gradient)" strokeWidth="2" />
              <line x1="600" y1="150" x2="800" y2="50" stroke="url(#circuit-gradient)" strokeWidth="2" />
              <line x1="600" y1="150" x2="1000" y2="80" stroke="url(#circuit-gradient)" strokeWidth="2" />

              {/* Connection nodes */}
              <circle cx="600" cy="150" r="6" fill="#00e5ff" opacity="0.6" />
              <circle cx="200" cy="80" r="4" fill="#00e5ff" opacity="0.4" />
              <circle cx="400" cy="50" r="4" fill="#00e5ff" opacity="0.4" />
              <circle cx="600" cy="30" r="4" fill="#00e5ff" opacity="0.4" />
              <circle cx="800" cy="50" r="4" fill="#00e5ff" opacity="0.4" />
              <circle cx="1000" cy="80" r="4" fill="#00e5ff" opacity="0.4" />
            </g>
          </svg>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10"
          >
            {integrations.map((integration, index) => (
              <motion.div key={index} variants={itemVariants}>
                <div className="group relative">
                  <div className="absolute inset-0 bg-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
                  <div
                    className="relative bg-card rounded-xl p-6 h-full flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer hover:scale-105"
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-lg mb-3 flex items-center justify-center text-lg font-bold transform group-hover:scale-110 transition-transform duration-300"
                      style={{
                        backgroundColor: 'rgba(0, 229, 255, 0.1)',
                        border: '1px solid rgba(0, 229, 255, 0.3)',
                        color: '#ffffff',
                      }}
                    >
                      {integration.icon}
                    </div>
                    <p className="text-sm font-medium text-foreground" style={{ letterSpacing: '-0.01em' }}>{integration.name}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Center Nodelec node */}
            <motion.div
              variants={itemVariants}
              className="col-span-2 md:col-span-5 relative"
            >
              <div className="flex justify-center">
                <div className="group relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
                  <div
                    className="relative bg-card rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300"
                    style={{
                      border: '1px solid rgba(0, 229, 255, 0.2)',
                      maxWidth: '200px',
                    }}
                  >
                    <div
                      className="w-16 h-16 rounded-lg mb-2 flex items-center justify-center"
                      style={{
                        backgroundColor: 'rgba(0, 229, 255, 0.15)',
                        border: '1px solid rgba(0, 229, 255, 0.4)',
                      }}
                    >
                      <Database className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-base font-semibold text-primary" style={{ letterSpacing: '-0.01em' }}>Nodelec AI</p>
                    <p className="text-xs text-muted-foreground mt-1">Unified Bridge</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Integration info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 rounded-2xl p-8 text-center backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(17, 17, 17, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <p className="text-muted-foreground mb-4">
            Need a custom integration? Our API-first architecture supports any system.
          </p>
          <a
            href="contact"
            className="inline-block text-primary font-semibold hover:text-primary/80 transition-colors"
          >
            Explore our API Documentation →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
