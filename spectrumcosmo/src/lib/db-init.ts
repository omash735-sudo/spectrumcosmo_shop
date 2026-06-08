// lib/db-init.ts
import { initDb } from './db';

// Initialize database connection on server start
initDb().catch((err) => {
  console.error('Failed to initialize database:', err);
});
