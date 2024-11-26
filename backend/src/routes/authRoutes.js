const express = require("express");
const {
  twitterAuth,
  twitterAuthCallback,
  logout,
} = require("../controllers/authController");
const router = express.Router();

// Twitter Auth Routes
router.get("/twitter", twitterAuth);
router.get("/twitter/callback", twitterAuthCallback);

// Logout Route
router.get("/logout", logout);

module.exports = router;
