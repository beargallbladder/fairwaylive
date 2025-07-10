import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validatePridePoints } from '../utils/validators.js';
import { mcpServer } from '../mcp/server.js';
import { logger } from '../utils/logger.js';
import { db } from '../services/database.js';
import { redisClient } from '../services/redis.js';

const router = Router();

// All betting routes require authentication
router.use(authenticate);

// Get user's pride points balance
router.get('/balance', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Use MCP betting engine to get balance
    const result = await mcpServer.executeTool('manage_pride_bets', {
      action: 'get_balance',
      betData: { userId }
    });
    
    res.json({ 
      balance: result.balance || 1000,
      stats: result.stats || {}
    });
    
  } catch (error) {
    logger.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// Place a bet
router.post('/place', async (req, res) => {
  try {
    const userId = req.user.id;
    const { roundId, betType, amount, target, prediction } = req.body;
    
    // Validate bet amount
    if (!validatePridePoints(amount)) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }
    
    // Validate bet type
    const validBetTypes = ['make_putt', 'hole_score', 'match_winner', 'longest_drive', 'closest_pin', 'streak'];
    if (!validBetTypes.includes(betType)) {
      return res.status(400).json({ error: 'Invalid bet type' });
    }
    
    // Use MCP betting engine to place bet
    const result = await mcpServer.executeTool('manage_pride_bets', {
      action: 'place_bet',
      betData: {
        userId,
        roundId,
        betType,
        amount,
        target,
        prediction
      }
    });
    
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    
    res.status(201).json({
      bet: result.bet,
      newBalance: result.newBalance
    });
    
  } catch (error) {
    logger.error('Place bet error:', error);
    res.status(500).json({ error: 'Failed to place bet' });
  }
});

// Get betting odds
router.get('/odds', async (req, res) => {
  try {
    const { betType, target, prediction } = req.query;
    
    if (!betType) {
      return res.status(400).json({ error: 'Bet type required' });
    }
    
    // Use MCP betting engine to calculate odds
    const result = await mcpServer.executeTool('manage_pride_bets', {
      action: 'get_odds',
      betData: {
        betType,
        target,
        prediction
      }
    });
    
    res.json({
      betType,
      target,
      prediction,
      odds: result.odds,
      probability: result.probability
    });
    
  } catch (error) {
    logger.error('Get odds error:', error);
    res.status(500).json({ error: 'Failed to get odds' });
  }
});

// Get round betting leaderboard
router.get('/rounds/:roundId/leaderboard', async (req, res) => {
  try {
    const { roundId } = req.params;
    
    // Use MCP betting engine to get leaderboard
    const result = await mcpServer.executeTool('manage_pride_bets', {
      action: 'leaderboard',
      betData: { roundId }
    });
    
    res.json({
      leaderboard: result.leaderboard,
      totalPot: result.totalPot
    });
    
  } catch (error) {
    logger.error('Get betting leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Get user's betting history
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;
    
    // Get betting history from database
    const bets = await db.query`
      SELECT 
        b.*,
        r.course_id,
        u.name as target_name
      FROM bets b
      JOIN rounds r ON b.round_id = r.id
      LEFT JOIN users u ON b.target = u.id::text
      WHERE b.user_id = ${userId}
      ORDER BY b.created_at DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${parseInt(offset)}
    `;
    
    res.json({ bets });
    
  } catch (error) {
    logger.error('Get betting history error:', error);
    res.status(500).json({ error: 'Failed to get betting history' });
  }
});

// Get available bet types for a round
router.get('/rounds/:roundId/available', async (req, res) => {
  try {
    const { roundId } = req.params;
    
    // Get round details to determine available bets
    const round = await redisClient.hGet('rounds', roundId);
    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }
    
    const roundData = JSON.parse(round);
    const currentHole = parseInt(roundData.currentHole) || 1;
    
    // Define available bets based on round state
    const availableBets = [
      {
        type: 'make_putt',
        name: 'Make This Putt',
        description: 'Bet on whether a player will make their current putt',
        minOdds: 1.2,
        maxOdds: 5.0
      },
      {
        type: 'hole_score',
        name: 'Hole Score',
        description: 'Predict the exact score on a hole',
        minOdds: 2.0,
        maxOdds: 10.0
      },
      {
        type: 'match_winner',
        name: 'Match Winner',
        description: 'Bet on who will win the round',
        minOdds: 1.5,
        maxOdds: 8.0
      }
    ];
    
    // Add special bets for certain holes
    if (currentHole % 3 === 0) {
      availableBets.push({
        type: 'longest_drive',
        name: 'Longest Drive',
        description: 'Bet on who will hit the longest drive',
        minOdds: 3.0,
        maxOdds: 5.0
      });
    }
    
    if ([3, 7, 12, 15].includes(currentHole)) {
      availableBets.push({
        type: 'closest_pin',
        name: 'Closest to Pin',
        description: 'Bet on who will hit closest to the pin',
        minOdds: 2.5,
        maxOdds: 4.5
      });
    }
    
    res.json({ 
      availableBets,
      currentHole,
      players: roundData.players
    });
    
  } catch (error) {
    logger.error('Get available bets error:', error);
    res.status(500).json({ error: 'Failed to get available bets' });
  }
});

// Resolve a bet (admin/automated)
router.post('/resolve/:betId', async (req, res) => {
  try {
    const { betId } = req.params;
    const { outcome } = req.body;
    
    // In production, this would be automated or admin-only
    // For now, check if user owns the bet
    const [bet] = await db.query`
      SELECT * FROM bets WHERE id = ${betId}
    `;
    
    if (!bet) {
      return res.status(404).json({ error: 'Bet not found' });
    }
    
    if (bet.status !== 'pending') {
      return res.status(400).json({ error: 'Bet already resolved' });
    }
    
    // Use MCP betting engine to resolve bet
    const result = await mcpServer.executeTool('manage_pride_bets', {
      action: 'resolve_bet',
      betData: {
        betId,
        roundId: bet.round_id,
        outcome
      }
    });
    
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    
    res.json({
      bet: result.bet,
      won: result.won,
      winnings: result.winnings
    });
    
  } catch (error) {
    logger.error('Resolve bet error:', error);
    res.status(500).json({ error: 'Failed to resolve bet' });
  }
});

export { router as bettingRouter };