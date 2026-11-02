/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: ('https://sanvia-nine.vercel.app').replace(/\/$/, ''),

    generateRobotsTxt: true,
    outDir: './public',
    sitemapSize: 7000,

    exclude: [
        '/api/*',
        '/_next/*',
        '/404',
        '/500',
        '/google4881eb6fd74d23c9.html',
    ],

    additionalPaths: async (config) => [
        await config.transform(config, '/'),
    ],

    robotsTxtOptions: {
        policies: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/_next/']
            },
        ],
    },
};