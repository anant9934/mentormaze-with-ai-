/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.parallelism = 1;
    return config;
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
    serverComponentsExternalPackages: ['@electric-sql/pglite', 'postgres'],
    outputFileTracingExcludes: {
      '*': [
        './training/**/*',
        './tests/**/*',
        './.mentormaze-pgdata*/**/*',
        './Naukri Dataset with Salary column/**/*',
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/dashboard/sessions',
        destination: '/dashboard/mentorship',
        permanent: false,
      },
      {
        source: '/dashboard/progress',
        destination: '/dashboard/mentorship?tab=goals',
        permanent: false,
      },
      {
        source: '/dashboard/mock-interviews',
        destination: '/dashboard/mentorship?tab=sessions',
        permanent: false,
      },
      {
        source: '/dashboard/resources',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/match',
        destination: '/mentors',
        permanent: false,
      },
      {
        source: '/mock-interviews/practice',
        destination: '/ai-mentor',
        permanent: false,
      },
      {
        source: '/mock-interviews',
        destination: '/mentors',
        permanent: false,
      },
      {
        source: '/programs',
        destination: '/how-it-works',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;


