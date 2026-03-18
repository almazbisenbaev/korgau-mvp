import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL_UNPOOLED!);

async function checkStats() {
  try {
    const result = await sql`SELECT COUNT(*) as count FROM incidents`;
    console.log('Raw result from COUNT(*):', JSON.stringify(result, null, 2));
    console.log('Type of count:', typeof result[0].count);
    
    const injuries = await sql`SELECT COALESCE(SUM(injuries), 0) as total FROM incidents`;
    console.log('Raw result from SUM(injuries):', JSON.stringify(injuries, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkStats();
