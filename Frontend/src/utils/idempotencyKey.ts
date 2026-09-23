const STORAGE_KEY = "checkout-idempotency-key";

/**
 * One key per checkout attempt, kept in sessionStorage so a refresh or a second
 * click sends the same key — the server then returns the order it already created
 * instead of creating (and charging) a second one.
 */
export const getCheckoutKey = (cartId?: string): string => {
  if (typeof window === "undefined") return "";
  const id = `${STORAGE_KEY}:${cartId || "cart"}`;

  try {
    const saved = sessionStorage.getItem(id);
    if (saved) return saved;

    const key = crypto.randomUUID();
    sessionStorage.setItem(id, key);
    return key;
  } catch {
    return crypto.randomUUID(); // private mode etc. — still works, just not reused
  }
};

/** Called once the order exists, so the next checkout starts a new key. */
export const clearCheckoutKey = (cartId?: string) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(`${STORAGE_KEY}:${cartId || "cart"}`);
  } catch {
    /* ignore */
  }
};
