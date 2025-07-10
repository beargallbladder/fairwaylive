// Using simple distance calculation instead of turf
const distance = (point1, point2) => {
    const R = 6371000; // Earth's radius in meters
    const lat1 = point1[1] * Math.PI / 180;
    const lat2 = point2[1] * Math.PI / 180;
    const deltaLat = (point2[1] - point1[1]) * Math.PI / 180;
    const deltaLon = (point2[0] - point1[0]) * Math.PI / 180;
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
};

const point = (coords) => coords;
import { courseDatabase } from '../../services/courseDatabase.js';

export const courseDetectionTool = {
  name: 'detect_golf_course',
  description: 'Detect which golf course a user is at based on GPS coordinates',
  parameters: {
    type: 'object',
    properties: {
      latitude: { type: 'number' },
      longitude: { type: 'number' },
      accuracy: { type: 'number' }
    },
    required: ['latitude', 'longitude']
  },
  handler: async ({ latitude, longitude, accuracy = 50 }) => {
    try {
      const userLocation = point([longitude, latitude]);
      
      // Query nearby courses from database
      const nearbyCourses = await courseDatabase.findNearby(latitude, longitude, 5000); // 5km radius
      
      if (nearbyCourses.length === 0) {
        return {
          success: false,
          message: 'No golf courses found nearby'
        };
      }
      
      // Find closest course
      let closestCourse = null;
      let minDistance = Infinity;
      
      for (const course of nearbyCourses) {
        const courseLocation = point([course.longitude, course.latitude]);
        const dist = distance(userLocation, courseLocation, { units: 'meters' });
        
        if (dist < minDistance && dist < 1000) { // Within 1km
          minDistance = dist;
          closestCourse = course;
        }
      }
      
      if (!closestCourse) {
        return {
          success: false,
          message: 'Not close enough to any golf course'
        };
      }
      
      // Detect specific hole based on tee box locations
      const currentHole = await detectCurrentHole(latitude, longitude, closestCourse);
      
      return {
        success: true,
        course: {
          id: closestCourse.id,
          name: closestCourse.name,
          location: closestCourse.location,
          holes: closestCourse.holes,
          par: closestCourse.par
        },
        currentHole,
        distance: Math.round(minDistance),
        accuracy
      };
    } catch (error) {
      console.error('Course detection error:', error);
      return {
        success: false,
        message: 'Error detecting golf course',
        error: error.message
      };
    }
  }
};

async function detectCurrentHole(lat, lon, course) {
  const userLocation = point([lon, lat]);
  let closestHole = null;
  let minDistance = Infinity;
  
  for (const hole of course.holes) {
    if (hole.teeBox) {
      const teeLocation = point([hole.teeBox.longitude, hole.teeBox.latitude]);
      const dist = distance(userLocation, teeLocation, { units: 'meters' });
      
      if (dist < minDistance && dist < 100) { // Within 100m of tee box
        minDistance = dist;
        closestHole = hole.number;
      }
    }
  }
  
  return closestHole;
}