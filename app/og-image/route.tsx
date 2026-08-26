import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#050505',
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(0, 229, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(0, 229, 255, 0.05) 0%, transparent 50%)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
            borderRadius: '12px',
            border: '2px solid #00e5ff',
            marginBottom: '40px',
          }}
        >
          <span
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#00e5ff',
            }}
          >
            N
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: '20px',
            lineHeight: '1.2',
            maxWidth: '800px',
          }}
        >
          Nodelec
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '24px',
            color: '#00e5ff',
            textAlign: 'center',
            marginBottom: '30px',
            fontWeight: '500',
          }}
        >
          AI-Assisted RFQ & Quotation Automation
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '18px',
            color: '#a1a1aa',
            textAlign: 'center',
            maxWidth: '600px',
            lineHeight: '1.4',
          }}
        >
          Extract, match, and validate incoming RFQs against your real stock and pricing &mdash;
          with human review before anything goes out.
        </div>

        {/* Bottom Accent */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '4px',
            backgroundColor: '#00e5ff',
            borderRadius: '2px',
            boxShadow: '0 0 20px rgba(0, 229, 255, 0.5)',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}