// =============================================================================
// Report Controller (MySQL Stored Procedure Integration)
// Member A: Database Engineer & Backend Developer
// =============================================================================

const { pool } = require('../config/db');

/**
 * GET /api/reports/trip/:tripId
 * Executes the MySQL Stored Procedure `Generate_Trip_Report(p_trip_id)`
 * Returns comprehensive aggregate safety, occupancy, and route performance metrics.
 */
async function getTripSafetyReport(req, res, next) {
    try {
        const tripId = Number(req.params.tripId);
        if (!Number.isInteger(tripId) || tripId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid trip ID. ID must be a positive integer.'
            });
        }

        // Check if the trip exists first to provide clear 404 response
        const [tripCheck] = await pool.query('SELECT trip_id FROM Trip WHERE trip_id = ?', [tripId]);
        if (tripCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Trip with ID ${tripId} not found in database.`
            });
        }

        // Call the MySQL Stored Procedure
        // mysql2 returns an array: [ [ rowsFromProcedure ], OkPacket ]
        const [procResults] = await pool.query('CALL Generate_Trip_Report(?)', [tripId]);

        // Validate procedure output structure
        if (!procResults || !Array.isArray(procResults[0]) || procResults[0].length === 0) {
            return res.status(404).json({
                success: false,
                message: `No report data generated for Trip #${tripId}.`
            });
        }

        const reportData = procResults[0][0];

        // Ensure numeric fields are cast cleanly for JSON consumers
        const formattedReport = {
            trip_id: Number(reportData.trip_id),
            trip_date: reportData.trip_date,
            start_time: reportData.start_time,
            end_time: reportData.end_time,
            trip_status: reportData.trip_status,
            bus_number: reportData.bus_number,
            bus_type: reportData.bus_type,
            bus_capacity: Number(reportData.bus_capacity),
            driver_name: reportData.driver_name,
            route_name: reportData.route_name,
            source: reportData.source,
            destination: reportData.destination,
            distance_km: reportData.distance_km !== null ? Number(reportData.distance_km) : null,
            total_passenger_records: Number(reportData.total_passenger_records) || 0,
            maximum_passengers: Number(reportData.maximum_passengers) || 0,
            average_passengers: Number(reportData.average_passengers) || 0,
            maximum_occupancy_percentage: Number(reportData.maximum_occupancy_percentage) || 0,
            overcrowding_incident_count: Number(reportData.overcrowding_incident_count) || 0,
            total_safety_incidents: Number(reportData.total_safety_incidents) || 0
        };

        res.status(200).json({
            success: true,
            message: `Comprehensive safety report for Trip #${tripId} generated successfully.`,
            data: formattedReport
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getTripSafetyReport
};

