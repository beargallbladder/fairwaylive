import { db } from './database.js';
import { cache } from './redis.js';
import { logger } from '../utils/logger.js';

// Sample course data - in production, this would come from a golf course API
const SAMPLE_COURSES = [
  {
    id: 'pebble-beach',
    name: 'Pebble Beach Golf Links',
    location: 'Pebble Beach, CA',
    latitude: 36.5680,
    longitude: -121.9506,
    holes: 18,
    par: 72,
    rating: 75.5,
    slope: 145,
    teeBoxes: generateTeeBoxes(36.5680, -121.9506, 18)
  },
  {
    id: 'augusta-national',
    name: 'Augusta National Golf Club',
    location: 'Augusta, GA',
    latitude: 33.5020,
    longitude: -82.0220,
    holes: 18,
    par: 72,
    rating: 78.1,
    slope: 137,
    teeBoxes: generateTeeBoxes(33.5020, -82.0220, 18)
  },
  {
    id: 'st-andrews-old',
    name: 'St Andrews - Old Course',
    location: 'St Andrews, Scotland',
    latitude: 56.3433,
    longitude: -2.8026,
    holes: 18,
    par: 72,
    rating: 75.1,
    slope: 140,
    teeBoxes: generateTeeBoxes(56.3433, -2.8026, 18)
  }
];

function generateTeeBoxes(baseLat, baseLng, holes) {
  const teeBoxes = [];
  for (let i = 1; i <= holes; i++) {
    // Generate tee box positions in a rough layout
    const angle = (i - 1) * (360 / holes) * (Math.PI / 180);
    const distance = 0.001 + (Math.random() * 0.002); // ~100-300m variation
    
    teeBoxes.push({
      hole: i,
      latitude: baseLat + (Math.sin(angle) * distance),
      longitude: baseLng + (Math.cos(angle) * distance),
      par: Math.random() < 0.2 ? 3 : Math.random() < 0.7 ? 4 : 5,
      yardage: Math.random() < 0.2 ? 150 + Math.random() * 50 : 
               Math.random() < 0.7 ? 350 + Math.random() * 100 : 
               500 + Math.random() * 50
    });
  }
  return teeBoxes;
}

export const courseDatabase = {
  // Find courses near a location
  findNearby: async (latitude, longitude, radiusMeters = 5000) => {
    try {
      // Check cache first
      const cacheKey = `courses:nearby:${latitude.toFixed(3)},${longitude.toFixed(3)}:${radiusMeters}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
      
      // For MVP, use sample data
      // In production, query a real golf course API or database
      const nearbyCourses = SAMPLE_COURSES.filter(course => {
        const distance = calculateDistance(
          latitude, longitude,
          course.latitude, course.longitude
        );
        return distance <= radiusMeters;
      });
      
      // Cache for 1 hour
      await cache.set(cacheKey, nearbyCourses, 3600);
      
      return nearbyCourses;
    } catch (error) {
      logger.error('Error finding nearby courses:', error);
      return [];
    }
  },
  
  // Get course by ID
  getById: async (courseId) => {
    try {
      // Check cache
      const cacheKey = `course:${courseId}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
      
      // Find in sample data
      const course = SAMPLE_COURSES.find(c => c.id === courseId);
      
      if (course) {
        // Cache for 24 hours
        await cache.set(cacheKey, course, 86400);
      }
      
      return course;
    } catch (error) {
      logger.error('Error getting course:', error);
      return null;
    }
  },
  
  // Search courses by name
  search: async (query, limit = 10) => {
    try {
      const searchTerm = query.toLowerCase();
      
      const results = SAMPLE_COURSES
        .filter(course => 
          course.name.toLowerCase().includes(searchTerm) ||
          course.location.toLowerCase().includes(searchTerm)
        )
        .slice(0, limit);
      
      return results;
    } catch (error) {
      logger.error('Error searching courses:', error);
      return [];
    }
  },
  
  // Get hole details
  getHoleDetails: async (courseId, holeNumber) => {
    try {
      const course = await courseDatabase.getById(courseId);
      if (!course) return null;
      
      const hole = course.teeBoxes.find(tb => tb.hole === holeNumber);
      if (!hole) return null;
      
      // Add more hole details (in production, from detailed course data)
      return {
        ...hole,
        hazards: generateHazards(hole),
        greenLocation: {
          latitude: hole.latitude + (Math.random() * 0.002 - 0.001),
          longitude: hole.longitude + (Math.random() * 0.002 - 0.001)
        }
      };
    } catch (error) {
      logger.error('Error getting hole details:', error);
      return null;
    }
  },
  
  // Import course data (admin function)
  importCourse: async (courseData) => {
    try {
      // Validate course data
      if (!courseData.id || !courseData.name || !courseData.latitude || !courseData.longitude) {
        throw new Error('Invalid course data');
      }
      
      // In production, store in database
      // For now, just log
      logger.info('Course import requested:', courseData.id);
      
      return { success: true, courseId: courseData.id };
    } catch (error) {
      logger.error('Error importing course:', error);
      return { success: false, error: error.message };
    }
  }
};

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in meters
}

// Generate hazards for a hole (simplified)
function generateHazards(hole) {
  const hazards = [];
  
  // Add some random hazards
  if (Math.random() > 0.5) {
    hazards.push({
      type: 'bunker',
      location: 'fairway',
      distance: hole.yardage * 0.6
    });
  }
  
  if (Math.random() > 0.7) {
    hazards.push({
      type: 'water',
      location: 'right',
      distance: hole.yardage * 0.7
    });
  }
  
  // Greenside bunkers
  hazards.push({
    type: 'bunker',
    location: 'greenside',
    count: Math.floor(Math.random() * 3) + 1
  });
  
  return hazards;
}