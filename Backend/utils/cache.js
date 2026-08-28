// BUGFIX (2 issues):
// 1. This required the `redis` *library* module instead of the connected
//    client instance exported by `../redis.js`. The library module has no
//    `.KEYS()`/`.del()` methods, so every call threw and was silently
//    swallowed by the catch block below - cache invalidation never ran.
// 2. Even with the right client, the pattern passed in from callers (e.g.
//    "/api/listings*") doesn't match how keys are actually stored by
//    `middlewares/cache.js`, which prefixes every key with `cache:`
//    (`cache:${req.originalUrl}`). We now prefix the pattern here so
//    callers can keep passing route-shaped patterns.
// Also node-redis v4's client API is lowercase (`keys`, `del`), not
// `KEYS`/`DEL`.
const redis = require("../redis");

const invalidateCache = async (pattern) => {
  try {
    const fullPattern = pattern.startsWith("cache:") ? pattern : `cache:${pattern}`;
    const keys = await redis.keys(fullPattern);

    if (keys && keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error("Redis Cache Invalidation Error:", error);
  }
};
module.exports = invalidateCache;