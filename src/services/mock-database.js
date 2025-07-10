// Mock database for development without PostgreSQL
import { logger } from '../utils/logger.js';

const mockData = {
    users: new Map(),
    rounds: new Map(),
    scores: new Map()
};

export async function initializeDatabase() {
    logger.info('Using mock database (development mode)');
    return mockDb;
}

export const mockDb = {
    query: async (strings, ...values) => {
        // Simple mock query handler
        const query = strings.join('?');
        
        if (query.includes('SELECT 1')) {
            return [{ '?column?': 1 }];
        }
        
        if (query.includes('CREATE TABLE')) {
            return [];
        }
        
        if (query.includes('CREATE INDEX')) {
            return [];
        }
        
        // Return empty array for most queries
        return [];
    },
    
    sql: (...args) => mockDb.query(...args)
};

export const db = mockDb;
export default db;