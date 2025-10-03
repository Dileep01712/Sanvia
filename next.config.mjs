/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'c.saavncdn.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'c.saavncdn.com',
                port: '',
                pathname: '/**',
            },
        ],
    },

    // 👇 Add this block for better debugging
    webpack(config, { dev }) {
        if (dev) {
            // More accurate stack traces in browser DevTools
            config.devtool = 'eval-source-map';
            // Alternatives: 'cheap-module-source-map', 'source-map'
        }
        return config;
    },
};

export default nextConfig;
