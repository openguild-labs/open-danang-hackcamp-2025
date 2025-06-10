/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    experimental: {
        esmExternals: false,
    },
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
            crypto: false,
        };
        config.externals.push('pino-pretty', 'lokijs', 'encoding');
        return config;
    },
}

module.exports = nextConfig
