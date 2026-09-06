const redis = require('../redis');
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    // Scope the cache per-user for authenticated routes (e.g. "/offers/me"),
    // otherwise every user would share one cached response keyed only by URL.
    const userPart = req.user?._id ? `user:${req.user._id}` : "public";
    const cacheKey = `cache:${userPart}:${req.originalUrl}`;
    try {
      const cached = await redis.get(cacheKey);

      if (cached) {
        return res.status(200).json({
          ...JSON.parse(cached),
          fromCache: true,
        });
      }
      const originalJson = res.json.bind(res);

      res.json = (body) => {
        if (res.statusCode === 200) {
          redis.setEx(cacheKey, ttl, JSON.stringify(body));
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      next();
    }
  };
};

module.exports = cacheMiddleware;