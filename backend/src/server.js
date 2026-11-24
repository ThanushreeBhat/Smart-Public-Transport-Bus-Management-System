// =============================================================================
// HTTP Server Entry Point
// Smart Bus Overcrowding & Passenger Safety Management System
// Member A: Database Engineer & Backend Developer
// =============================================================================

const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const { testConnection, pool } = require('./config/db');

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
    console.log('=============================================================================');
    console.log('Starting Smart Bus Overcrowding & Passenger Safety Management System Backend');
    console.log('Member A: Database Engineer & Backend Developer');
    console.log('=============================================================================');

    // Step 1: Verify MySQL database connectivity
    console.log('[Startup] Verifying MySQL database connection...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
        console.warn('-----------------------------------------------------------------------------');
        console.warn('[WARNING] Server will proceed to start, but MySQL queries will fail until');
        console.warn('the MySQL service is started and schema.sql/seed.sql are imported.');
        console.warn('Refer to docs/SETUP_GUIDE.md for step-by-step database setup instructions.');
        console.warn('-----------------------------------------------------------------------------');
    }

    // Step 2: Start HTTP Server listener
    const server = app.listen(PORT, () => {
        console.log(`[Server] Backend API server running on port: ${PORT}`);
        console.log(`[Server] Health Endpoint: http://localhost:${PORT}/api/health`);
        console.log(`[Server] Dashboard API:   http://localhost:${PORT}/api/dashboard`);
        console.log(`[Server] Frontend Origin:  ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
        console.log('=============================================================================');
    });

    // Step 3: Graceful shutdown handling
    const handleShutdown = async (signal) => {
        console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
        server.close(async () => {
            console.log('[Server] HTTP listener closed.');
            try {
                await pool.end();
                console.log('[DB] MySQL connection pool drained and terminated.');
            } catch (err) {
                console.error('[DB] Error during pool termination:', err.message);
            }
            process.exit(0);
        });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

startServer().catch((err) => {
    console.error('[Fatal] Server failed to start:', err.message);
    process.exit(1);
});

