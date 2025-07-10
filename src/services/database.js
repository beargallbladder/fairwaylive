import postgres from 'postgres';
import { logger } from '../utils/logger.js';

let sql;

export async function initializeDatabase() {
  try {
    sql = postgres(process.env.DATABASE_URL || 'postgresql://fairway:fairway123@localhost:5432/fairwaylive', {
      max: 20,
      idle_timeout: 30,
      connect_timeout: 10,
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false
    });
    
    // Test connection
    await sql`SELECT 1`;
    
    // Run migrations
    await runMigrations();
    
    return sql;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

async function runMigrations() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(500),
        handicap DECIMAL(3,1),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        settings JSONB DEFAULT '{}'::jsonb
      )
    `;
    
    // Create rounds table
    await sql`
      CREATE TABLE IF NOT EXISTS rounds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id VARCHAR(255) NOT NULL,
        created_by UUID REFERENCES users(id),
        started_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        weather JSONB,
        settings JSONB DEFAULT '{}'::jsonb
      )
    `;
    
    // Create round_players table
    await sql`
      CREATE TABLE IF NOT EXISTS round_players (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        joined_at TIMESTAMP DEFAULT NOW(),
        total_score INTEGER,
        total_putts INTEGER,
        completed_holes INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active'
      )
    `;
    
    // Create scores table
    await sql`
      CREATE TABLE IF NOT EXISTS scores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        hole_number INTEGER NOT NULL,
        score INTEGER NOT NULL,
        putts INTEGER,
        fairway_hit BOOLEAN,
        green_in_regulation BOOLEAN,
        penalties INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        shot_data JSONB DEFAULT '[]'::jsonb,
        UNIQUE(round_id, user_id, hole_number)
      )
    `;
    
    // Create friendships table
    await sql`
      CREATE TABLE IF NOT EXISTS friendships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        friend_id UUID REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        accepted_at TIMESTAMP,
        UNIQUE(user_id, friend_id)
      )
    `;
    
    // Create bets table
    await sql`
      CREATE TABLE IF NOT EXISTS bets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        bet_type VARCHAR(50) NOT NULL,
        amount INTEGER NOT NULL,
        target VARCHAR(255),
        prediction VARCHAR(255),
        odds DECIMAL(5,2),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP,
        winnings INTEGER,
        outcome JSONB
      )
    `;
    
    // Create round_summaries table for analytics
    await sql`
      CREATE TABLE IF NOT EXISTS round_summaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        date DATE NOT NULL,
        total_score INTEGER,
        total_putts INTEGER,
        fairways_hit INTEGER,
        gir INTEGER,
        penalties INTEGER,
        holes_played INTEGER,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_rounds_status ON rounds(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_round_players_round ON round_players(round_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_scores_round_user ON scores(round_id, user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bets_round ON bets(round_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_round_summaries_user_date ON round_summaries(user_id, date)`;
    
    logger.info('Database migrations completed');
  } catch (error) {
    logger.error('Migration error:', error);
    throw error;
  }
}

export const db = {
  query: (...args) => sql(...args),
  sql
};

export default db;