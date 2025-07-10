import jwt from 'jsonwebtoken';
import { db } from '../services/database.js';
import { cache } from '../services/redis.js';
import { logger } from '../utils/logger.js';

export async function authenticate(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active (with caching)
    const cacheKey = `user:${decoded.userId}:info`;
    let user = await cache.get(cacheKey);
    
    if (!user) {
      // Get from database
      const [dbUser] = await db.query`
        SELECT id, email, name, avatar_url, handicap, is_active
        FROM users
        WHERE id = ${decoded.userId}
      `;
      
      if (!dbUser || !dbUser.is_active) {
        return res.status(401).json({ error: 'Invalid user' });
      }
      
      user = dbUser;
      
      // Cache for 5 minutes
      await cache.set(cacheKey, user, 300);
    }
    
    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      handicap: user.handicap
    };
    
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Optional authentication (doesn't fail if no token)
export async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Try to get user info
      const cacheKey = `user:${decoded.userId}:info`;
      let user = await cache.get(cacheKey);
      
      if (!user) {
        const [dbUser] = await db.query`
          SELECT id, email, name, avatar_url, handicap, is_active
          FROM users
          WHERE id = ${decoded.userId} AND is_active = true
        `;
        
        if (dbUser) {
          user = dbUser;
          await cache.set(cacheKey, user, 300);
        }
      }
      
      if (user) {
        req.user = user;
      }
    }
    
    next();
    
  } catch (error) {
    // Just continue without user
    next();
  }
}