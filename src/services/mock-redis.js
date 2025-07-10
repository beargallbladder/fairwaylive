// Mock Redis for development
import { logger } from '../utils/logger.js';

const store = new Map();
const expiry = new Map();

export async function initializeRedis() {
    logger.info('Using mock Redis (development mode)');
    return mockRedisClient;
}

export const mockRedisClient = {
    connect: async () => true,
    ping: async () => 'PONG',
    
    get: async (key) => {
        if (expiry.has(key) && Date.now() > expiry.get(key)) {
            store.delete(key);
            expiry.delete(key);
            return null;
        }
        return store.get(key) || null;
    },
    
    set: async (key, value, options) => {
        store.set(key, value);
        if (options?.EX) {
            expiry.set(key, Date.now() + (options.EX * 1000));
        }
        return 'OK';
    },
    
    del: async (key) => {
        store.delete(key);
        expiry.delete(key);
        return 1;
    },
    
    hSet: async (key, field, value) => {
        const hash = store.get(key) || {};
        if (typeof field === 'object') {
            Object.assign(hash, field);
        } else {
            hash[field] = value;
        }
        store.set(key, hash);
        return 1;
    },
    
    hGet: async (key, field) => {
        const hash = store.get(key) || {};
        return hash[field] || null;
    },
    
    hGetAll: async (key) => {
        return store.get(key) || {};
    },
    
    hIncrBy: async (key, field, increment) => {
        const hash = store.get(key) || {};
        hash[field] = (parseInt(hash[field]) || 0) + increment;
        store.set(key, hash);
        return hash[field];
    },
    
    lPush: async (key, ...values) => {
        const list = store.get(key) || [];
        list.unshift(...values);
        store.set(key, list);
        return list.length;
    },
    
    lRange: async (key, start, stop) => {
        const list = store.get(key) || [];
        return list.slice(start, stop === -1 ? undefined : stop + 1);
    },
    
    sAdd: async (key, ...members) => {
        const set = store.get(key) || new Set();
        members.forEach(m => set.add(m));
        store.set(key, set);
        return members.length;
    },
    
    sMembers: async (key) => {
        const set = store.get(key) || new Set();
        return Array.from(set);
    },
    
    keys: async (pattern) => {
        // Simple pattern matching
        const regex = new RegExp(pattern.replace('*', '.*'));
        return Array.from(store.keys()).filter(k => regex.test(k));
    },
    
    expire: async (key, seconds) => {
        if (store.has(key)) {
            expiry.set(key, Date.now() + (seconds * 1000));
            return 1;
        }
        return 0;
    },
    
    incr: async (key) => {
        const val = parseInt(store.get(key) || 0) + 1;
        store.set(key, val.toString());
        return val;
    }
};

// Mock cache helpers
export const cache = {
    get: async (key) => {
        try {
            const value = await mockRedisClient.get(key);
            return value ? JSON.parse(value) : null;
        } catch {
            return null;
        }
    },
    
    set: async (key, value, ttl = 3600) => {
        await mockRedisClient.set(key, JSON.stringify(value), { EX: ttl });
        return true;
    },
    
    del: async (key) => {
        await mockRedisClient.del(key);
        return true;
    }
};

export const pubsub = {
    publish: async (channel, message) => {
        logger.debug(`Mock publish to ${channel}:`, message);
        return true;
    },
    
    subscribe: async (channel, callback) => {
        logger.debug(`Mock subscribe to ${channel}`);
        return { unsubscribe: () => {} };
    }
};

export const sessions = {
    create: async (userId, data) => {
        const sessionId = `session:${userId}:${Date.now()}`;
        await mockRedisClient.set(sessionId, JSON.stringify({ userId, ...data }));
        return sessionId;
    },
    
    get: async (sessionId) => {
        const data = await mockRedisClient.get(sessionId);
        return data ? JSON.parse(data) : null;
    }
};

export const rateLimiting = {
    check: async (key, limit, window = 60) => {
        const current = await mockRedisClient.incr(key);
        if (current === 1) {
            await mockRedisClient.expire(key, window);
        }
        return {
            allowed: current <= limit,
            current,
            limit,
            remaining: Math.max(0, limit - current)
        };
    }
};

export const redisClient = mockRedisClient;