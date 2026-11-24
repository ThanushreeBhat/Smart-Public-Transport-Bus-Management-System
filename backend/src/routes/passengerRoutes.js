// =============================================================================
// Passenger Monitoring Routes
// Member A: Database Engineer & Backend Developer
// =============================================================================

const express = require('express');
const router = express.Router();
const passengerController = require('../controllers/passengerController');

// Passenger snapshot endpoints
router.get('/trip/:tripId', passengerController.getPassengerRecordsByTrip);
router.post('/', passengerController.recordPassengerCount);

module.exports = router;
