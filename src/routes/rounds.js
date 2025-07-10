import { Router } from 'express';
import { db } from '../services/database.js';
import { redisClient, cache, pubsub } from '../services/redis.js';
import { courseDatabase } from '../services/courseDatabase.js';
import { validateScore } from '../utils/validators.js';
import { authenticate } from '../middleware/authenticate.js';
import { logger } from '../utils/logger.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create new round
router.post('/', async (req, res) => {
  try {
    const { courseId, players = [] } = req.body;
    const userId = req.user.id;
    
    // Verify course exists
    const course = await courseDatabase.getById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Create round in database
    const [round] = await db.query`
      INSERT INTO rounds (course_id, created_by)
      VALUES (${courseId}, ${userId})
      RETURNING id, course_id, created_by, started_at
    `;
    
    // Add creator as player
    const allPlayers = [userId, ...players.filter(p => p !== userId)];
    
    // Add players to round
    for (const playerId of allPlayers) {
      await db.query`
        INSERT INTO round_players (round_id, user_id)
        VALUES (${round.id}, ${playerId})
      `;
    }
    
    // Initialize round in Redis
    const roundData = {
      id: round.id,
      courseId,
      courseName: course.name,
      createdBy: userId,
      players: allPlayers,
      viewers: [],
      status: 'active',
      currentHole: 1,
      startedAt: round.started_at
    };
    
    await redisClient.hSet('rounds', round.id, JSON.stringify(roundData));
    await redisClient.hSet(`round:${round.id}:state`, {
      status: 'active',
      currentHole: '1',
      weather: JSON.stringify({ temp: 72, wind: 5, conditions: 'sunny' })
    });
    
    // Notify players
    await pubsub.publish('round:created', {
      roundId: round.id,
      players: allPlayers,
      course: course.name
    });
    
    res.status(201).json({
      round: {
        ...roundData,
        course
      }
    });
    
  } catch (error) {
    logger.error('Create round error:', error);
    res.status(500).json({ error: 'Failed to create round' });
  }
});

// Get active rounds for user
router.get('/active', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's active rounds
    const rounds = await db.query`
      SELECT 
        r.id,
        r.course_id,
        r.started_at,
        r.status,
        rp.completed_holes,
        rp.total_score
      FROM rounds r
      JOIN round_players rp ON r.id = rp.round_id
      WHERE rp.user_id = ${userId}
        AND r.status = 'active'
      ORDER BY r.started_at DESC
    `;
    
    // Enrich with course data
    const enrichedRounds = await Promise.all(
      rounds.map(async (round) => {
        const course = await courseDatabase.getById(round.course_id);
        const roundState = await redisClient.hGetAll(`round:${round.id}:state`);
        
        return {
          ...round,
          course,
          currentHole: parseInt(roundState.currentHole) || 1,
          players: await getRoundPlayers(round.id)
        };
      })
    );
    
    res.json({ rounds: enrichedRounds });
    
  } catch (error) {
    logger.error('Get active rounds error:', error);
    res.status(500).json({ error: 'Failed to get active rounds' });
  }
});

// Get round details
router.get('/:roundId', async (req, res) => {
  try {
    const { roundId } = req.params;
    const userId = req.user.id;
    
    // Check access
    const hasAccess = await verifyRoundAccess(userId, roundId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get round data
    const [round] = await db.query`
      SELECT * FROM rounds WHERE id = ${roundId}
    `;
    
    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }
    
    // Get course
    const course = await courseDatabase.getById(round.course_id);
    
    // Get players and scores
    const players = await getRoundPlayers(roundId);
    const leaderboard = await getLeaderboard(roundId);
    
    // Get round state from Redis
    const roundState = await redisClient.hGetAll(`round:${roundId}:state`);
    
    res.json({
      round: {
        ...round,
        course,
        players,
        leaderboard,
        currentHole: parseInt(roundState.currentHole) || 1,
        weather: JSON.parse(roundState.weather || '{}')
      }
    });
    
  } catch (error) {
    logger.error('Get round error:', error);
    res.status(500).json({ error: 'Failed to get round' });
  }
});

