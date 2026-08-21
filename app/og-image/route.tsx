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
        {/* Circuit Pattern Background */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
          }}
        >
          <svg
            width="1200"
            height="630"
            viewBox="0 0 1200 630"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="circuit-bg"
                x="0"
                y="0"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M30 0V30M0 30H30M30 30V60M30 30H60"
                  stroke="#00e5ff"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
                <circle cx="30" cy="30" r="1.5" fill="#00e5ff" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="1200" height="630" fill="url(#circuit-bg)" />
          </svg>
        </div>

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
          AI Automation for Semiconductor Distribution
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
          The first AI engine built to bridge the gap between messy BOMs and ERP efficiency.
          Convert RFQs to Quotes in 42 seconds.
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