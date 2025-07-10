import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../services/database.js';
import { cache, sessions } from '../services/redis.js';
import { validateEmail, validatePassword } from '../utils/validators.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate input
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      });
    }
    
    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }
    
    // Check if user exists
    const existingUser = await db.query`
      SELECT id FROM users WHERE email = ${email}
    `;
    
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const [user] = await db.query`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email}, ${passwordHash}, ${name})
      RETURNING id, email, name, created_at
    `;
    
    // Initialize user stats in Redis
    await cache.set(`user:${user.id}:pride`, { balance: 1000, wagered: 0, won: 0 });
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    // Create session
    const sessionId = await sessions.create(user.id, { 
      userAgent: req.headers['user-agent'],
      ip: req.ip 
    });
    
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token,
      sessionId
    });
    
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const [user] = await db.query`
      SELECT id, email, name, password_hash, is_active
      FROM users
      WHERE email = ${email}
    `;
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account deactivated' });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    await db.query`
      UPDATE users 
      SET last_login = NOW() 
      WHERE id = ${user.id}
    `;
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    // Create session
    const sessionId = await sessions.create(user.id, { 
      userAgent: req.headers['user-agent'],
      ip: req.ip 
    });
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token,
      sessionId
    });
    
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }
    
    // Get session
    const session = await sessions.get(sessionId);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    // Get user
    const [user] = await db.query`
      SELECT id, email, name, is_active
      FROM users
      WHERE id = ${session.userId}
    `;
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid user' });
    }
    
    // Generate new token
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    // Extend session
    await sessions.extend(sessionId);
    
    res.json({ token });
    
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (sessionId) {
      await sessions.destroy(sessionId);
    }
    
    res.json({ success: true });
    
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Verify token (for mobile app)
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data
    const [user] = await db.query`
      SELECT id, email, name, avatar_url, handicap
      FROM users
      WHERE id = ${decoded.userId}
    `;
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    res.json({ valid: true, user });
    
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user
    const [user] = await db.query`
      SELECT id, name FROM users WHERE email = ${email}
    `;
    
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If email exists, reset link has been sent' });
    }
    
    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Store reset token
    await cache.set(`password-reset:${resetToken}`, user.id, 3600);
    
    // TODO: Send email with reset link
    logger.info(`Password reset requested for user ${user.id}`);
    
    res.json({ message: 'If email exists, reset link has been sent' });
    
  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      });
    }
    
    // Verify token
    const userId = await cache.get(`password-reset:${token}`);
    if (!userId) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db.query`
      UPDATE users 
      SET password_hash = ${passwordHash}, updated_at = NOW()
      WHERE id = ${userId}
    `;
    
    // Delete reset token
    await cache.del(`password-reset:${token}`);
    
    res.json({ message: 'Password reset successful' });
    
  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

export { router as authRouter };