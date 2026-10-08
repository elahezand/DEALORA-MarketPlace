const redis = require("../redis");
const logger = require("./logger");

const invalidateCache = async (pattern) => {
  try {
    const fullPattern = pattern.startsWith("cache:") ? pattern : `cache:*${pattern}`;
    const batch = [];

    for await (const found of redis.scanIterator({ MATCH: fullPattern, COUNT: 200 })) {

      if (Array.isArray(found)) batch.push(...found);
      else batch.push(found);

      if (batch.length >= 500) {
        await redis.del(batch.splice(0, batch.length));
      }
    }

    if (batch.length) await redis.del(batch);
  } catch (error) {
    logger.error("Redis Cache Invalidation Error:", error);
  }
};

module.exports = invalidateCache;
