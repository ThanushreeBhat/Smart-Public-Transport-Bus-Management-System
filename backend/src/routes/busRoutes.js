// =============================================================================
// Bus Routes
// Member A: Database Engineer & Backend Developer
// =============================================================================

const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');

// Bus CRUD Endpoints
router.get('/', busController.getAllBuses);
router.get('/:id', busController.getBusById);
router.post('/', busController.createBus);
router.put('/:id', busController.updateBus);
router.delete('/:id', busController.deleteBus);

module.exports = router;
