/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  // Reverse-proxy PostHog through our own domain so ad-blockers don't strip analytics.
  // Client points at /ingest (see components/analytics/posthog-provider.tsx).
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ]
  },
  // Required so PostHog's /ingest/decide endpoint is not redirected by trailing-slash handling.
  skipTrailingSlashRedirect: true,
  // 301 the merged duplicate tool slugs to their canonical published page (see scripts/merge-dup-tools.sql).
  async redirects() {
    const dupes = [
      { from: 'dalle-3', to: 'dall-e-3' },
      { from: 'leonardo-ai', to: 'leonardoai' },
    ]
    return dupes.flatMap(({ from, to }) =>
      ['en', 'zh'].map((locale) => ({
        source: `/${locale}/tools/${from}`,
        destination: `/${locale}/tools/${to}`,
        permanent: true,
      }))
    )
  },
}
module.exports = nextConfig
