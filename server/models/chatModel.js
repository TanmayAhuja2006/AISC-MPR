const db = require('../config/db');

/**
 * chatModel.js
 * Raw SQL queries for chat_sessions and chat_messages tables.
 * Resilient to schema column variations (session_title vs title, sender vs role, etc.)
 */

const ChatModel = {
  // ----- Sessions -----

  async createSession(userId, title = 'New Chat') {
    // Prefer the canonical `title` column from createTable.js, then fall back
    // to older `session_title` schemas so inserts never silently fail.
    try {
      const [result] = await db.query(
        'INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)',
        [userId, title]
      );
      return result.insertId;
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const [result] = await db.query(
          'INSERT INTO chat_sessions (user_id, session_title) VALUES (?, ?)',
          [userId, title]
        );
        return result.insertId;
      }
      throw err;
    }
  },

  async getSessionsByUser(userId) {
    try {
      const [rows] = await db.query(
        `SELECT id, title, created_at, COALESCE(updated_at, created_at) AS updated_at
         FROM chat_sessions
         WHERE user_id = ?
         ORDER BY id DESC`,
        [userId]
      );
      return rows;
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const [rows] = await db.query(
          `SELECT id, session_title AS title, created_at, created_at AS updated_at
           FROM chat_sessions
           WHERE user_id = ?
           ORDER BY id DESC`,
          [userId]
        );
        return rows;
      }
      throw err;
    }
  },

  async getSessionById(sessionId, userId) {
    try {
      const [rows] = await db.query(
        `SELECT id, title, created_at
         FROM chat_sessions
         WHERE id = ? AND user_id = ? LIMIT 1`,
        [sessionId, userId]
      );
      return rows[0] || null;
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const [rows] = await db.query(
          `SELECT id, session_title AS title, created_at
           FROM chat_sessions
           WHERE id = ? AND user_id = ? LIMIT 1`,
          [sessionId, userId]
        );
        return rows[0] || null;
      }
      throw err;
    }
  },

  async updateSessionTitle(sessionId, userId, title) {
    try {
      await db.query(
        'UPDATE chat_sessions SET session_title = ? WHERE id = ? AND user_id = ?',
        [title, sessionId, userId]
      );
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        await db.query(
          'UPDATE chat_sessions SET title = ? WHERE id = ? AND user_id = ?',
          [title, sessionId, userId]
        );
      } else {
        throw err;
      }
    }
  },

  async deleteSession(sessionId, userId) {
    // Delete messages first to maintain foreign key integrity
    try {
      await db.query('DELETE FROM chat_messages WHERE session_id = ?', [sessionId]);
    } catch {
      // Ignore if table has ON DELETE CASCADE or different name
    }

    await db.query(
      'DELETE FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );
  },

  async touchSession(sessionId) {
    try {
      await db.query(
        'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [sessionId]
      );
    } catch {
      // updated_at may not exist, non-fatal
    }
  },

  // ----- Messages -----

  async addMessage(sessionId, userId, role, content, sources = null) {
    const sourcesJson = sources ? JSON.stringify(sources) : null;
    const sender = role === 'assistant' ? 'bot' : (role || 'user');

    try {
      const [result] = await db.query(
        'INSERT INTO chat_messages (session_id, sender, message, context_sources) VALUES (?, ?, ?, ?)',
        [sessionId, sender, content, sourcesJson]
      );
      return result.insertId;
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const [result] = await db.query(
          'INSERT INTO chat_messages (session_id, user_id, role, content, sources) VALUES (?, ?, ?, ?, ?)',
          [sessionId, userId, role, content, sourcesJson]
        );
        return result.insertId;
      }
      throw err;
    }
  },

  async getMessagesBySession(sessionId) {
    let rows = [];
    try {
      const [res] = await db.query(
        `SELECT id, session_id, sender, message, context_sources, created_at
         FROM chat_messages
         WHERE session_id = ?
         ORDER BY id ASC`,
        [sessionId]
      );
      rows = res.map((r) => {
        let parsedSources = [];
        if (r.context_sources) {
          if (typeof r.context_sources === 'string') {
            try { parsedSources = JSON.parse(r.context_sources); } catch { parsedSources = []; }
          } else if (Array.isArray(r.context_sources)) {
            parsedSources = r.context_sources;
          }
        }
        return {
          id: r.id,
          role: r.sender === 'bot' ? 'assistant' : (r.sender || 'user'),
          content: r.message,
          sources: parsedSources,
          created_at: r.created_at,
        };
      });
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const [res] = await db.query(
          `SELECT id, role, content, sources, created_at
           FROM chat_messages
           WHERE session_id = ?
           ORDER BY id ASC`,
          [sessionId]
        );
        rows = res.map((r) => {
          let parsedSources = [];
          if (r.sources) {
            if (typeof r.sources === 'string') {
              try { parsedSources = JSON.parse(r.sources); } catch { parsedSources = []; }
            } else if (Array.isArray(r.sources)) {
              parsedSources = r.sources;
            }
          }
          return {
            id: r.id,
            role: r.role,
            content: r.content,
            sources: parsedSources,
            created_at: r.created_at,
          };
        });
      } else {
        throw err;
      }
    }
    return rows;
  },

  async getRecentMessages(sessionId, limit = 10) {
    const numLimit = parseInt(limit, 10) || 10;
    try {
      const [rows] = await db.query(
        `SELECT sender, message
         FROM chat_messages
         WHERE session_id = ?
         ORDER BY id DESC
         LIMIT ${numLimit}`,
        [sessionId]
      );
      return rows.reverse().map((r) => ({
        role: r.sender === 'bot' ? 'assistant' : (r.sender || 'user'),
        content: r.message,
      }));
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const [rows] = await db.query(
          `SELECT role, content
           FROM chat_messages
           WHERE session_id = ?
           ORDER BY id DESC
           LIMIT ${numLimit}`,
          [sessionId]
        );
        return rows.reverse();
      }
      throw err;
    }
  },
};

module.exports = ChatModel;
