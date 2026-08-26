const { getSupabase } = require('../lib/supabase');

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.slice(7);
  const { data, error } = await getSupabase().auth.getUser(token);

  req.user = error ? null : data.user;
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Login diperlukan untuk mengakses fitur ini.',
      cta: 'Silakan login atau daftar di https://my.20fit.id',
    });
  }
  next();
}

module.exports = { optionalAuth, requireAuth };
