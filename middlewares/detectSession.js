function detectSession(req, res, next) {
  const sessionCookie = req.cookies?.session;

  if (!sessionCookie) {
    res.locals.isLoggedIn = false;
    res.locals.user = null;
    return next();
  }

  // session exists, verification pending
  res.locals.sessionCookie = sessionCookie;
  next();
}

module.exports = detectSession;
