// =============================================================================
// Safety Incident Routes
// Member A: Database Engineer & Backend Developer
// =============================================================================

const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');

// Safety Incidents Endpoints
router.get('/', incidentController.getAllIncidents);
router.get('/:id', incidentController.getIncidentById);
router.patch('/:id/status', incidentController.updateIncidentStatus);
router.post('/', incidentController.createManualIncident);

module.exports = router;

