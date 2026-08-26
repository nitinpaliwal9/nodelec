import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { SiteChrome } from '@/components/nodelec/site-chrome'

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
});
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
});

// Generate dynamic metadata based on route
export async function generateMetadata({ params }: { params?: { slug?: string } }): Promise<Metadata> {
  const baseUrl = 'https://nodelec.ai'
  const defaultMetadata = {
    title: 'Nodelec - AI-Assisted RFQ & Quotation Automation',
    description: 'Nodelec extracts and matches incoming RFQs against your real stock and pricing, with human review before anything goes out. Email intake and Tally ERP sync, live today.',
    keywords: ['AI', 'semiconductor', 'distribution', 'BOM', 'ERP', 'automation', 'quotes', 'RFQ'],
    authors: [{ name: 'Nodelec Team' }],
    creator: 'Nodelec',
    publisher: 'Nodelec',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      title: 'Nodelec - AI-Assisted RFQ & Quotation Automation',
      description: 'Nodelec extracts and matches incoming RFQs against your real stock and pricing, with human review before anything goes out. Email intake and Tally ERP sync, live today.',
      url: baseUrl,
      siteName: 'Nodelec',
      images: [
        {
          url: '/og-image',
          width: 1200,
          height: 630,
          alt: 'Nodelec - AI-Assisted RFQ & Quotation Automation',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Nodelec - AI-Assisted RFQ & Quotation Automation',
      description: 'Nodelec extracts and matches incoming RFQs against your real stock and pricing, with human review before anything goes out. Email intake and Tally ERP sync, live today.',
      images: ['/og-image'],
      creator: '@nodelec_ai',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [
        {
          url: '/icon-light-32x32.png',
          media: '(prefers-color-scheme: light)',
        },
        {
          url: '/icon-dark-32x32.png',
          media: '(prefers-color-scheme: dark)',
        },
        {
          url: '/icon.svg',
          type: 'image/svg+xml',
        },
      ],
      apple: '/apple-icon.png',
    },
  }

  // You can add route-specific metadata here
  // For now, returning default metadata
  return defaultMetadata
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${plexSans.variable} ${plexMono.variable} font-sans antialiased`}>
        <SiteChrome>{children}</SiteChrome>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
