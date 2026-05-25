import admin from "firebase-admin";
import { createRequire } from "module";
import User from "../models/User.js";

let serviceAccount;

// In production, parse service account credentials from environment variables.
// In development, fall back to the local ignored firebase-key.json file.
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", err.message);
  }
} else {
  try {
    const require = createRequire(import.meta.url);
    serviceAccount = require("../firebase-key.json");
  } catch (err) {
    console.error("Failed to load local firebase-key.json:", err.message);
  }
}

if (serviceAccount && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const protect = async (req, res, next) => {
  let token;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      // Verify the ID token via Firebase Admin
      const decodedToken = await admin.auth().verifyIdToken(token);
      const { uid, email, name } = decodedToken;

      // Find user in MongoDB by firebaseUid
      let user = await User.findOne({ firebaseUid: uid });

      // If user profile doesn't exist in MongoDB, create one automatically
      if (!user) {
        user = await User.create({
          firebaseUid: uid,
          name: name || email.split("@")[0],
          email: email,
          age: 28,
          gender: "Male",
          height: 180,
          weight: 75
        });
      }

      req.user = user;
      next();
    } else {
      return res.status(401).json({ message: "No token provided" });
    }
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ message: "Invalid or expired Firebase token" });
  }
};
