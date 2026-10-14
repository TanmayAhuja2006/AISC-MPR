const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const UserModel = require('../models/userModel');

/**
 * authController.js
 * Handles user registration and login.
 */

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const existing = await UserModel.findByEmail(email);
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already in use.' });
  }

  const hashed  = await bcrypt.hash(password, 12);
  const userId  = await UserModel.create({ name, email, password: hashed });

  const user  = { id: userId, email, name };
  const token = signToken(user);

  return res.status(201).json({
    success: true,
    message: 'Registration successful.',
    token,
    user: { id: userId, name, email },
  });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await UserModel.findByEmail(email);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const token = signToken(user);

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
};

// GET /api/auth/me
const getMe = async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  return res.status(200).json({ success: true, user });
};

module.exports = { register, login, getMe };
