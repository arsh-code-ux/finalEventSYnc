require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

const app = express();
const allowedOrigin = process.env.CLIENT_URL || process.env.PROJECT_URL || 'http://localhost:3000';

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/eventsync');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/register', require('./routes/register'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/stats', require('./routes/stats'));

app.get('/', (req, res) => res.send({ ok: true, msg: 'EventSync API' }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
