// =============================================================================
// Express Application Configuration
// Smart Bus Overcrowding & Passenger Safety Management System
// Member A: Database Engineer & Backend Developer
// =============================================================================

const express = require('express');
const cors = require('cors');

// Import route modules
const busRoutes = require('./routes/busRoutes');
const driverRoutes = require('./routes/driverRoutes');
const routeRoutes = require('./routes/routeRoutes');
const tripRoutes = require('./routes/tripRoutes');
const passengerRoutes = require('./routes/passengerRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Import middlewares
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// =============================================================================
// 1. Core Middlewares
// =============================================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration for Member B's React frontend
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or Postman) or matching origin
        if (!origin || origin === allowedOrigin || origin === 'http://localhost:5173' || origin === 'http://localhost:3000') {
            callback(null, true);
        } else {
            callback(null, true); // Permissive in development for smooth integration
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Logger (Morgan or fallback console log)
try {
    const morgan = require('morgan');
    app.use(morgan('dev'));
} catch (e) { // eslint-disable-line no-unused-vars
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
}

// =============================================================================
// 2. Health & Diagnostic Endpoint
// =============================================================================
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Smart Bus Safety Management System Backend is healthy and operational.',
        data: {
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            uptime_seconds: Math.floor(process.uptime())
        }
    });
});

// =============================================================================
// 3. API Routes Registration
// =============================================================================
app.use('/api/buses', busRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/passengers', passengerRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// =============================================================================
// 4. Fallback Error Handlers
// =============================================================================
// 404 Not Found Handler
app.use(notFound);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;

