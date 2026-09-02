
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