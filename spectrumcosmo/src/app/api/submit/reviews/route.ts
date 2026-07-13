import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Create a direct connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

export async function POST(req: NextRequest) {
  try {
    console.log('=== TEST ROUTE STARTED ===');
    
    // Just test the database connection
    const client = await pool.connect();
    console.log('Connected to database');
    
    const result = await client.query('SELECT NOW() as time');
    console.log('Query result:', result.rows[0]);
    
    client.release();
    
    return NextResponse.json({ 
      success: true, 
      time: result.rows[0].time 
    });
    
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
