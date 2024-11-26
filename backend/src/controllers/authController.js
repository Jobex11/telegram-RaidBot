const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const User = require("../models/user");

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: "http://localhost:3000/api/auth/twitter/callback",
    },
    async (token, tokenSecret, profile, done) => {
      try {
        let user = await User.findOne({ twitterId: profile.id });

        if (!user) {
          user = await User.create({
            twitterId: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            profileImage: profile.photos[0]?.value || "",
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize and Deserialize user
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) =>
  User.findById(id, (err, user) => done(err, user))
);

const twitterAuth = passport.authenticate("twitter");
const twitterAuthCallback = passport.authenticate("twitter", {
  failureRedirect: "/login",
  successRedirect: "/dashboard",
});

const logout = (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send({ message: "Logout failed" });
    res.status(200).send({ message: "Logged out successfully" });
  });
};

module.exports = { twitterAuth, twitterAuthCallback, logout };
