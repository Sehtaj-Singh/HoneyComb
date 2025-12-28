// controllers/loginController.js
const admin = require("../firebase/firebaseAdmin");
const axios = require("axios");

exports.getLogin = (req, res) => {
  res.render("pages/login", { active: null });
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render("pages/login", {
      error: "Invalid credentials"
    });
  }

  try {
    // 1️⃣ Sign in with Firebase (email/password)
    const signInResponse = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true
      }
    );

    const { idToken } = signInResponse.data;

    // 2️⃣ Create session cookie
    const expiresIn = 5 * 24 * 60 * 60 * 1000; // 5 days

    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn });

    // 3️⃣ Set cookie
    res.cookie("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: expiresIn
    });

    // 4️⃣ Redirect
    return res.redirect("/profile");

  } catch (error) {
    console.error(
      error.response?.data || error.message
    );

    return res.render("pages/login", {
      error: "Login failed"
    });
  }
};
