const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;

if (!SERVICE_KEY || !SUPABASE_URL) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const ref = SUPABASE_URL.replace('https://', '').split('.')[0];

async function run() {
  // Try session pooler (port 5432) with standard postgres user
  const configs = [
    {
      host: `aws-0-ap-southeast-1.pooler.supabase.com`,
      port: 5432,
      database: 'postgres',
      user: `postgres.${ref}`,
      password: SERVICE_KEY,
      ssl: { rejectUnauthorized: false },
    },
    {
      host: `aws-0-ap-southeast-1.pooler.supabase.com`,
      port: 6543,
      database: 'postgres',
      user: `postgres.${ref}`,
      password: SERVICE_KEY,
      ssl: { rejectUnauthorized: false },
    },
    // Direct connection without pooler prefix
    {
      host: `db.${ref}.supabase.co`,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: SERVICE_KEY,
      ssl: { rejectUnauthorized: false },
    },
  ];

  let connected = false;
  let client;

  for (const config of configs) {
    client = new Client(config);
    try {
      await client.connect();
      console.log(`Connected via ${config.host}:${config.port}`);
      connected = true;
      break;
    } catch (e) {
      console.log(`Failed ${config.host}:${config.port} — ${e.message}`);
      await client.end().catch(() => {});
    }
  }

  if (!connected) {
    console.error('All connection attempts failed');
    process.exit(1);
  }

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
