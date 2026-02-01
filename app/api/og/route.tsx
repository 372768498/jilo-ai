import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Jilo.ai - Discover & Compare AI Tools';
  const subtitle = searchParams.get('subtitle') || 'Expert Reviews & Comparisons';

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
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          padding: '60px',
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              marginRight: '16px',
            }}
          >
            🤖
          </div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#818cf8',
            }}
          >
            Jilo.ai
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: 'bold',
            color: '#f8fafc',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: '900px',
            marginBottom: '20px',
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '28px',
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '700px',
          }}
        >
          {subtitle}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div style={{ color: '#6366f1', fontSize: '20px' }}>jilo.ai</div>
          <div style={{ color: '#475569', fontSize: '20px' }}>|</div>
          <div style={{ color: '#64748b', fontSize: '20px' }}>AI Tools Directory & Reviews</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
