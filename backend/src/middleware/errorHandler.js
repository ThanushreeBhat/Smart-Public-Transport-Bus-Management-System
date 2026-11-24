// =============================================================================
// Centralized Error Handling Middleware
// Member A: Database Engineer & Backend Developer
// =============================================================================

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
    // Log internal error for backend debugging
    if (process.env.NODE_ENV !== 'test') {
        console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);
    }

    // Default status code and response message
    let statusCode = err.statusCode || 500;
    let message = err.message || 'An unexpected internal server error occurred.';

    // MySQL Specific Error Code Handling
    if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        message = 'A record with duplicate unique information (e.g. bus number, phone, or license) already exists.';
    } else if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
        statusCode = 409;
        message = 'Cannot delete or modify this record because dependent records (such as scheduled trips or passenger records) exist.';
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
        statusCode = 400;
        message = 'Invalid reference: The referenced Bus, Driver, Route, or Trip does not exist in the database.';
    } else if (err.code === 'ECONNREFUSED') {
        statusCode = 503;
        message = 'Database service unavailable. Ensure MySQL server is running and accessible.';
    }

    res.status(statusCode).json({
        success: false,
        message: message
    });
}

module.exports = errorHandler;
