// =============================================================================
// Trip Routes
// Member A: Database Engineer & Backend Developer
// =============================================================================

const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

// Trip CRUD Endpoints
router.get('/', tripController.getAllTrips);
router.get('/:id', tripController.getTripById);
router.post('/', tripController.createTrip);
router.put('/:id', tripController.updateTrip);
router.delete('/:id', tripController.deleteTrip);

module.exports = router;
