const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const { initSocket } = require('./socket');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initSocket(server);
app.set('io', io);

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in dev
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Stripe webhook needs raw body
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// JSON parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/services', require('./routes/services'));
app.use('/api/contractors', require('./routes/contractors'));
app.use('/api/contractor', require('./routes/contractor'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'ServisKu API',
    version: '1.0.1',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'ServisKu API',
    version: '1.0.1',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, version: '1.0.1', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server only if not in serverless environment
const PORT = process.env.PORT || 3000;
if (process.env.VERCEL !== '1') {
  server.listen(PORT, () => {
    console.log(`[ServisKu] API running on port ${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[ServisKu] Shutting down...');
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[ServisKu] Shutting down...');
  server.close();
  process.exit(0);
});
