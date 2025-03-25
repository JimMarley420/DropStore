import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { log } from './vite';

// Use the DATABASE_URL environment variable to connect to the database
const sql = neon(process.env.DATABASE_URL!);

// Log the connection
log('Database connection initialized', 'database');

// Export the database client
export const db = drizzle(sql);