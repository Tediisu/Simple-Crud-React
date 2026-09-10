# Student API — JWT Authentication Setup Guide

## Project Structure

```
student-api/
├── node_modules/
├── routes/
│   ├── student.js       # CRUD routes for students (GET, GET/:id, POST, PUT/:id, DELETE/:id)
│   └── auth.js          # register + login routes
├── middleware/
│   └── auth.js          # verifyToken middleware
├── db.js                # MySQL connection pool
├── server.js            # Express app entry point, mounts routes
├── .env                 # DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, PORT
├── package.json
└── package-lock.json
```

---

## Step 1 — Create the `users` Table

In phpMyAdmin → SQL tab:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);
```

## Step 2 — Auth Routes — `routes/auth.js`

```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// REGISTER
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );
        res.status(201).json({ id: result.insertId, username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
```

## Step 3 — Token Verification Middleware — `middleware/auth.js`

```javascript
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = decoded;
        next();
    });
}

module.exports = verifyToken;
```

## Step 4 — Wire Auth Routes Into `server.js`

```javascript
app.use('/api/auth', require('./routes/auth'));
```

## Step 5 — Protect the Students Routes

In `routes/student.js`, import the middleware and apply it to the routes that modify data:

```javascript
const verifyToken = require('../middleware/auth');

router.post('/', verifyToken, async (req, res) => { /* ... */ });
router.put('/:id', verifyToken, async (req, res) => { /* ... */ });
router.delete('/:id', verifyToken, async (req, res) => { /* ... */ });
```

## Step 6 — Test It

**1. Register** — `POST http://localhost:5000/api/auth/register`

```json
{
    "username": "enter_user",
    "password": "enter_password"
}
```

**2. Log in** — `POST http://localhost:5000/api/auth/login`

```json
{
    "username": "enter_user",
    "password": "enter_password"
}
```

This responds with a token:

```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImlhdCI6MTc4OTA2ODgyNCwiZXhwIjoxNzg5MDcyNDI0fQ.nlW_vTCoyVUK2xrt7Fu80bGjuEHniM-HXn10EHF3dwI"
}
```

**3. Use the token** — in Postman, go to **Headers**, and add:

| Key | Value |
|---|---|
| `Authorization` | `Bearer <token>` |

Example:

```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImlhdCI6MTc4OTA2ODgyNCwiZXhwIjoxNzg5MDcyNDI0fQ.nlW_vTCoyVUK2xrt7Fu80bGjuEHniM-HXn10EHF3dwI
```