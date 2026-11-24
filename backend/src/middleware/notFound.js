// =============================================================================
// 404 Not Found Middleware
// Member A: Database Engineer & Backend Developer
// =============================================================================

function notFound(req, res, next) { // eslint-disable-line no-unused-vars
    res.status(404).json({
        success: false,
        message: `API endpoint not found: ${req.method} ${req.originalUrl}`
    });
}

module.exports = notFound;
