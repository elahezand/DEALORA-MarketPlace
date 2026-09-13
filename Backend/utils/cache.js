
const redis = require("../redis");
const logger = require("./logger");

const invalidateCache = async (pattern) => {
  try {
    // Real keys look like `cache:public:/api/listings?...` or
    // `cache:user:<id>:/api/listings...` (see middlewares/cache.js) — there's
    // always a userPart segment between "cache:" and the URL, so the pattern
    // needs a wildcard there too or it will never match anything.
    const fullPattern = pattern.startsWith("cache:") ? pattern : `cache:*${pattern}`;
    const keys = await redis.keys(fullPattern);

    if (keys && keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    logger.error("Redis Cache Invalidation Error:", error);
  }
};
module.exports = invalidateCache;