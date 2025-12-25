const admin = require("../firebase/firebaseAdmin");
const User = require("../models/userDB");
const axios = require("axios");

exports.getRegister = (req, res) => {
  res.render("pages/userRegister" ,{ active : null });
};

exports.postRegister = async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  // Basic validation (no DB logic yet)
  if (!email || !password || password !== confirmPassword) {
    return res.render("pages/userRegister", {
      error: "Invalid input"
    });
  }

  try {
    // 1️⃣ Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password
    });

    // 2️⃣ Sign in user (get ID token + refresh token)
    const signInResponse = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true
      }
    );

    const { idToken, refreshToken } = signInResponse.data;

    // 3️⃣ Create Firebase session cookie
    const expiresIn = 5 * 24 * 60 * 60 * 1000; // 5 days

    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn });

    // 4️⃣ Save user in DB (refreshToken only)
    await User.create({
      uid: userRecord.uid,
      name: email.split("@")[0], // temporary
      email,
      phone: "NA",               // temporary
      refreshToken
    });

    // 5️⃣ Set session cookie (HttpOnly)
    res.cookie("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expiresIn
    });

    return res.redirect("/profile");

  } catch (error) {
    console.error(
      error.response?.data || error.message
    );

    return res.render("pages/userRegister", {
      error: "Registration failed"
    });
  }
};
