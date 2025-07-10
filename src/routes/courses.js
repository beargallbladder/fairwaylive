import { Router } from 'express';
import { courseDatabase } from '../services/courseDatabase.js';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Search courses
router.get('/search', optionalAuthenticate, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query too short' });
    }
    
    const courses = await courseDatabase.search(q, parseInt(limit));
    
    res.json({ courses });
    
  } catch (error) {
    logger.error('Search courses error:', error);
    res.status(500).json({ error: 'Failed to search courses' });
  }
});

// Get nearby courses
router.get('/nearby', authenticate, async (req, res) => {
  try {
    const { lat, lon, radius = 5000 } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const radiusMeters = parseInt(radius);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    
    const courses = await courseDatabase.findNearby(latitude, longitude, radiusMeters);
    
    res.json({ courses });
    
  } catch (error) {
    logger.error('Get nearby courses error:', error);
    res.status(500).json({ error: 'Failed to get nearby courses' });
  }
});

// Get course details
router.get('/:courseId', optionalAuthenticate, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await courseDatabase.getById(courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Add user-specific data if authenticated
    if (req.user) {
      // Get user's rounds at this course
      const userRounds = await db.query`
        SELECT 
          r.id,
          r.started_at,
          r.completed_at,
          rp.total_score
        FROM rounds r
        JOIN round_players rp ON r.id = rp.round_id
        WHERE r.course_id = ${courseId}
          AND rp.user_id = ${req.user.id}
          AND r.status = 'completed'
        ORDER BY r.started_at DESC
        LIMIT 10
      `;
      
      course.userHistory = {
        roundsPlayed: userRounds.length,
        bestScore: userRounds.length > 0 
          ? Math.min(...userRounds.map(r => r.total_score))
          : null,
        lastPlayed: userRounds[0]?.started_at || null
      };
    }
    
    res.json({ course });
    
  } catch (error) {
    logger.error('Get course details error:', error);
    res.status(500).json({ error: 'Failed to get course details' });
  }
});

// Get hole details
router.get('/:courseId/holes/:holeNumber', optionalAuthenticate, async (req, res) => {
  try {
    const { courseId, holeNumber } = req.params;
    
    const hole = await courseDatabase.getHoleDetails(courseId, parseInt(holeNumber));
    
    if (!hole) {
      return res.status(404).json({ error: 'Hole not found' });
    }
    
    res.json({ hole });
    
  } catch (error) {
    logger.error('Get hole details error:', error);
    res.status(500).json({ error: 'Failed to get hole details' });
  }
});

// Get popular courses
router.get('/popular', optionalAuthenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // In production, this would query based on play frequency
    // For now, return sample courses
    const courses = await courseDatabase.search('', parseInt(limit));
    
    res.json({ courses });
    
  } catch (error) {
    logger.error('Get popular courses error:', error);
    res.status(500).json({ error: 'Failed to get popular courses' });
  }
});

export { router as courseRouter };