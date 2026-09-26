/** @type {import('next').NextConfig} */

// where the backend serves uploaded images from (http://localhost:4000 in dev)
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api");
const isLocalApi =
    ["localhost", "127.0.0.1", "::1"].includes(apiUrl.hostname) ||
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(apiUrl.hostname);

const nextConfig = {
    images: {
        formats: ["image/avif", "image/webp"],
        minimumCacheTTL: 60 * 60 * 24 * 30,
        remotePatterns: [
            { protocol: "https", hostname: "placehold.co" },
            {
                protocol: apiUrl.protocol.replace(":", ""),
                hostname: apiUrl.hostname,
                port: apiUrl.port || "",
                pathname: "/**",
            },
        ],
        dangerouslyAllowLocalIP: isLocalApi,
    },
};

export default nextConfig;