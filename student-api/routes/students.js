const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/auth');

// GET all students
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single student by id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE student
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, email, course } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    const [result] = await pool.query(
      'INSERT INTO students (name, email, course) VALUES (?, ?, ?)',
      [name, email, course]
    );
    const [newRow] = await pool.query('SELECT * FROM students WHERE id = ?', [result.insertId]);
    res.status(201).json(newRow[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE student
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, email, course } = req.body;
    const [result] = await pool.query(
      'UPDATE students SET name = ?, email = ?, course = ? WHERE id = ?',
      [name, email, course, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Student not found' });

    const [updatedRow] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    res.json(updatedRow[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE student
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM students WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;