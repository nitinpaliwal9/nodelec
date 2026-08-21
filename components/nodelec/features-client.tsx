'use client';

import { motion, Variants } from 'framer-motion';
import { 
  Cpu, 
  MessageSquare, 
  Zap, 
  Database, 
  ShieldCheck, 
  BarChart3, 
  Search, 
  Layers 
} from 'lucide-react';

export default function FeaturesClient() {
  // Fixed Variants with proper TS typing
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const features = [
    {
      title: 'Agentic BOM Parsing',
      desc: 'AI that understands messy Excel sheets and PDFs. It extracts part numbers, quantities, and descriptions with 99% accuracy.',
      icon: <Cpu className="w-6 h-6 text-primary" />,
    },
    {
      title: 'Multi-Channel Agents',
      desc: 'Your AI agent lives on WhatsApp and Email. It listens to customer inquiries and drafts quotes automatically.',
      icon: <MessageSquare className="w-6 h-6 text-primary" />,
    },
    {
      title: 'Real-time ERP Sync',
      desc: 'Connects with your existing inventory. It checks stock levels and prices in milliseconds before suggesting a quote.',
      icon: <Database className="w-6 h-6 text-primary" />,
    },
    {
      title: 'Auto-Margin Engine',
      desc: 'Set complex rules for different customers. The AI applies your specific margins instantly based on volume or history.',
      icon: <Zap className="w-6 h-6 text-primary" />,
    },
    {
      title: 'Human-in-the-Loop',
      desc: 'A dedicated dashboard where your team can verify AI-generated quotes in seconds before they go to the client.',
      icon: <ShieldCheck className="w-6 h-6 text-primary" />,
    },
    {
      title: 'Market Intelligence',
      desc: 'Track which parts are trending. Get insights into your RFQ conversion rates and sales performance.',
      icon: <BarChart3 className="w-6 h-6 text-primary" />,
    },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen pb-20 overflow-hidden">
      {/* Circuit Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <svg className="w-full h-full">
          <pattern id="feat-grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#feat-grid)" />
        </svg>
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 relative">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-6 inline-block">
              Platform Capabilities
            </span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight"
          >
            Built for <span className="text-primary">Scalable</span> Distribution
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-3xl mx-auto"
          >
            Nodelec combines Agentic AI with your existing workflows to turn hours of manual 
            data entry into seconds of automated precision.
          </motion.p>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feat, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="group relative p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300"
              >
                <div className="mb-5 p-3 rounded-2xl bg-primary/10 w-fit group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Deep Tech Section */}
      <section className="py-24 px-4 bg-primary/[0.02] border-y border-border/50">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}>
            <h2 className="text-3xl font-bold mb-6 italic">"The Agentic Workflow"</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                <p className="text-muted-foreground"><strong className="text-foreground">Ingest:</strong> Customer sends a PDF BOM via WhatsApp.</p>
              </div>
              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                <p className="text-muted-foreground"><strong className="text-foreground">Match:</strong> AI cross-references 10k+ SKU codes in your ERP.</p>
              </div>
              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                <p className="text-muted-foreground"><strong className="text-foreground">Quote:</strong> Professional PDF is generated and ready for review.</p>
              </div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            whileInView={{ opacity: 1, scale: 1 }}
            className="relative aspect-video rounded-3xl border border-primary/20 overflow-hidden bg-black flex items-center justify-center"
          >
             <div className="text-primary/40 flex flex-col items-center gap-2">
                <Layers className="w-12 h-12 animate-pulse" />
                <span className="text-xs uppercase tracking-widest">System Architecture Visualization</span>
             </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}