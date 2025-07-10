import { Router } from 'express';
import { db } from '../services/database.js';
import { cache, redisClient } from '../services/redis.js';
import { authenticate } from '../middleware/authenticate.js';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcrypt';
import { validatePassword } from '../utils/validators.js';

const router = Router();

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get full profile with stats
    const [user] = await db.query`
      SELECT 
        id, email, name, avatar_url, handicap, 
        created_at, last_login, settings
      FROM users
      WHERE id = ${userId}
    `;
    
    // Get lifetime stats
    const lifetimeStats = await redisClient.hGetAll(`user:${userId}:lifetime_stats`);
    
    // Get pride points
    const pridePoints = await redisClient.hGetAll(`user:${userId}:pride`);
    
    // Get recent rounds
    const recentRounds = await db.query`
      SELECT 
        r.id, r.course_id, r.started_at, r.completed_at,
        rp.total_score, rp.completed_holes
      FROM rounds r
      JOIN round_players rp ON r.id = rp.round_id
      WHERE rp.user_id = ${userId}
      ORDER BY r.started_at DESC
      LIMIT 10
    `;
    
    res.json({
      user: {
        ...user,
        stats: {
          roundsPlayed: parseInt(lifetimeStats.roundsPlayed) || 0,
          scoringAverage: parseFloat(lifetimeStats.scoringAverage) || 0,
          totalBirdies: parseInt(lifetimeStats.totalBirdies) || 0,
          totalEagles: parseInt(lifetimeStats.totalEagles) || 0,
          bestRound: parseInt(lifetimeStats.bestRound) || 0
        },
        pridePoints: {
          balance: parseInt(pridePoints.balance) || 1000,
          totalWagered: parseInt(pridePoints.wagered) || 0,
          totalWon: parseInt(pridePoints.won) || 0
        },
        recentRounds
      }
    });
    
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, handicap, avatarUrl } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (handicap !== undefined) updates.handicap = handicap;
    if (avatarUrl) updates.avatar_url = avatarUrl;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    // Update database
    const [updated] = await db.query`
      UPDATE users
      SET ${db(updates)}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, email, name, avatar_url, handicap
    `;
    
    // Clear cache
    await cache.del(`user:${userId}:info`);
    
    res.json({ user: updated });
    
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/password', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!validatePassword(newPassword)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      });
    }
    
    // Verify current password
    const [user] = await db.query`
      SELECT password_hash FROM users WHERE id = ${userId}
    `;
    
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db.query`
      UPDATE users 
      SET password_hash = ${passwordHash}, updated_at = NOW()
      WHERE id = ${userId}
    `;
    
    res.json({ message: 'Password updated successfully' });
    
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get friends list
router.get('/friends', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get accepted friends
    const friends = await db.query`
      SELECT 
        u.id, u.name, u.avatar_url, u.handicap,
        f.created_at as friends_since
      FROM friendships f
      JOIN users u ON (
        CASE 
          WHEN f.user_id = ${userId} THEN f.friend_id = u.id
          WHEN f.friend_id = ${userId} THEN f.user_id = u.id
        END
      )
      WHERE (f.user_id = ${userId} OR f.friend_id = ${userId})
        AND f.status = 'accepted'
      ORDER BY u.name
    `;
    
    // Get pending requests
    const pendingRequests = await db.query`
      SELECT 
        u.id, u.name, u.avatar_url,
        f.created_at as requested_at
      FROM friendships f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = ${userId}
        AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `;
    
    res.json({
      friends,
      pendingRequests
    });
    
  } catch (error) {
    logger.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

// Send friend request
router.post('/friends/request', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;
    
    if (userId === friendId) {
      return res.status(400).json({ error: 'Cannot add yourself as friend' });
    }
    
    // Check if friend exists
    const [friend] = await db.query`
      SELECT id, name FROM users WHERE id = ${friendId}
    `;
    
    if (!friend) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check existing friendship
    const [existing] = await db.query`
      SELECT status FROM friendships
      WHERE (user_id = ${userId} AND friend_id = ${friendId})
         OR (user_id = ${friendId} AND friend_id = ${userId})
    `;
    
    if (existing) {
      return res.status(409).json({ 
        error: existing.status === 'accepted' ? 'Already friends' : 'Request already sent' 
      });
    }
    
    // Create friend request
    await db.query`
      INSERT INTO friendships (user_id, friend_id, status)
      VALUES (${userId}, ${friendId}, 'pending')
    `;
    
    // TODO: Send notification to friend
    
    res.status(201).json({ 
      message: 'Friend request sent',
      friend: { id: friend.id, name: friend.name }
    });
    
  } catch (error) {
    logger.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Accept/reject friend request
router.put('/friends/request/:requesterId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { requesterId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    // Find pending request
    const [request] = await db.query`
      SELECT id FROM friendships
      WHERE user_id = ${requesterId} 
        AND friend_id = ${userId}
        AND status = 'pending'
    `;
    
    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }
    
    if (action === 'accept') {
      // Accept request
      await db.query`
        UPDATE friendships
        SET status = 'accepted', accepted_at = NOW()
        WHERE id = ${request.id}
      `;
      
      res.json({ message: 'Friend request accepted' });
    } else {
      // Reject request
      await db.query`
        DELETE FROM friendships WHERE id = ${request.id}
      `;
      
      res.json({ message: 'Friend request rejected' });
    }
    
  } catch (error) {
    logger.error('Handle friend request error:', error);
    res.status(500).json({ error: 'Failed to handle friend request' });
  }
});

