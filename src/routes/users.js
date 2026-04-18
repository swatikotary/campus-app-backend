const express = require('express');
const { getDb } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware');

const router = express.Router();
router.use(authMiddleware);

// GET /users — admin sees all students
router.get('/', adminOnly, async (req, res) => {
  const db = await getDb();
  const { rows } = await db.query(
    "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
  );
  res.json(rows);
});

// GET /users/me — current user profile
router.get('/me', (req, res) => {
  res.json(req.user);
});

module.exports = router;
