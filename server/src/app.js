const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const dotenv = require('dotenv');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();

// Middleware & Session Options
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Express Session Middleware
app.use(session({
  name: 'tiffinlink_session',
  secret: process.env.SESSION_SECRET || 'tiffinlink_session_super_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // Set to true if running on HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// API Routes
app.use('/api', routes);

// Root Health Check Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'TiffinLink MERN API Server',
    cookiesEnabled: true,
    sessionActive: !!req.session,
    timestamp: new Date().toISOString()
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;

