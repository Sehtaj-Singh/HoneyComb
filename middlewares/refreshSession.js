const admin = require("../firebase/firebaseAdmin");

async function refreshSession(req, res, next) {
  const error = res.locals.sessionError;

  if (!error) return next();

  // ❌ Tampered or invalid token
  if (error.code !== "auth/session-cookie-expired") {
    res.clearCookie("session");
    res.locals.isLoggedIn = false;
    res.locals.user = null;
    return next();
  }

  try {
    /**
     * REFRESH FLOW (placeholder)
     * - lookup refresh token in DB using UID mapping
     * - call Secure Token API
     * - create new session cookie
     * - set cookie
     */

    // For now: force re-login
    res.clearCookie("session");
    res.locals.isLoggedIn = false;
    res.locals.user = null;
    return next();

  } catch (err) {
    res.clearCookie("session");
    res.locals.isLoggedIn = false;
    res.locals.user = null;
    return next();
  }
}

module.exports = refreshSession;
