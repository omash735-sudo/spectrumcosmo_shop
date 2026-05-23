import { neon, neonConfig } from '@neondatabase/serverless';

// Optional: Enable connection pooling for better performance
// This is especially important for serverless environments like Vercel
neonConfig.poolQueryViaFetch = true;

let sql: any = null;

export function getDb() {
  if (!sql) {
    sql = neon(process.env.POSTGRES_URL!);
  }
  return sql;
}

// For queries that need to be closed properly (rarely needed)
export async function closeDb() {
  if (sql && typeof sql.end === 'function') {
    await sql.end();
    sql = null;
  }
}
