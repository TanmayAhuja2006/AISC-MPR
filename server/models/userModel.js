const db = require('../config/db');

/**
 * userModel.js
 * Raw SQL queries for the users and health_profiles tables.
 */

const UserModel = {
  // ----- Users -----

  async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ name, email, password }) {
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, password]
    );
    return result.insertId;
  },

  async updateName(id, name) {
    await db.execute('UPDATE users SET name = ? WHERE id = ?', [name, id]);
  },

  // ----- Health Profiles -----

  async getHealthProfile(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM health_profiles WHERE user_id = ? LIMIT 1',
      [userId]
    );
    return rows[0] || null;
  },

  async upsertHealthProfile(userId, { age, blood_group, allergies, pre_existing_cond, current_medications }) {
    await db.execute(
      `INSERT INTO health_profiles
         (user_id, age, blood_group, allergies, pre_existing_cond, current_medications)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         age = VALUES(age),
         blood_group = VALUES(blood_group),
         allergies = VALUES(allergies),
         pre_existing_cond = VALUES(pre_existing_cond),
         current_medications = VALUES(current_medications),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, age || null, blood_group || null, allergies || null, pre_existing_cond || null, current_medications || null]
    );
  },
};

module.exports = UserModel;
