import admin from "firebase-admin";
import { createRequire } from "module";
import User from "../models/User.js";

const require = createRequire(import.meta.url);
const serviceAccount = require("../firebase-key.json");

if (!admin.apps.length) {
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
