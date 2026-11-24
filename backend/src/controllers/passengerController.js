// =============================================================================
// Passenger Monitoring Controller
// Member A: Database Engineer & Backend Developer
// =============================================================================

const { pool } = require('../config/db');

/**
 * GET /api/passengers/trip/:tripId
 * Retrieve all point-in-time passenger occupancy snapshots for a specific trip
 */
async function getPassengerRecordsByTrip(req, res, next) {
    try {
        const tripId = Number(req.params.tripId);
        if (!Number.isInteger(tripId) || tripId <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid trip ID.' });
        }

        // Verify trip existence and retrieve bus capacity
        const [tripRows] = await pool.query(`
            SELECT t.trip_id, t.trip_date, b.bus_number, b.capacity AS bus_capacity
            FROM Trip t
            INNER JOIN Bus b ON t.bus_id = b.bus_id
            WHERE t.trip_id = ?
        `, [tripId]);

        if (tripRows.length === 0) {
            return res.status(404).json({ success: false, message: `Trip with ID ${tripId} not found.` });
        }

        const busCapacity = tripRows[0].bus_capacity;

        // Fetch passenger records ordered chronologically
        const [records] = await pool.query(`
            SELECT 
                record_id,
                trip_id,
                boarding_stop,
                exit_stop,
                passenger_count,
                recorded_at
            FROM Passenger_Record
            WHERE trip_id = ?
            ORDER BY recorded_at ASC, record_id ASC
        `, [tripId]);

        // Enrich records with calculated occupancy percentage and overcrowding indicator
        const enrichedRecords = records.map(rec => {
            const occupancyPct = busCapacity > 0 ? Number(((rec.passenger_count / busCapacity) * 100).toFixed(2)) : 0;
            return {
                ...rec,
                bus_capacity: busCapacity,
                occupancy_percentage: occupancyPct,
                overcrowded: rec.passenger_count > busCapacity
            };
        });

        res.status(200).json({
            success: true,
            message: `Passenger records for Trip #${tripId} retrieved successfully.`,
            data: {
                trip: tripRows[0],
                records: enrichedRecords
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/passengers
 * Record a point-in-time passenger count snapshot during a trip.
 * 
 * IMPORTANT DESIGN CONTRACT:
 * - passenger_count represents the total number of passengers currently on the bus.
 * - This endpoint inserts into Passenger_Record.
 * - The MySQL Trigger 'trg_passenger_overcrowding' automatically executes in the database
 *   to generate a Safety_Incident alert if passenger_count > bus capacity.
 */
async function recordPassengerCount(req, res, next) {
    try {
        const { trip_id, boarding_stop, exit_stop, passenger_count } = req.body;

        const numTripId = Number(trip_id);
        if (!numTripId || numTripId <= 0) {
            return res.status(400).json({ success: false, message: 'Validation error: valid trip_id is required.' });
        }

        if (!boarding_stop || typeof boarding_stop !== 'string' || boarding_stop.trim() === '') {
            return res.status(400).json({ success: false, message: 'Validation error: boarding_stop is required.' });
        }

        const numCount = Number(passenger_count);
        if (!Number.isInteger(numCount) || numCount < 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation error: passenger_count must be a non-negative integer (0 or greater).'
            });
        }

        // Verify Trip exists and retrieve assigned Bus capacity
        const [tripInfo] = await pool.query(`
            SELECT t.trip_id, t.status, b.bus_number, b.capacity AS bus_capacity
            FROM Trip t
            INNER JOIN Bus b ON t.bus_id = b.bus_id
            WHERE t.trip_id = ?
        `, [numTripId]);

        if (tripInfo.length === 0) {
            return res.status(404).json({ success: false, message: `Trip with ID ${numTripId} does not exist.` });
        }

        const busCapacity = tripInfo[0].bus_capacity;

        // Insert into Passenger_Record.
        // NOTE: The MySQL trigger `trg_passenger_overcrowding` fires AFTER INSERT ON Passenger_Record
        const [insertResult] = await pool.query(`
            INSERT INTO Passenger_Record (trip_id, boarding_stop, exit_stop, passenger_count, recorded_at)
            VALUES (?, ?, ?, ?, NOW())
        `, [numTripId, boarding_stop.trim(), exit_stop ? exit_stop.trim() : null, numCount]);

        const newRecordId = insertResult.insertId;

        // Fetch inserted record
        const [savedRows] = await pool.query(
            'SELECT record_id, trip_id, boarding_stop, exit_stop, passenger_count, recorded_at FROM Passenger_Record WHERE record_id = ?',
            [newRecordId]
        );

        // Occupancy calculation formula
        const occupancyPercentage = busCapacity > 0 ? Number(((numCount / busCapacity) * 100).toFixed(2)) : 0;
        const isOvercrowded = numCount > busCapacity;

        res.status(201).json({
            success: true,
            message: isOvercrowded 
                ? `Passenger snapshot recorded. WARNING: Overcrowding detected (${numCount}/${busCapacity}). Automated safety alert evaluated by database trigger.`
                : 'Passenger snapshot recorded successfully within bus capacity limits.',
            data: {
                ...savedRows[0],
                bus_capacity: busCapacity,
                occupancy_percentage: occupancyPercentage,
                overcrowded: isOvercrowded
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getPassengerRecordsByTrip,
    recordPassengerCount
};
