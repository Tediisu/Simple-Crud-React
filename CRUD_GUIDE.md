# Student API — Express + MySQL Backend Setup Guide

## Project Structure

```
student-api/
├── server.js
├── db.js
├── routes/
│   └── students.js
├── middleware/
│   └── auth.js
├── .env
└── package.json
```

---

## Step 1 — Initialize the Backend

```bash
npm init -y
npm install express mysql2 jsonwebtoken bcryptjs cors dotenv nodemon
```

## Step 2 — Environment Variables — `.env`

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=student_db
JWT_SECRET=secret_key
PORT=5000
```

## Step 3 — Database Connection Pool — `db.js`

```javascript
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

module.exports = pool;
```

## Step 4 — Express Entry Point — `server.js`

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('API running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

## Step 5 — Verify the Server Runs

```bash
npx nodemon server.js
```

Open `http://localhost:5000` in your browser or Postman — you should see `API running`.

## Step 6 — Create the Database

Open XAMPP, start the **Apache** and **MySQL** modules, then open `localhost/phpmyadmin` and run:

```sql
CREATE DATABASE student_db;
USE student_db;

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  course VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Step 7 — Students CRUD Routes — `routes/students.js`

```javascript
const express = require('express');
const router = express.Router();
const pool = require('../db');

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
router.post('/', async (req, res) => {
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
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM students WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

## Step 8 — Wire the Routes Into `server.js`

Add this line right after `app.use(express.json());`:

```javascript
app.use('/api/students', require('./routes/students'));
```

## Step 9 — Test the Endpoints

Test in Postman / Thunder Client, in this order:

1. **GET** `http://localhost:5000/api/students` → should return `[]`
2. **POST** `http://localhost:5000/api/students` with JSON body:
   ```json
   { "name": "Juan Dela Cruz", "email": "juan@test.com", "course": "BSIT" }
   ```
   → should return the created row
3. **GET** again → should show your new record
4. **PUT** `http://localhost:5000/api/students/1` with updated fields
5. **DELETE** `http://localhost:5000/api/students/1`