'use client';

import { motion } from 'framer-motion';
import { FileText, Database, TrendingUp } from 'lucide-react';

export function FeaturesGrid() {
  const features = [
    {
      icon: FileText,
      title: 'Automated BOM Parsing',
      description: 'AI-powered parsing extracts component data from complex BOMs with 99.2% accuracy, handling multiple formats and layouts.',
      stats: '1000+ BOMs/day',
    },
    {
      icon: Database,
      title: 'Real-time ERP Sync',
      description: 'Seamless integration with your existing ERP systems. Real-time data synchronization ensures consistency and eliminates manual entry.',
      stats: '10+ ERP systems',
    },
    {
      icon: TrendingUp,
      title: 'Smart Pricing Analytics',
      description: 'Dynamic pricing engine leverages market data, historical trends, and inventory levels to optimize quote profitability.',
      stats: '15-22% margin improvement',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            BOM Intelligence Suite
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Three powerful capabilities working together to transform your distribution operations
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <div className="group relative h-full">
                  {/* Glow background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>

                  {/* Card */}
                  <div className="relative bg-card border border-border group-hover:border-primary/50 rounded-2xl p-8 h-full flex flex-col transition-all duration-300">
                    {/* Icon */}
                    <div className="inline-flex w-12 h-12 rounded-lg bg-primary/10 items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm flex-grow mb-6 leading-relaxed">
                      {feature.description}
                    </p>

                    {/* Stats footer */}
                    <div className="pt-6 border-t border-border">
                      <p className="text-primary text-sm font-semibold">{feature.stats}</p>
                    </div>

                    {/* Hover indicator */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
