/**
 * Infrastructure for a future REAL customer testimonial. Not currently
 * mounted anywhere on the public site -- as of Phase 8, no genuine,
 * publication-authorized customer quote exists in the project (verified
 * by searching the codebase and database schema for testimonial/feedback
 * records; none found).
 *
 * Do NOT wire this up with placeholder, illustrative, or invented data.
 * When a real pilot customer gives explicit written permission to be
 * quoted publicly, populate <TestimonialCard> with their exact words,
 * real name, real title, and real company, and mount it where
 * appropriate (e.g. near RealProductSection or SecurityControlSection).
 *
 * Until then, this component should stay unused. A missing testimonials
 * section is more credible than a fabricated or placeholder one.
 */

interface TestimonialCardProps {
  quote: string;
  name: string;
  title: string;
  company: string;
}

export function TestimonialCard({ quote, name, title, company }: TestimonialCardProps) {
  return (
    <figure className="rounded-2xl border border-border bg-surface p-6 sm:p-8 max-w-xl">
      <blockquote className="text-base sm:text-lg text-foreground leading-relaxed mb-6">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="text-sm text-muted-foreground">
        <span className="text-foreground font-medium">{name}</span>
        {title && <span> &middot; {title}</span>}
        {company && <span>, {company}</span>}
      </figcaption>
    </figure>
  );
}
