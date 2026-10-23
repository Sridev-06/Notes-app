// Defines the public account authentication endpoints for the API.
// Validates registration details and creates new user accounts.
// Checks credentials during login without returning password hashes.
// Issues signed JWT tokens so the frontend can access protected note routes.const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}
function sendUser(res, status, message, user) {
  return res.status(status).json({
    message,
    token: createToken(user._id.toString()),
    user: { id: user._id, email: user.email },
  });
}
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(409).json({ message: 'An account with this email already exists' });
    const user = await User.create({ email: normalizedEmail, password });
    return sendUser(res, 201, 'Account created successfully', user);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists' });
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    return res.status(500).json({ message: 'Could not create account', error: error.message });
  }
});
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !(await user.checkPassword(password))) {
      return res.status(401).json({ message: 'Email or password is incorrect' });
    }
    return sendUser(res, 200, 'Signed in successfully', user);
  } catch (error) {
    return res.status(500).json({ message: 'Could not sign in', error: error.message });
  }
});

module.exports = router;
