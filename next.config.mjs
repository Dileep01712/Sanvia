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

    webpack(config, { dev }) {
        if (dev) {
            config.devtool = 'eval-source-map';
        }
        return config;
    },
};

export default nextConfig;