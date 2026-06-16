const express = require('express');
const cors = require('cors');
const path = require('path');
const excelRoutes = require('./routes/excelRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', excelRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, 'public');
  
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 API endpoints available at /api`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 Frontend served from /public`);
  }
});
