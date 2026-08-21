'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      full_name: formData.get('fullName'),
      email: formData.get('email'),
      company_name: formData.get('company'),
      message: formData.get('message'),
    };

    const { error } = await supabase.from('leads').insert([payload]);

    if (error) {
      alert("Error: " + error.message);
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
              Let's build the <span className="text-primary">future</span> of electronics.
            </h1>
            <p className="text-muted-foreground text-lg mb-12 max-w-md">
              Have questions about our AI agents or need a custom ERP integration? 
              Reach out to hmara team.
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
            className="p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm shadow-2xl"
          >
            {isSuccess ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
                <h2 className="text-2xl font-bold">Message Sent!</h2>
                <p className="text-muted-foreground max-w-xs">Thank you for reaching out. We have received your details and will get back to you shortly.</p>
                <Button onClick={() => setIsSuccess(false)} variant="outline">Send Another</Button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <input 
                      name="fullName" required
                      type="text" 
                      placeholder="Nitin Paliwal" 
                      className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Work Email</label>
                    <input 
                      name="email" required
                      type="email" 
                      placeholder="hello@nodelec.in" 
                      className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <input 
                    name="company" required
                    type="text" 
                    placeholder="Electronics Corp" 
                    className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <textarea 
                    name="message" required
                    rows={4} 
                    placeholder="How can we help you?" 
                    className="w-full p-3 rounded-xl bg-background border border-border focus:border-primary outline-none transition-all resize-none"
                  />
                </div>

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