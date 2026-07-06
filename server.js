const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'TODO App API running' });
});

app.get('/api/tasks', (req, res) => {
  res.json({ tasks: [{ id: 1, title: 'Sample task', completed: false }] });
});

app.post('/api/tasks', (req, res) => {
  res.json({ id: 2, title: req.body.title, completed: false });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
