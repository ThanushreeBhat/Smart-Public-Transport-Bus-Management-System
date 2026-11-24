// =============================================================================
// Dashboard Routes
// Member A: Database Engineer & Backend Developer
// =============================================================================

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Live Database Dashboard Metrics
router.get('/', dashboardController.getDashboardSummary);

module.exports = router;

