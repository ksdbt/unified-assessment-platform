const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');

// Load env vars
dotenv.config();

// Connect to Database if not in test env
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      process.env.CLIENT_URL
    ].filter(Boolean),
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware
app.use(cors({
  origin: [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Attach io to req object so routes can use it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/categories', require('./routes/CategoryRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Telemetry/Analytics Routes
app.use('/api/telemetry', require('./routes/telemetry'));
app.use('/api/analytics', require('./routes/analytics'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Smart Assessment System Backend is running', timestamp: new Date() });
});

// Root
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Smart Assessment System API' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
    console.log(`🔌 WebSocket server is active`);
  });
}

module.exports = app;