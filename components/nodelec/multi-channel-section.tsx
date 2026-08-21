'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Mail, Database } from 'lucide-react';

export function MultiChannelSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const channels = [
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      description: 'Customers send RFQs on WhatsApp. Nodelec listens and responds automatically.',
      delay: 0,
    },
    {
      icon: Mail,
      title: 'Email',
      description: 'Parse incoming emails, understand context, and draft professional responses.',
      delay: 0.1,
    },
    {
      icon: Database,
      title: 'ERP Integration',
      description: 'Sync directly with your inventory system for real-time stock accuracy.',
      delay: 0.2,
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-secondary/10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" style={{ letterSpacing: '-0.02em' }}>
              The Multi-Channel Edge
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Nodelec listens to your incoming queries where they happen. No new software for your clients to learn.
            </p>
          </motion.div>

          {/* Channels Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {channels.map((channel, index) => {
              const IconComponent = channel.icon;
              return (
                <motion.div
                  key={index}
                  custom={channel.delay}
                  variants={itemVariants}
                  className="group"
                >
                  <div
                    className="h-full rounded-2xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300 hover:scale-105"
                    style={{
                      backgroundColor: 'rgba(17, 17, 17, 0.4)',
                      border: '1px solid rgba(0, 229, 255, 0.15)',
                    }}
                  >
                    {/* Hover glow */}
                    <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>

                    {/* Icon */}
                    <div className="mb-6">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        className="w-16 h-16 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: 'rgba(0, 229, 255, 0.1)',
                          border: '1px solid rgba(0, 229, 255, 0.2)',
                        }}
                      >
                        <IconComponent className="w-8 h-8 text-primary" />
                      </motion.div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold text-foreground mb-3">{channel.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {channel.description}
                    </p>

                    {/* Bottom accent */}
                    <div className="mt-6 pt-6 border-t border-primary/10">
                      <p className="text-xs font-medium text-primary">Plug & Play Integration</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <motion.div
            variants={itemVariants}
            className="mt-16 text-center"
          >
            <p className="text-muted-foreground mb-4">
              Ready to automate across all channels?
            </p>
            <motion.a
              href="contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block px-8 py-3 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: 'rgba(0, 229, 255, 0.15)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                color: '#00e5ff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 229, 255, 0.25)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 229, 255, 0.15)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Explore Integration Options →
            </motion.a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
