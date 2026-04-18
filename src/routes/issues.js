const express = require('express');
const { getDb } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware');

const router = express.Router();
router.use(authMiddleware);

// GET /issues — students see own, admins see all
router.get('/', async (req, res) => {
  const db = await getDb();
  let query, params;
  if (req.user.role === 'admin') {
    query = `SELECT i.*, u.name as student_name, u.email as student_email,
             a.name as assignee_name
             FROM issues i
             LEFT JOIN users u ON i.student_id = u.id
             LEFT JOIN users a ON i.assigned_to = a.id
             ORDER BY i.created_at DESC`;
    params = [];
  } else {
    query = `SELECT i.*, u.name as student_name, a.name as assignee_name
             FROM issues i
             LEFT JOIN users u ON i.student_id = u.id
             LEFT JOIN users a ON i.assigned_to = a.id
             WHERE i.student_id = $1
             ORDER BY i.created_at DESC`;
    params = [req.user.id];
  }
  const { rows } = await db.query(query, params);
  res.json(rows);
});

// POST /issues — student creates issue
router.post('/', async (req, res) => {
  const { title, description, category, location } = req.body;
  if (!title || !description || !category) return res.status(400).json({ error: 'title, description, category required' });

  const db = await getDb();
  const { rows } = await db.query(
    'INSERT INTO issues (title, description, category, location, student_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [title, description, category, location || null, req.user.id]
  );
  res.status(201).json(rows[0]);
});

// PATCH /issues/:id — admin updates status/assignment
router.patch('/:id', adminOnly, async (req, res) => {
  const { status, assigned_to } = req.body;
  const db = await getDb();

  const updates = [];
  const params = [];
  let i = 1;

  if (status) { updates.push(`status = $${i++}`); params.push(status); }
  if (assigned_to !== undefined) { updates.push(`assigned_to = $${i++}`); params.push(assigned_to); }
  updates.push(`updated_at = NOW()`);
  params.push(req.params.id);

  if (updates.length === 1) return res.status(400).json({ error: 'Nothing to update' });

  const { rows } = await db.query(
    `UPDATE issues SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
    params
  );
  if (!rows.length) return res.status(404).json({ error: 'Issue not found' });
  res.json(rows[0]);
});

// GET /issues/stats — admin dashboard counts
router.get('/stats', adminOnly, async (req, res) => {
  const db = await getDb();
  const { rows } = await db.query(`
    SELECT status, COUNT(*) as count FROM issues GROUP BY status
  `);
  res.json(rows);
});

module.exports = router;
