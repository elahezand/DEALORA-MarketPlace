import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";

const API_URL =
  typeof window === "undefined"
    ? process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_API_URL;

const fetchJson = async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...init,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
  return res.json();
};

/**
 * Public server-side fetch. With cacheKey + revalidateTime the result is cached by Next.
 * Returns null instead of throwing when the API is unreachable, so one broken section
 * never takes the whole page down (the cached branch used to throw).
 */
export const useServerData = async <T>(
  endpoint: string,
  cacheKey?: string,
  revalidateTime?: number
): Promise<T | null> => {
  try {
    if (cacheKey && revalidateTime !== undefined) {
      const cached = unstable_cache(() => fetchJson<T>(endpoint), [cacheKey, endpoint], {
        revalidate: revalidateTime,
      });
      return await cached();
    }
    return await fetchJson<T>(endpoint, { cache: "no-store" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`SSR fetch error (${endpoint}):`, message);
    return null;
  }
};

export const useAuthServerData = async <T>(
  endpoint: string,
  cacheKey?: string,
  revalidateTime?: number
): Promise<T | null> => {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("token")?.value || cookieStore.get("accessToken")?.value;

    const fetchOptions: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieStore.toString(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    if (typeof revalidateTime === "number") {
      fetchOptions.next = {
        revalidate: revalidateTime,
        ...(cacheKey ? { tags: [cacheKey] } : {}),
      };
    } else {
      fetchOptions.cache = "no-store";
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 401 || res.status === 403) {
      return null;
    }

    if (!res.ok) {
      console.error(`[useAuthServerData] Error ${res.status} on endpoint: ${endpoint}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : error;
    console.error(`[useAuthServerData] SSR Auth fetch error:`, message);
    return null;
  }
};
