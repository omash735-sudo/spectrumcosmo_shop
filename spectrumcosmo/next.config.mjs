/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // your other config options here...
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://res.cloudinary.com https://via.placeholder.com",
              "font-src 'self'",
              "connect-src 'self' https://api.upstash.com https://api.cloudinary.com https://res.cloudinary.com",
              "frame-src 'self'",
              "object-src 'none'",
            ].join('; ')
          }
        ]
      }
    ]
  }
}

export default nextConfig
