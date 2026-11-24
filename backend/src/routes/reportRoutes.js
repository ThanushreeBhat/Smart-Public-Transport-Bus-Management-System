// =============================================================================
// Report Routes
// Member A: Database Engineer & Backend Developer
// =============================================================================

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Stored Procedure Report Endpoints
router.get('/trip/:tripId', reportController.getTripSafetyReport);

module.exports = router;

