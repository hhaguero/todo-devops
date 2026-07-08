const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'db',
  database: process.env.DB_NAME || 'todos',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'OK', version: '2.0', feature: 'PostgreSQL' });
});

// GET all TODOs
app.get('/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM todos ORDER BY id ASC');
    res.json({ todos: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new TODO
app.post('/todos', async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO todos (title, completed) VALUES ($1, $2) RETURNING *',
      [title, false]
    );
    res.json({ todo: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize database
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Table todos initialized');
  } catch (err) {
    console.error('✗ DB init error:', err.message);
  }
}

// Start server
const PORT = process.env.PORT || 80;
app.listen(PORT, async () => {
  await initDB();
  console.log(`✓ Server running on port ${PORT}`);
});
