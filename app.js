require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const connectDB = require('./config/db');

const app = express();

// Database connection middleware for serverless environment
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in request:', err.message, err.stack);
    res.status(500).send(`Database Connection Error: ${err.message}`);
  }
});

// View engine setup (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Body parser & static assets
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'ecoloop_secret_key_2026_sustainability',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
  })
);

// Flash messages
app.use(flash());

const Notification = require('./models/Notification');

// Global template variables & live notifications middleware
app.use(async (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.notifications = [];
  res.locals.unreadNotificationCount = 0;

  if (req.session.user && req.session.user._id) {
    try {
      const userNotifs = await Notification.find({ user: req.session.user._id })
        .sort({ createdAt: -1 })
        .limit(10);

      const unreadCount = await Notification.countDocuments({
        user: req.session.user._id,
        isRead: false
      });

      res.locals.notifications = userNotifs;
      res.locals.unreadNotificationCount = unreadCount;
    } catch (err) {
      console.error('Notification Middleware Error:', err.message);
    }
  }
  next();
});

// Routes
const authRoutes = require('./routes/authRoutes');
const citizenRoutes = require('./routes/citizenRoutes');
const agentRoutes = require('./routes/agentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const realtimeStream = require('./utils/realtimeStream');

// Handle HEAD requests gracefully for Vercel edge health checks
app.use((req, res, next) => {
  if (req.method === 'HEAD') {
    return res.status(200).end();
  }
  next();
});

app.use('/', authRoutes);
app.use('/citizen', citizenRoutes);
app.use('/agent', agentRoutes);
app.use('/admin', adminRoutes);
app.use('/notifications', notificationRoutes);
app.get('/api/live-stream', realtimeStream.initSSE);

// Root route redirect
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    const role = req.session.user.role;
    if (role === 'admin') return res.redirect('/admin/dashboard');
    if (role === 'agent') return res.redirect('/agent/dashboard');
    return res.redirect('/citizen/dashboard');
  }
  res.redirect('/login');
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('auth/login', { title: '404 — Page Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).send('Internal Server Error');
});

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 4000;
  const server = app.listen(PORT, () => {
    console.log(`[EcoLoop Server]: Running on http://localhost:${PORT}`);
  });

  // Handle server startup errors (e.g., EADDRINUSE)
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ [Port Conflict]: Port ${PORT} is already in use by another process.`);
      console.error(`💡 Free the port by running: npx kill-port ${PORT}\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });

  // Graceful shutdown listeners for nodemon and process restarts
  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
}

module.exports = app;
