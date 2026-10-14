require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const createTables = require('./config/createTable');

// Route imports
const authRoutes     = require('./routes/authRoutes');
const userRoutes     = require('./routes/userRoutes');
const chatRoutes     = require('./routes/chatRoutes');
const documentRoutes = require('./routes/documentRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.NODE_ENV === 'production'
                 ? process.env.CLIENT_ORIGIN || 'http://localhost:5173'
                 : '*',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static serving of uploaded files (protected behind auth in production)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/chat',      chatRoutes);
app.use('/api/documents', documentRoutes);

// Health check
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'healthcare-rag-server', timestamp: new Date().toISOString() })
);

// 404 handler
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found.' })
);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File too large. Maximum allowed size is 20 MB.' });
  }
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// ────────────────────────────────────────────────
// Startup: migrate DB then listen
// ────────────────────────────────────────────────
(async () => {
  try {
    await createTables();
    app.listen(PORT, () => {
      console.log(`\n🏥  Healthcare RAG Server running on http://localhost:${PORT}`);
      console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`   AI Service  : ${process.env.AI_SERVICE_URL || 'http://localhost:8000'}\n`);
    });
  } catch (err) {
    console.error('Server startup failed:', err.message);
    process.exit(1);
  }
})();
