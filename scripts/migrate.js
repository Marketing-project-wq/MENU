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

function httpsPost(hostname, path, body, headers) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers },
    }, (res) => {
      let out = '';
      res.on('data', c => out += c);
      res.on('end', () => resolve({ status: res.statusCode, body: out }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runSQL(sql) {
  // Use Supabase Management API to run SQL
  const res = await httpsPost(
    'api.supabase.com',
    `/v1/projects/${ref}/database/query`,
    { query: sql },
    {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    }
  );
  return res;
}

async function run() {
  // Split schema into individual statements and run each
  const schemaSQL = fs.readFileSync(path.join(__dirname, '../supabase/schema.sql'), 'utf8');
  const seedSQL   = fs.readFileSync(path.join(__dirname, '../supabase/seed.sql'), 'utf8');

  console.log('Testing connection to Supabase Management API...');
  const test = await runSQL('SELECT 1 as ok');
  console.log('Test response:', test.status, test.body.slice(0, 200));

  if (test.status >= 400) {
    console.error('Cannot connect to Supabase Management API');
    process.exit(1);
  }

  console.log('Running schema...');
  const schemaRes = await runSQL(schemaSQL);
  console.log('Schema response:', schemaRes.status, schemaRes.body.slice(0, 300));
  if (schemaRes.status >= 400 && !schemaRes.body.includes('already exists')) {
    console.error('Schema failed:', schemaRes.body);
    process.exit(1);
  }
  console.log('Schema done.');

  console.log('Running seed...');
  const seedRes = await runSQL(seedSQL);
  console.log('Seed response:', seedRes.status, seedRes.body.slice(0, 300));
  if (seedRes.status >= 400) {
    console.error('Seed failed:', seedRes.body);
    process.exit(1);
  }
  console.log('Seed done. 20 recipes inserted.');
}

run().catch(err => { console.error(err.message); process.exit(1); });
