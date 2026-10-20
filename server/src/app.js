const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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
const advancedFeaturesRoutes = require('./routes/advancedFeaturesRoutes');
app.use('/api/v1', advancedFeaturesRoutes);
app.use('/api', advancedFeaturesRoutes);
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

// API 404 Handler for undefined routes (returns JSON, not HTML)
app.use('/api', notFoundHandler);
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;

