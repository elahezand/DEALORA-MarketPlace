/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
        remotePatterns: [
            { protocol: 'https', hostname: 'placehold.co' }
        ]

    },

};

export default nextConfig;
