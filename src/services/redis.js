import { createClient } from 'redis';
import { logger } from '../utils/logger.js';

let redisClient;

export async function initializeRedis() {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection limit reached');
            return new Error('Too many retries');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });
    
    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });
    
    redisClient.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });
    
    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    
    return redisClient;
  } catch (error) {
    logger.error('Redis initialization failed:', error);
    throw error;
  }
}

// Helper functions for common operations
export const cache = {
  get: async (key) => {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },
  
  set: async (key, value, ttl = 3600) => {
    try {
      await redisClient.set(key, JSON.stringify(value), {
        EX: ttl
      });
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  },
  
  del: async (key) => {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  },
  
  invalidatePattern: async (pattern) => {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache invalidate error:', error);
      return false;
    }
  }
};

// Pub/Sub helpers
export const pubsub = {
  publish: async (channel, message) => {
    try {
      await redisClient.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error('Publish error:', error);
      return false;
    }
  },
  
  subscribe: async (channel, callback) => {
    try {
      const subscriber = redisClient.duplicate();
      await subscriber.connect();
      
      await subscriber.subscribe(channel, (message) => {
        try {
          const data = JSON.parse(message);
          callback(data);
        } catch (error) {
          logger.error('Subscribe callback error:', error);
        }
      });
      
      return subscriber;
    } catch (error) {
      logger.error('Subscribe error:', error);
      return null;
    }
  }
};

// Session management
export const sessions = {
  create: async (userId, sessionData, ttl = 86400) => {
    const sessionId = `session:${userId}:${Date.now()}`;
    await redisClient.set(sessionId, JSON.stringify({
      userId,
      ...sessionData,
      createdAt: new Date().toISOString()
    }), { EX: ttl });
    return sessionId;
  },
  
  get: async (sessionId) => {
    const data = await redisClient.get(sessionId);
    return data ? JSON.parse(data) : null;
  },
  
  extend: async (sessionId, ttl = 86400) => {
    await redisClient.expire(sessionId, ttl);
  },
  
  destroy: async (sessionId) => {
    await redisClient.del(sessionId);
  }
};

// Rate limiting
export const rateLimiting = {
  check: async (key, limit, window = 60) => {
    const current = await redisClient.incr(key);
    
    if (current === 1) {
      await redisClient.expire(key, window);
    }
    
    return {
      allowed: current <= limit,
      current,
      limit,
      remaining: Math.max(0, limit - current)
    };
  }
};

export { redisClient };