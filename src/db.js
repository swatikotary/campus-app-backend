const { PGlite } = require('@electric-sql/pglite');
const path = require('path');

let db;

async function getDb() {
  if (!db) {
    db = new PGlite(path.join(__dirname, '../data'));
    await init(db);
  }
  return db;
}

async function init(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS issues (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      location TEXT,
      student_id INTEGER REFERENCES users(id),
      assigned_to INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Seed default admin if not exists
  const { rows } = await db.query("SELECT id FROM users WHERE email = 'admin@campus.edu'");
  if (rows.length === 0) {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('admin123', 10);
    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@campus.edu', $1, 'admin')",
      [hash]
    );
    const hash2 = await bcrypt.hash('student123', 10);
    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES ('Alex Student', 'student@campus.edu', $1, 'student')",
      [hash2]
    );
    console.log('✅ Seeded default users');
  }
}

module.exports = { getDb };