// Search users
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const userId = req.user.id;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query too short' });
    }
    
    // Search by name or email
    const users = await db.query`
      SELECT id, name, avatar_url, handicap
      FROM users
      WHERE id != ${userId}
        AND is_active = true
        AND (
          name ILIKE ${'%' + q + '%'}
          OR email ILIKE ${'%' + q + '%'}
        )
      LIMIT ${parseInt(limit)}
    `;
    
    res.json({ users });
    
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Get user stats
router.get('/stats/:userId?', authenticate, async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.id;
    
    // Check if viewing own stats or friend's stats
    if (targetUserId !== req.user.id) {
      const isFriend = await checkFriendship(req.user.id, targetUserId);
      if (!isFriend) {
        return res.status(403).json({ error: 'Can only view friend stats' });
      }
    }
    
    // Get comprehensive stats
    const stats = await getUserStats(targetUserId);
    
    res.json({ stats });
    
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Update settings
router.put('/settings', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { settings } = req.body;
    
    // Validate settings structure
    const allowedSettings = [
      'notifications',
      'privacy',
      'display',
      'gameplay'
    ];
    
    const validSettings = {};
    for (const key of allowedSettings) {
      if (settings[key] !== undefined) {
        validSettings[key] = settings[key];
      }
    }
    
    // Update settings
    await db.query`
      UPDATE users
      SET settings = settings || ${JSON.stringify(validSettings)}::jsonb,
          updated_at = NOW()
      WHERE id = ${userId}
    `;
    
    res.json({ message: 'Settings updated', settings: validSettings });
    
  } catch (error) {
    logger.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Helper functions
async function checkFriendship(userId1, userId2) {
  const [friendship] = await db.query`
    SELECT 1 FROM friendships
    WHERE ((user_id = ${userId1} AND friend_id = ${userId2})
        OR (user_id = ${userId2} AND friend_id = ${userId1}))
      AND status = 'accepted'
  `;
  
  return !!friendship;
}

async function getUserStats(userId) {
  // Get from Redis first
  const cachedStats = await cache.get(`user:${userId}:detailed_stats`);
  if (cachedStats) return cachedStats;
  
  // Calculate detailed stats
  const rounds = await db.query`
    SELECT 
      r.id,
      r.course_id,
      r.started_at,
      rp.total_score,
      rp.completed_holes
    FROM rounds r
    JOIN round_players rp ON r.id = rp.round_id
    WHERE rp.user_id = ${userId}
      AND r.status = 'completed'
    ORDER BY r.started_at DESC
    LIMIT 20
  `;
  
  const scores = await db.query`
    SELECT 
      s.score,
      s.hole_number,
      s.putts,
      s.fairway_hit,
      s.green_in_regulation
    FROM scores s
    JOIN rounds r ON s.round_id = r.id
    WHERE s.user_id = ${userId}
      AND r.status = 'completed'
  `;
  
  // Calculate stats
  const stats = {
    roundsPlayed: rounds.length,
    averageScore: rounds.length > 0 
      ? rounds.reduce((sum, r) => sum + r.total_score, 0) / rounds.length 
      : 0,
    bestRound: rounds.length > 0 
      ? Math.min(...rounds.map(r => r.total_score)) 
      : 0,
    averagePutts: scores.length > 0
      ? scores.reduce((sum, s) => sum + (s.putts || 0), 0) / scores.length
      : 0,
    fairwayAccuracy: scores.filter(s => s.fairway_hit !== null).length > 0
      ? (scores.filter(s => s.fairway_hit).length / scores.filter(s => s.fairway_hit !== null).length) * 100
      : 0,
    girPercentage: scores.filter(s => s.green_in_regulation !== null).length > 0
      ? (scores.filter(s => s.green_in_regulation).length / scores.filter(s => s.green_in_regulation !== null).length) * 100
      : 0,
    scoringDistribution: calculateScoringDistribution(scores),
    recentForm: rounds.slice(0, 5).map(r => ({
      date: r.started_at,
      score: r.total_score,
      courseId: r.course_id
    }))
  };
  
  // Cache for 1 hour
  await cache.set(`user:${userId}:detailed_stats`, stats, 3600);
  
  return stats;
}

function calculateScoringDistribution(scores) {
  const distribution = {
    eagles: 0,
    birdies: 0,
    pars: 0,
    bogeys: 0,
    doublePlus: 0
  };
  
  // This is simplified - in production, would need par data for each hole
  scores.forEach(score => {
    const relativeToPar = score.score - 4; // Assuming par 4 average
    
    if (relativeToPar <= -2) distribution.eagles++;
    else if (relativeToPar === -1) distribution.birdies++;
    else if (relativeToPar === 0) distribution.pars++;
    else if (relativeToPar === 1) distribution.bogeys++;
    else distribution.doublePlus++;
  });
  
  return distribution;
}

export { router as userRouter };