export const getUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const baseUrl = "http://localhost:4000";
    return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};