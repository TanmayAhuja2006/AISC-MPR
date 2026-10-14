require('dotenv').config();
const mysql = require('mysql2/promise');

/**
 * createTable.js
 * Run once on server startup to ensure all database tables exist.
 * Uses IF NOT EXISTS so it is idempotent.
 *
 * All primary key IDs and foreign key references use standard INT (signed)
 * to prevent MySQL foreign key type mismatch errors (errno 150).
 */

const DB_NAME = process.env.DB_NAME || 'healthcare_db';

const DDL_STATEMENTS = [
  /* 0 – Create database */
  `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci`,

  /* 1 – users */
  `CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(120)  NOT NULL,
    email       VARCHAR(191)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,
    created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* 2 – health_profiles */
  `CREATE TABLE IF NOT EXISTS health_profiles (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    user_id               INT NOT NULL UNIQUE,
    age                   TINYINT,
    blood_group           VARCHAR(10),
    allergies             TEXT,
    pre_existing_cond     TEXT,
    current_medications   TEXT,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* 3 – chat_sessions */
  `CREATE TABLE IF NOT EXISTS chat_sessions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    title       VARCHAR(255) DEFAULT 'New Chat',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* 4 – chat_messages */
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    session_id  INT NOT NULL,
    user_id     INT NOT NULL,
    role        ENUM('user','assistant') NOT NULL,
    content     LONGTEXT NOT NULL,
    sources     JSON,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES users(id)         ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* 5 – uploaded_documents */
  `CREATE TABLE IF NOT EXISTS uploaded_documents (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name   VARCHAR(255) NOT NULL,
    file_path     VARCHAR(512) NOT NULL,
    file_size     INT,
    mime_type     VARCHAR(100),
    indexed       TINYINT(1) DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* 6 – compatibility views so queries targeting messages / documents work seamlessly */
  `CREATE OR REPLACE VIEW messages AS SELECT * FROM chat_messages`,
  `CREATE OR REPLACE VIEW documents AS SELECT * FROM uploaded_documents`,
];

async function createTables() {
  // Connect without specifying DB first (so we can CREATE DATABASE)
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    multipleStatements: false,
  });

  try {
    console.log(`[createTable] Ensuring database '${DB_NAME}' exists…`);

    // Create DB first
    await conn.query(DDL_STATEMENTS[0]);
    await conn.query(`USE \`${DB_NAME}\``);

    // Drop + recreate uploaded_documents so PDF uploads always hit the latest schema.
    // CREATE TABLE IF NOT EXISTS cannot add file_size / mime_type / indexed to an old table.
    console.log('[createTable] Recreating uploaded_documents with file_size, mime_type, indexed…');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('DROP VIEW IF EXISTS documents');
    await conn.query('DROP TABLE IF EXISTS uploaded_documents');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create tables in order (respecting FK dependencies)
    for (let i = 1; i < DDL_STATEMENTS.length; i++) {
      await conn.query(DDL_STATEMENTS[i]);
      console.log(`[createTable] Statement ${i} verified/created.`);
    }

    console.log('[createTable] All tables and views created / verified successfully.');
  } catch (err) {
    console.error('[createTable] Error during migration:', err.message);
    throw err;
  } finally {
    await conn.end();
  }
}

module.exports = createTables;

// Allow running standalone: node config/createTable.js
if (require.main === module) {
  createTables()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
