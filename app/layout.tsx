import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { SiteChrome } from '@/components/nodelec/site-chrome'

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

// Generate dynamic metadata based on route
export async function generateMetadata({ params }: { params?: { slug?: string } }): Promise<Metadata> {
  const baseUrl = 'https://nodelec.ai'
  const defaultMetadata = {
    title: 'Nodelec - AI Automation for Semiconductor Distribution',
    description: 'The first AI engine built to bridge the gap between messy BOMs and ERP efficiency. Convert RFQs to Quotes in 42 seconds.',
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
      title: 'Nodelec - AI Automation for Semiconductor Distribution',
      description: 'The first AI engine built to bridge the gap between messy BOMs and ERP efficiency. Convert RFQs to Quotes in 42 seconds.',
      url: baseUrl,
      siteName: 'Nodelec',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Nodelec - AI Automation for Semiconductor Distribution',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Nodelec - AI Automation for Semiconductor Distribution',
      description: 'The first AI engine built to bridge the gap between messy BOMs and ERP efficiency. Convert RFQs to Quotes in 42 seconds.',
      images: ['/og-image.png'],
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
      <body className={`${geist.className} antialiased`}>
        <SiteChrome>{children}</SiteChrome>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
