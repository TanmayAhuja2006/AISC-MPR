const UserModel = require('../models/userModel');

/**
 * userController.js
 * Handles user profile and health profile CRUD.
 */

// GET /api/users/profile
const getProfile = async (req, res) => {
  const user          = await UserModel.findById(req.user.id);
  const healthProfile = await UserModel.getHealthProfile(req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  return res.status(200).json({
    success: true,
    user,
    healthProfile: healthProfile || null,
  });
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  const { name } = req.body;
  if (name) {
    await UserModel.updateName(req.user.id, name);
  }
  return res.status(200).json({ success: true, message: 'Profile updated.' });
};

// GET /api/users/health-profile
const getHealthProfile = async (req, res) => {
  const profile = await UserModel.getHealthProfile(req.user.id);
  return res.status(200).json({ success: true, healthProfile: profile || null });
};

// POST /api/users/health-profile  (upsert)
const upsertHealthProfile = async (req, res) => {
  const { age, blood_group, allergies, pre_existing_cond, current_medications } = req.body;

  await UserModel.upsertHealthProfile(req.user.id, {
    age,
    blood_group,
    allergies,
    pre_existing_cond,
    current_medications,
  });

  return res.status(200).json({ success: true, message: 'Health profile saved.' });
};

module.exports = { getProfile, updateProfile, getHealthProfile, upsertHealthProfile };
