'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export function IntegrationsHub() {
  const channels = {
    live: [{ name: 'Email' }],
    roadmap: [{ name: 'WhatsApp' }],
  };
  const erp = {
    live: [{ name: 'Tally' }],
    roadmap: [{ name: 'SAP' }, { name: 'Oracle' }, { name: 'NetSuite' }, { name: 'Odoo' }],
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  function Tile({ name, isLive }: { name: string; isLive: boolean }) {
    return (
      <motion.div
        variants={itemVariants}
        className={`rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 border ${
          isLive ? 'bg-primary/[0.06] border-primary/30' : 'bg-surface border-border'
        }`}
      >
        <p className={`text-sm font-semibold ${isLive ? 'text-foreground' : 'text-muted-foreground font-medium'}`}>{name}</p>
        {isLive ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide text-primary">
            <Check className="w-3 h-3" />
            Live
          </span>
        ) : (
          <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground/60">
            In development
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <section id="integrations" className="section-band px-4 sm:px-6 lg:px-8 border-t border-border scroll-mt-20">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            What Nodelec connects to
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            No ambiguity about what&apos;s live today versus what&apos;s still being built.
          </p>
        </motion.div>

        {/* Intake channels */}
        <div className="mb-12">
          <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-4">Intake channels</p>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-5 gap-3"
          >
            {channels.live.map((c) => (
              <Tile key={c.name} name={c.name} isLive />
            ))}
            {channels.roadmap.map((c) => (
              <Tile key={c.name} name={c.name} isLive={false} />
            ))}
          </motion.div>
        </div>

        {/* ERP systems */}
        <div>
          <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-4">ERP systems</p>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-5 gap-3"
          >
            {erp.live.map((c) => (
              <Tile key={c.name} name={c.name} isLive />
            ))}
            {erp.roadmap.map((c) => (
              <Tile key={c.name} name={c.name} isLive={false} />
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-10 rounded-2xl p-6 text-center bg-surface border border-border"
        >
          <p className="text-muted-foreground text-base">
            Email intake and Tally sync are live today via a lightweight local agent. Additional channels
            and ERP connectors are in active development &mdash; talk to us about your system.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
