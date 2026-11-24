// =============================================================================
// MySQL Database Connection Pool Configuration
// Member A: Database Engineer & Backend Developer
// =============================================================================

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Initialize MySQL connection pool with parameterized options
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_bus_safety',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    dateStrings: true // Return date & time columns as formatted strings for clean JSON
});

/**
 * Diagnostic helper to test the MySQL database connection upon server startup.
 * @returns {Promise<boolean>}
 */
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log(`[DB] Successfully connected to MySQL database "${process.env.DB_NAME || 'smart_bus_safety'}" at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('[DB] Connection failure:', error.message);
        console.error('[DB] Hint: Verify MySQL is running, credentials in .env are correct, and schema.sql has been executed.');
        return false;
    }
}

module.exports = {
    pool,
    testConnection
};
