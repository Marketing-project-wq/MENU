const { Client } = require('pg');
const https = require('https');
const fs = require('fs');
const path = require('path');

const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;

if (!SERVICE_KEY || !SUPABASE_URL) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const ref = SUPABASE_URL.replace('https://', '').split('.')[0];

// Run SQL statements via Supabase REST API using pg_query RPC
// Falls back to direct psql-style execution via HTTP POST to /rest/v1/rpc
async function runSQLViaREST(sql) {
  return new Promise((resolve, reject) => {
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let completed = 0;
    let errors = [];

    function runNext(index) {
      if (index >= statements.length) {
        if (errors.length > 0) {
          // Some errors are OK (e.g. "already exists")
          const fatalErrors = errors.filter(e =>
            !e.includes('already exists') &&
            !e.includes('duplicate') &&
            !e.includes('does not exist')
          );
          if (fatalErrors.length > 0) {
            reject(new Error(fatalErrors.join('\n')));
          } else {
            resolve(completed);
          }
        } else {
          resolve(completed);
        }
        return;
      }

      const stmt = statements[index];
      const body = JSON.stringify({ query: stmt });

      const options = {
        hostname: `${ref}.supabase.co`,
        path: '/rest/v1/rpc/exec_sql',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          completed++;
          if (res.statusCode >= 400) {
            errors.push(`Statement ${index + 1}: ${data.slice(0, 200)}`);
          }
          runNext(index + 1);
        });
      });

      req.on('error', (e) => {
        errors.push(`Statement ${index + 1}: ${e.message}`);
        runNext(index + 1);
      });

      req.write(body);
      req.end();
    }

    runNext(0);
  });
}

async function runViaDirectPG() {
  // Try multiple Supabase connection endpoints
  const password = encodeURIComponent(SERVICE_KEY);
  const configs = [
    // Session pooler US East (GitHub Actions default region)
    `postgresql://postgres.${ref}:${SERVICE_KEY}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${SERVICE_KEY}@aws-0-us-east-2.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${SERVICE_KEY}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`,
    // AP region (project is in ap-southeast)
    `postgresql://postgres.${ref}:${SERVICE_KEY}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${SERVICE_KEY}@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`,
  ];

  for (const connStr of configs) {
    const host = connStr.split('@')[1].split(':')[0];
    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    });

    try {
      await client.connect();
      console.log(`Connected via ${host}`);
      return client;
    } catch (e) {
      console.log(`Failed ${host}: ${e.message}`);
      await client.end().catch(() => {});
    }
  }
  return null;
}

async function run() {
  const schema = fs.readFileSync(path.join(__dirname, '../supabase/schema.sql'), 'utf8');
  const seed   = fs.readFileSync(path.join(__dirname, '../supabase/seed.sql'), 'utf8');

  const client = await runViaDirectPG();

  if (!client) {
    console.error('All direct DB connections failed');
    process.exit(1);
  }

  console.log('Running schema...');
  await client.query(schema);
  console.log('Schema done.');

  console.log('Running seed...');
  await client.query(seed);
  console.log('Seed done. 20 recipes inserted.');

  await client.end();
}

run().catch(err => { console.error(err.message); process.exit(1); });
