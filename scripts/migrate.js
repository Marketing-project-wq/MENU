const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;

if (!SERVICE_KEY || !SUPABASE_URL) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Extract project ref from URL: https://xxxx.supabase.co
const ref = SUPABASE_URL.replace('https://', '').split('.')[0];

async function run() {
  const client = new Client({
    host: `aws-0-ap-southeast-1.pooler.supabase.com`,
    port: 5432,
    database: 'postgres',
    user: `postgres.${ref}`,
    password: SERVICE_KEY,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to Supabase');

  const schema = fs.readFileSync(path.join(__dirname, '../supabase/schema.sql'), 'utf8');
  const seed   = fs.readFileSync(path.join(__dirname, '../supabase/seed.sql'), 'utf8');

  console.log('Running schema...');
  await client.query(schema);
  console.log('Schema done.');

  console.log('Running seed...');
  await client.query(seed);
  console.log('Seed done. 20 recipes inserted.');

  await client.end();
}

run().catch(err => { console.error(err.message); process.exit(1); });
