'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Mail, Phone, MapPin, Github, Linkedin, Twitter, Loader2, CheckCircle2 } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

export function ContactFooter() {
  const [formData, setFormData] = useState({
    company: '',
    volume: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const supabase = getSupabaseClient();

    if (!supabase) {
      alert("Pilot requests aren't configured yet -- please email hello@nodelec.in directly.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('pilots').insert([
      {
        company_name: formData.company,
        monthly_volume: formData.volume
      }
    ]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setIsSubmitted(true);
      setFormData({ company: '', volume: '' });
      setTimeout(() => setIsSubmitted(false), 5000);
    }
    setIsSubmitting(false);
  };

  return (
    <footer className="border-t border-border bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 text-center" style={{ letterSpacing: '-0.02em' }}>
            Optimize Your Supply Chain
          </h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Join leading semiconductor distributors transforming their operations with Nodelec
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="w-full"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
                  <Input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Your company"
                    className="bg-card"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Monthly Quote Volume</label>
                  <Input
                    type="text"
                    name="volume"
                    value={formData.volume}
                    onChange={handleChange}
                    placeholder="e.g., 500-1000"
                    className="bg-card"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || isSubmitted}
                className="w-full bg-primary text-primary-foreground h-12 text-base font-medium relative overflow-hidden"
                style={{ boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)' }}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isSubmitted ? (
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Request Sent!</span>
                ) : (
                  "Start Your 15-Day Pilot"
                )}
              </Button>

              <AnimatePresence>
                {isSubmitted && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-primary text-center text-sm font-medium"
                  >
                    Request successfully sent! Our team will contact you within 24 hours.
                  </motion.p>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </div>

        {/* Contact Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto"
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
            <a href="tel:+9199999XXXXX" className="text-sm text-muted-foreground hover:text-primary transition-colors">
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
        <div className="border-t border-white/10 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="text-xs text-muted-foreground">© 2026 Nodelec. All rights reserved.</p>
          </div>
          <div className="flex gap-4">
            <a href="#" className="p-2 border border-white/10 rounded-lg hover:bg-primary/20 transition-all"><Twitter className="w-4 h-4" /></a>
            <a href="#" className="p-2 border border-white/10 rounded-lg hover:bg-primary/20 transition-all"><Linkedin className="w-4 h-4" /></a>
            <a href="#" className="p-2 border border-white/10 rounded-lg hover:bg-primary/20 transition-all"><Github className="w-4 h-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}