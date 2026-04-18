const express = require('express');
const { getDb } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware');

const router = express.Router();
router.use(authMiddleware);

// GET /announcements — all authenticated users
router.get('/', async (req, res) => {
  const db = await getDb();
  const { rows } = await db.query(`
    SELECT a.*, u.name as author_name
    FROM announcements a
    LEFT JOIN users u ON a.author_id = u.id
    ORDER BY a.created_at DESC
  `);
  res.json(rows);
});

// POST /announcements — admin only
router.post('/', adminOnly, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'title and content required' });

  const db = await getDb();
  const { rows } = await db.query(
    'INSERT INTO announcements (title, content, author_id) VALUES ($1, $2, $3) RETURNING *',
    [title, content, req.user.id]
  );
  res.status(201).json(rows[0]);
});

// DELETE /announcements/:id — admin only
router.delete('/:id', adminOnly, async (req, res) => {
  const db = await getDb();
  await db.query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
