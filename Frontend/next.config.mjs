/** @type {import('next').NextConfig} */
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api");
const isLocalApi =
    ["localhost", "127.0.0.1", "::1"].includes(apiUrl.hostname) ||
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(apiUrl.hostname);

const nextConfig = {
    // self-contained server in .next/standalone — the Docker image only copies that
    output: "standalone",
    poweredByHeader: false,

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

    experimental: {
        optimizePackageImports: ["@heroui/react"],
    },

    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "X-Frame-Options", value: "SAMEORIGIN" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
                ],
            },
        ];
    },
};

export default nextConfig;
