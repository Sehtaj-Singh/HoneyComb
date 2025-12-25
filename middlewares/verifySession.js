const admin = require("../firebase/firebaseAdmin");

async function verifySession(req, res, next) {
  if (!res.locals.sessionCookie) {
    return next();
  }

  try {
    const decoded = await admin
      .auth()
      .verifySessionCookie(res.locals.sessionCookie, true);

    // ✅ verified
    res.locals.isLoggedIn = true;
    res.locals.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role || "user",
    };

    return next();
  } catch (error) {
    // pass error to refreshSession
    res.locals.sessionError = error;
    return next();
  }
}

module.exports = verifySession;
