const redis = require('../redis');
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    const cacheKey = `cache:${req.originalUrl}`;
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