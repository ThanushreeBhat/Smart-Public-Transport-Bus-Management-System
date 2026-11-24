// =============================================================================
// Static Syntax & Route Integrity Verification Test
// Smart Bus Overcrowding & Passenger Safety Management System
// Member A: Database Engineer & Backend Developer
// =============================================================================

const assert = require('assert');

console.log('Running static syntax and export integrity verification...');

try {
    // 1. Verify Error Handlers
    const errorHandler = require('../src/middleware/errorHandler');
    const notFound = require('../src/middleware/notFound');
    assert.strictEqual(typeof errorHandler, 'function', 'errorHandler must be a middleware function');
    assert.strictEqual(typeof notFound, 'function', 'notFound must be a middleware function');
    console.log('  [PASS] Middlewares (errorHandler, notFound)');

    // 2. Verify Controllers
    const busController = require('../src/controllers/busController');
    assert.strictEqual(typeof busController.getAllBuses, 'function');
    assert.strictEqual(typeof busController.getBusById, 'function');
    assert.strictEqual(typeof busController.createBus, 'function');
    assert.strictEqual(typeof busController.updateBus, 'function');
    assert.strictEqual(typeof busController.deleteBus, 'function');
    console.log('  [PASS] busController CRUD methods');

    const driverController = require('../src/controllers/driverController');
    assert.strictEqual(typeof driverController.getAllDrivers, 'function');
    assert.strictEqual(typeof driverController.getDriverById, 'function');
    assert.strictEqual(typeof driverController.createDriver, 'function');
    assert.strictEqual(typeof driverController.updateDriver, 'function');
    assert.strictEqual(typeof driverController.deleteDriver, 'function');
    console.log('  [PASS] driverController CRUD methods');

    const routeController = require('../src/controllers/routeController');
    assert.strictEqual(typeof routeController.getAllRoutes, 'function');
    assert.strictEqual(typeof routeController.getRouteById, 'function');
    assert.strictEqual(typeof routeController.createRoute, 'function');
    assert.strictEqual(typeof routeController.updateRoute, 'function');
    assert.strictEqual(typeof routeController.deleteRoute, 'function');
    console.log('  [PASS] routeController CRUD methods');

    const tripController = require('../src/controllers/tripController');
    assert.strictEqual(typeof tripController.getAllTrips, 'function');
    assert.strictEqual(typeof tripController.getTripById, 'function');
    assert.strictEqual(typeof tripController.createTrip, 'function');
    assert.strictEqual(typeof tripController.updateTrip, 'function');
    assert.strictEqual(typeof tripController.deleteTrip, 'function');
    console.log('  [PASS] tripController CRUD methods');

    const passengerController = require('../src/controllers/passengerController');
    assert.strictEqual(typeof passengerController.getPassengerRecordsByTrip, 'function');
    assert.strictEqual(typeof passengerController.recordPassengerCount, 'function');
    console.log('  [PASS] passengerController methods');

    const incidentController = require('../src/controllers/incidentController');
    assert.strictEqual(typeof incidentController.getAllIncidents, 'function');
    assert.strictEqual(typeof incidentController.getIncidentById, 'function');
    assert.strictEqual(typeof incidentController.updateIncidentStatus, 'function');
    assert.strictEqual(typeof incidentController.createManualIncident, 'function');
    console.log('  [PASS] incidentController methods');

    const reportController = require('../src/controllers/reportController');
    assert.strictEqual(typeof reportController.getTripSafetyReport, 'function');
    console.log('  [PASS] reportController methods');

    const dashboardController = require('../src/controllers/dashboardController');
    assert.strictEqual(typeof dashboardController.getDashboardSummary, 'function');
    console.log('  [PASS] dashboardController methods');

    // 3. Verify Express Application Initialization
    const app = require('../src/app');
    assert.strictEqual(typeof app.listen, 'function', 'app must be a valid Express instance');
    console.log('  [PASS] app.js Express initialization and router mounting');

    console.log('\n=======================================================');
    console.log('All static JavaScript integrity checks passed successfully!');
    console.log('=======================================================');
    process.exit(0);
} catch (error) {
    console.error('\n[FAIL] Static verification failed:', error.message);
    console.error(error.stack);
    process.exit(1);
}

