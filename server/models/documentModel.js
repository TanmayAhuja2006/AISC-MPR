const db = require('../config/db');

/**
 * documentModel.js
 * Raw SQL queries for the uploaded_documents table.
 */

const DocumentModel = {
  async create({ userId, originalName, storedName, filePath, fileSize, mimeType }) {
    const [result] = await db.execute(
      `INSERT INTO uploaded_documents
         (user_id, original_name, stored_name, file_path, file_size, mime_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, originalName, storedName, filePath, fileSize || null, mimeType || null]
    );
    return result.insertId;
  },

  async getByUser(userId) {
    const [rows] = await db.execute(
      `SELECT id, original_name, stored_name, file_size, mime_type, indexed, created_at
       FROM uploaded_documents
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  },

  async getById(docId, userId) {
    const [rows] = await db.execute(
      'SELECT * FROM uploaded_documents WHERE id = ? AND user_id = ? LIMIT 1',
      [docId, userId]
    );
    return rows[0] || null;
  },

  async markIndexed(docId) {
    await db.execute(
      'UPDATE uploaded_documents SET indexed = 1 WHERE id = ?',
      [docId]
    );
  },

  async delete(docId, userId) {
    const [result] = await db.execute(
      'DELETE FROM uploaded_documents WHERE id = ? AND user_id = ?',
      [docId, userId]
    );
    return result.affectedRows > 0;
  },
};

module.exports = DocumentModel;
