const redis = require('redis');

 const invalidateCache = async (pattern) => {
  try {
 
    const keys = await redis.KEYS(pattern); 
    
    if (keys && keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error("Redis Cache Invalidation Error:", error);
  }
};
module.exports = invalidateCache;