// Submit score
router.post('/:roundId/scores', async (req, res) => {
  try {
    const { roundId } = req.params;
    const userId = req.user.id;
    const { hole, score, putts, fairwayHit, gir, penalties = 0 } = req.body;
    
    // Validate access
    const hasAccess = await verifyRoundAccess(userId, roundId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get hole par
    const [round] = await db.query`SELECT course_id FROM rounds WHERE id = ${roundId}`;
    const holeDetails = await courseDatabase.getHoleDetails(round.course_id, hole);
    
    // Validate score
    if (!validateScore(score, holeDetails.par)) {
      return res.status(400).json({ error: 'Invalid score' });
    }
    
    // Store in database
    await db.query`
      INSERT INTO scores (round_id, user_id, hole_number, score, putts, fairway_hit, green_in_regulation, penalties)
      VALUES (${roundId}, ${userId}, ${hole}, ${score}, ${putts}, ${fairwayHit}, ${gir}, ${penalties})
      ON CONFLICT (round_id, user_id, hole_number)
      DO UPDATE SET 
        score = ${score},
        putts = ${putts},
        fairway_hit = ${fairwayHit},
        green_in_regulation = ${gir},
        penalties = ${penalties},
        created_at = NOW()
    `;
    
    // Update round player stats
    await db.query`
      UPDATE round_players
      SET 
        total_score = (SELECT SUM(score) FROM scores WHERE round_id = ${roundId} AND user_id = ${userId}),
        total_putts = (SELECT SUM(putts) FROM scores WHERE round_id = ${roundId} AND user_id = ${userId}),
        completed_holes = (SELECT COUNT(*) FROM scores WHERE round_id = ${roundId} AND user_id = ${userId})
      WHERE round_id = ${roundId} AND user_id = ${userId}
    `;
    
    // Store in Redis for real-time
    const scoreData = {
      userId,
      hole,
      score,
      par: holeDetails.par,
      relativeToPar: score - holeDetails.par,
      putts,
      gir,
      timestamp: new Date().toISOString()
    };
    
    await redisClient.lPush(
      `round:${roundId}:player:${userId}:scores`,
      JSON.stringify(scoreData)
    );
    
    // Update stats
    await redisClient.hIncrBy(`round:${roundId}:player:${userId}:stats`, 'totalScore', score);
    await redisClient.hIncrBy(`round:${roundId}:player:${userId}:stats`, 'totalPutts', putts || 0);
    await redisClient.hSet(`round:${roundId}:player:${userId}:stats`, 'currentHole', hole + 1);
    
    // Trigger MCP analytics
    await triggerAnalytics('score', { userId, roundId, ...scoreData });
    
    // Get updated leaderboard
    const leaderboard = await getLeaderboard(roundId);
    
    res.json({
      score: scoreData,
      leaderboard
    });
    
  } catch (error) {
    logger.error('Submit score error:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

// Complete round
router.post('/:roundId/complete', async (req, res) => {
  try {
    const { roundId } = req.params;
    const userId = req.user.id;
    
    // Verify creator
    const [round] = await db.query`
      SELECT created_by FROM rounds WHERE id = ${roundId}
    `;
    
    if (round.created_by !== userId) {
      return res.status(403).json({ error: 'Only round creator can complete the round' });
    }
    
    // Update round status
    await db.query`
      UPDATE rounds 
      SET status = 'completed', completed_at = NOW()
      WHERE id = ${roundId}
    `;
    
    // Update Redis
    await redisClient.hSet(`round:${roundId}:state`, 'status', 'completed');
    
    // Trigger round completion analytics
    const players = await getRoundPlayers(roundId);
    for (const player of players) {
      await triggerAnalytics('round_complete', {
        userId: player.id,
        roundId
      });
    }
    
    // Get final results
    const finalResults = await getFinalResults(roundId);
    
    res.json({
      message: 'Round completed',
      results: finalResults
    });
    
  } catch (error) {
    logger.error('Complete round error:', error);
    res.status(500).json({ error: 'Failed to complete round' });
  }
});

// Helper functions
async function verifyRoundAccess(userId, roundId) {
  const round = await redisClient.hGet('rounds', roundId);
  if (!round) {
    // Check database
    const [dbRound] = await db.query`
      SELECT 1 FROM round_players 
      WHERE round_id = ${roundId} AND user_id = ${userId}
    `;
    return !!dbRound;
  }
  
  const roundData = JSON.parse(round);
  return roundData.players.includes(userId) || roundData.viewers.includes(userId);
}

async function getRoundPlayers(roundId) {
  const players = await db.query`
    SELECT 
      u.id,
      u.name,
      u.avatar_url,
      u.handicap,
      rp.total_score,
      rp.completed_holes
    FROM round_players rp
    JOIN users u ON rp.user_id = u.id
    WHERE rp.round_id = ${roundId}
  `;
  
  return players;
}

async function getLeaderboard(roundId) {
  const players = await getRoundPlayers(roundId);
  
  const leaderboard = await Promise.all(
    players.map(async (player) => {
      const stats = await redisClient.hGetAll(`round:${roundId}:player:${player.id}:stats`);
      
      return {
        ...player,
        totalScore: parseInt(stats.totalScore) || player.total_score || 0,
        currentHole: parseInt(stats.currentHole) || 1,
        totalPutts: parseInt(stats.totalPutts) || 0,
        trend: await calculateTrend(roundId, player.id)
      };
    })
  );
  
  return leaderboard.sort((a, b) => a.totalScore - b.totalScore);
}

async function calculateTrend(roundId, playerId) {
  const scores = await redisClient.lRange(
    `round:${roundId}:player:${playerId}:scores`,
    0,
    2
  );
  
  if (scores.length < 3) return 'neutral';
  
  const recent = scores.map(s => JSON.parse(s).relativeToPar);
  return recent[0] < recent[2] ? 'improving' : 
         recent[0] > recent[2] ? 'declining' : 'neutral';
}

async function getFinalResults(roundId) {
  const leaderboard = await getLeaderboard(roundId);
  
  // Calculate additional stats
  const results = await Promise.all(
    leaderboard.map(async (player) => {
      const scores = await db.query`
        SELECT * FROM scores 
        WHERE round_id = ${roundId} AND user_id = ${player.id}
        ORDER BY hole_number
      `;
      
      const birdies = scores.filter(s => s.score < s.par).length;
      const pars = scores.filter(s => s.score === s.par).length;
      const bogeys = scores.filter(s => s.score > s.par).length;
      
      return {
        ...player,
        birdies,
        pars,
        bogeys,
        scorecard: scores
      };
    })
  );
  
  return results;
}

async function triggerAnalytics(eventType, data) {
  // Trigger MCP analytics collection
  try {
    await fetch(`http://localhost:${process.env.MCP_SERVER_PORT}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, data })
    });
  } catch (error) {
    logger.error('Analytics trigger error:', error);
  }
}

export { router as roundRouter };