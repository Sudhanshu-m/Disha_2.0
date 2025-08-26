import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from "@shared/schema";

// For development, use local SQLite. For production, use Turso.
// If DATABASE_URL contains PostgreSQL params, default to local SQLite
const databaseUrl = process.env.DATABASE_URL;
let finalUrl = 'file:./database.sqlite'; // Default to local SQLite

// Only use DATABASE_URL if it's a valid SQLite/Turso URL
if (databaseUrl && (databaseUrl.startsWith('file:') || databaseUrl.startsWith('libsql:'))) {
  finalUrl = databaseUrl;
}

const client = createClient({
  url: finalUrl,
  authToken: process.env.DATABASE_AUTH_TOKEN, // Only needed for Turso
});

export const db = drizzle(client, { schema });