require('dotenv').config();
const express = require('express');
const cors = require('cors');
const deviceRoutes = require('./routes/device');
const hatchRoutes = require('./routes/hatch');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.use('/api', deviceRoutes);
app.use('/api', hatchRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`Hatchmosphere server running on http://localhost:${PORT}`);
});
