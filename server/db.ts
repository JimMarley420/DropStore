import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { log } from './vite';

// Use the DATABASE_URL environment variable to connect to the database
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

// Log the connection
log('Database connection initialized', 'database');

// Export the database client
export const db = drizzle(client);