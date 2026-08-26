const { supabase } = require('../lib/supabase');

// Attach user to req if valid token present. Does NOT block guest access.
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);

  req.user = error ? null : data.user;
  next();
}

// Blocks unauthenticated requests — used for member-only endpoints.
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
