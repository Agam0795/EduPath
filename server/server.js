require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// SSE manager
const sse = require('./sse');

// Middleware
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle malformed JSON bodies gracefully
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    console.error('⚠️ Malformed JSON in request body:', err.message);
    return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
  }
  next(err);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/marks', require('./routes/marks'));
app.use('/api/books', require('./routes/books'));
app.use('/api/libraries', require('./routes/libraries'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// SSE subscribe endpoint for marks updates (students subscribe)
app.get('/sse/marks/:studentId', (req, res) => {
  const { studentId } = req.params;
  return sse.subscribe(studentId, res);
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Connect DB & start server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    // Auto-seed if empty
    const Student = require('./models/Student');
    const count = await Student.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding database...');
      try {
        await require('./seed')();
        console.log('✅ Seeding completed');
      } catch (err) {
        console.error('❌ Seeding failed:', err.message);
      }
    }
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
