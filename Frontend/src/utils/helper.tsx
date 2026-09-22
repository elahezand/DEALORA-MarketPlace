export const getUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    // uploads are served from the API host, without the "/api" prefix
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/api\/?$/, "");
    return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};