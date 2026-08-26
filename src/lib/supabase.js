const { createClient } = require('@supabase/supabase-js');

function validateEnv() {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

let _supabase;
let _supabaseAdmin;

function getSupabase() {
  if (!_supabase) {
    validateEnv();
    _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  }
  return _supabase;
}

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    validateEnv();
    _supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return _supabaseAdmin;
}

module.exports = { getSupabase, getSupabaseAdmin };
