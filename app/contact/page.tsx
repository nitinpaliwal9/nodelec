'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, Send, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getSupabaseClient } from '@/lib/supabase';
import { formatINR } from '@/lib/pricing';

function buildRoiPrefill(params: URLSearchParams): string {
  if (params.get('source') !== 'roi_calculator') return '';
  const rfqs = params.get('rfqs');
  const hours = params.get('hours');
  const automation = params.get('automation');
  const plan = params.get('plan');
  const value = params.get('value');

  const lines = ['From the business-case calculator:'];
  if (rfqs) lines.push(`- ${rfqs} RFQs/month`);
  if (hours) lines.push(`- ~${Number(hours).toLocaleString('en-IN')} manual hours/year at current volume`);
  if (automation) lines.push(`- ${automation}% estimated automation opportunity`);
  if (value) lines.push(`- ~${formatINR(Number(value))}/year illustrative operational value`);
  if (plan) lines.push(`- Interested in the ${plan} plan`);
  lines.push('', "I'd like to talk through this.");
  return lines.join('\n');
}

export default function ContactPage() {
  const [prefillMessage, setPrefillMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPrefillMessage(buildRoiPrefill(new URLSearchParams(window.location.search)));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = getSupabaseClient();

    if (!supabase) {
      setError("This form isn't configured yet -- please email hello@nodelec.in directly.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const payload = {
      full_name: formData.get('fullName'),
      email: formData.get('email'),
      company_name: formData.get('company'),
      message: formData.get('message'),
    };

    const { error: submitError } = await supabase.from('leads').insert([payload]);

    if (submitError) {
      setError(submitError.message);
    } else {
      setIsSuccess(true);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-background text-foreground min-h-screen pt-20 md:pt-32 pb-20 px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 blur-[80px] md:blur-[120px] rounded-full" />
      
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16">
          
          {/* Left Side: Text & Info */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Start a <span className="text-primary">Nodelec</span> pilot.
            </h1>
            <p className="text-muted-foreground text-lg mb-12 max-w-md">
              Tell us about your RFQ workflow and we&apos;ll get back to you to figure out whether Nodelec
              is a fit &mdash; no auto-generated response, an actual person reads this.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">Email Us</h3>
                  <p className="text-muted-foreground text-lg">hello@nodelec.in</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">Visit Us</h3>
                  <p className="text-muted-foreground text-lg">Delhi, India</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">Call Us</h3>
                  <p className="text-muted-foreground text-lg">+91-9540581090</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side: Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="p-8 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl"
          >
            {isSuccess ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16">
                <CheckCircle2 className="w-16 h-16 text-primary" />
                <h2 className="text-2xl font-bold">Message Sent!</h2>
                <p className="text-muted-foreground max-w-xs">Thank you for reaching out. We have received your details and will get back to you shortly.</p>
                <Button onClick={() => setIsSuccess(false)} variant="outline">Send Another</Button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      required
                      type="text"
                      placeholder="Nitin Paliwal"
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email</Label>
                    <Input
                      id="email"
                      name="email"
                      required
                      type="email"
                      placeholder="hello@nodelec.in"
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    name="company"
                    required
                    type="text"
                    placeholder="Electronics Corp"
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    key={prefillMessage ? 'prefilled' : 'empty'}
                    id="message"
                    name="message"
                    required
                    rows={prefillMessage ? 7 : 4}
                    defaultValue={prefillMessage}
                    placeholder="How can we help you?"
                    className="rounded-xl resize-none"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-6 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl flex gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <>Send Message <Send className="w-5 h-5" /></>}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}