const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// ========================
// Google Strategy Config
// ========================
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });

    if (user) {
      user.googleTokens = {
   accessToken,
   refreshToken
};

      await user.save();
      return done(null, user);
    }

    const newUser = new User({
      name: profile.displayName,
      email: profile.emails[0].value,
      googleId: profile.id,
      googleTokens: { accessToken, refreshToken }
    });

    await newUser.save();
    return done(null, newUser);
  } catch (err) {
    console.error('Error in Google Strategy:', err);
    return done(err, null);
  }
}));

// ========================
// Serialize / Deserialize
// ========================
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ========================
// Signup Routes
// ========================
router.get('/signup', (req, res) => res.render('signup'));

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  let existingUser = await User.findOne({ email });
  if (existingUser) {
    req.flash('error_msg', 'Email already registered');
    return res.redirect('/auth/signup');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ name, email, password: hashedPassword });
  await newUser.save();

  req.flash('success_msg', 'Signup successful. Please login.');
  res.redirect('/auth/login');
});

// ========================
// Login Routes
// ========================
router.get('/login', (req, res) => {
  const successMessage = req.query.success ? 'Password updated successfully. Please login again.' : null;
  res.render('login', { message: successMessage });
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/auth/login',
    failureFlash: true
  })(req, res, next);
});

// ========================
// Google OAuth Routes
// ========================
router.get('/google', passport.authenticate('google', {
  accessType: 'offline',
  prompt: 'consent',
  scope: ['profile', 'email'],
  
}));

router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/auth/login',
  failureFlash: true
}), (req, res) => {
  res.redirect('/dashboard');
});

// ========================
// Logout Route
// ========================
router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/dashboard');
    }
    req.session.destroy(() => {
      res.redirect('/');
    });
  });
});


module.exports = router;
