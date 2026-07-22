const express = require('express');
const { Pool } = require('pg');
const promClient = require('prom-client');

const app = express();
app.use(express.json());

// Prometheus metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_ms',
  help: 'Duration of database queries in ms',
  labelNames: ['query_type'],
  buckets: [0.1, 5, 15, 50, 100, 500]
});

const dbQueryTotal = new promClient.Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['query_type', 'status']
});

// Middleware para medir duración de requests
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDuration.labels(req.method, req.route?.path || req.path, res.statusCode).observe(duration);
    httpRequestTotal.labels(req.method, req.route?.path || req.path, res.statusCode).inc();
  });
  
  next();
});

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
  res.json({ status: 'OK', version: '2.0', feature: 'PostgreSQL + Prometheus' });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// GET all TODOs
app.get('/todos', async (req, res) => {
  try {
    const start = Date.now();
    const result = await pool.query('SELECT * FROM todos ORDER BY id ASC');
    const duration = Date.now() - start;
    dbQueryDuration.labels('SELECT').observe(duration);
    dbQueryTotal.labels('SELECT', 'success').inc();
    res.json({ todos: result.rows });
  } catch (err) {
    dbQueryTotal.labels('SELECT', 'error').inc();
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
    const start = Date.now();
    const result = await pool.query(
      'INSERT INTO todos (title, completed) VALUES ($1, $2) RETURNING *',
      [title, false]
    );
    const duration = Date.now() - start;
    dbQueryDuration.labels('INSERT').observe(duration);
    dbQueryTotal.labels('INSERT', 'success').inc();
    res.json({ todo: result.rows[0] });
  } catch (err) {
    dbQueryTotal.labels('INSERT', 'error').inc();
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
  console.log(`✓ Metrics available at http://localhost:${PORT}/metrics`);
});
