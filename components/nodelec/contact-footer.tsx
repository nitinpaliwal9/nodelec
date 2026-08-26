'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mail, Phone, MapPin } from 'lucide-react';

export function ContactFooter() {
  return (
    <footer className="border-t border-border bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4" style={{ letterSpacing: '-0.02em' }}>
            See it work on your own RFQs
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Start a 15-day pilot &mdash; your real BOMs, your real ERP data, your team reviewing every match.
          </p>
          <Link href="/contact">
            <Button size="lg" className="h-12 px-8 text-base font-semibold">
              Start Your 15-Day Pilot
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>

        {/* Contact Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <Mail className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-foreground">Email</p>
            </div>
            <a href="mailto:hello@nodelec.in" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              hello@nodelec.in
            </a>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Phone className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-foreground">Phone</p>
            </div>
            <a href="tel:+919540581090" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              +91 9540581090
            </a>
          </div>

          <div className="text-center sm:text-right">
            <div className="flex items-center justify-center sm:justify-end gap-3 mb-2">
              <MapPin className="w-5 h-5 text-primary" />
              <p className="text-sm font-medium text-foreground">Location</p>
            </div>
            <p className="text-sm text-muted-foreground">Delhi, India</p>
          </div>
        </motion.div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 Nodelec. All rights reserved.</p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/solutions" className="hover:text-foreground transition-colors">Solutions</Link>
            <Link href="/features" className="hover:text-foreground transition-colors">Product</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
