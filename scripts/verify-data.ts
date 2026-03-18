import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import * as schema from '../lib/schema';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL_UNPOOLED!);
const db = drizzle(sql, { schema });

async function main() {
  const incidents = await db.query.incidents.findMany();
  console.log(incidents);
}

main();
