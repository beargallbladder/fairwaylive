import { rateLimiting } from '../services/redis.js';
import { logger } from '../utils/logger.js';

// Rate limiter middleware
export async function rateLimiter(req, res, next) {
  try {
    // Skip rate limiting in development
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    // Different limits for different endpoints
    const limits = {
      '/api/auth/login': { limit: 5, window: 300 }, // 5 attempts per 5 minutes
      '/api/auth/register': { limit: 3, window: 3600 }, // 3 per hour
      '/api/auth/forgot-password': { limit: 3, window: 3600 }, // 3 per hour
      '/api/voice/upload': { limit: 30, window: 60 }, // 30 per minute
      default: { limit: 100, window: 60 } // 100 per minute default
    };
    
    // Get rate limit config for endpoint
    const endpoint = req.path;
    const config = limits[endpoint] || limits.default;
    
    // Create rate limit key
    const identifier = req.user?.id || req.ip;
    const key = `rate:${endpoint}:${identifier}`;
    
    // Check rate limit
    const result = await rateLimiting.check(key, config.limit, config.window);
    
    // Set headers
    res.setHeader('X-RateLimit-Limit', config.limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Date.now() + (config.window * 1000));
    
    if (!result.allowed) {
      logger.warn('Rate limit exceeded', {
        endpoint,
        identifier,
        limit: config.limit
      });
      
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: config.window
      });
    }
    
    next();
  } catch (error) {
    logger.error('Rate limiter error:', error);
    // Don't block requests if rate limiter fails
    next();
  }
}