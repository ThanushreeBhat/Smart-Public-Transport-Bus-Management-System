// =============================================================================
// Passenger Monitoring Controller
// Member A: Database Engineer & Backend Developer
// =============================================================================

const { pool } = require('../config/db');

function formatPassengerRecord(rec, busNumber, busCapacity) {
    const count = rec.passenger_count;
    const capacity = busCapacity || 50;
    const isOvercrowded = count > capacity;
    const occupancyPct = capacity > 0 ? Number(((count / capacity) * 100).toFixed(1)) : 0;

    return {
        ...rec,
        id: rec.record_id,
        bus: busNumber,
        count: count,
        capacity: capacity,
        occupancy: occupancyPct,
        status: isOvercrowded ? 'Overcrowded' : 'Normal',
        bus_capacity: capacity,
        occupancy_percentage: occupancyPct,
        overcrowded: isOvercrowded
    };
}

/**
 * GET /api/passengers/:tripId
 * Retrieve all point-in-time passenger occupancy snapshots for a trip (or bus number)
 */
async function getPassengerRecordsByTrip(req, res, next) {
    try {
        let tripParam = req.params.tripId;
        let tripId = Number(tripParam);

        let tripRows;
        if (Number.isInteger(tripId) && tripId > 0) {
            [tripRows] = await pool.query(`
                SELECT t.trip_id, t.trip_date, b.bus_number, b.capacity AS bus_capacity
                FROM Trip t
                INNER JOIN Bus b ON t.bus_id = b.bus_id
                WHERE t.trip_id = ?
            `, [tripId]);
        } else {
            // Check if tripParam was a bus number e.g. 'KA-19-1234'
            [tripRows] = await pool.query(`
                SELECT t.trip_id, t.trip_date, b.bus_number, b.capacity AS bus_capacity
                FROM Trip t
                INNER JOIN Bus b ON t.bus_id = b.bus_id
                WHERE b.bus_number = ?
                ORDER BY t.trip_id DESC LIMIT 1
            `, [tripParam]);
        }

        if (!tripRows || tripRows.length === 0) {
            // Return empty list gracefully if trip not yet started
            return res.status(200).json({
                success: true,
                message: 'No records found for specified trip/bus.',
                data: []
            });
        }

        const activeTrip = tripRows[0];
        tripId = activeTrip.trip_id;
        const busCapacity = activeTrip.bus_capacity;
        const busNumber = activeTrip.bus_number;

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
            ORDER BY recorded_at DESC, record_id DESC
        `, [tripId]);

        const formatted = records.map(r => formatPassengerRecord(r, busNumber, busCapacity));

        res.status(200).json({
            success: true,
            message: `Passenger records for Trip #${tripId} retrieved successfully.`,
            data: formatted
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/passengers
 * Record a point-in-time passenger count snapshot during a trip.
 */
async function recordPassengerCount(req, res, next) {
    try {
        let { trip_id, bus, boarding_stop, exit_stop, passenger_count, count } = req.body;

        const inputCount = passenger_count !== undefined ? passenger_count : count;
        const numCount = Number(inputCount);
        if (!Number.isInteger(numCount) || numCount < 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation error: passenger_count must be a non-negative integer (0 or greater).'
            });
        }

        // Resolve trip_id
        let resolvedTripId = Number(trip_id);
        const busIdentifier = bus || trip_id;

        if (!resolvedTripId || resolvedTripId <= 0) {
            if (busIdentifier) {
                // Find latest trip for this bus
                const [matchedTrips] = await pool.query(`
                    SELECT t.trip_id, b.bus_number, b.capacity AS bus_capacity
                    FROM Trip t
                    INNER JOIN Bus b ON t.bus_id = b.bus_id
                    WHERE b.bus_number = ? OR t.trip_id = ?
                    ORDER BY t.trip_id DESC LIMIT 1
                `, [busIdentifier, busIdentifier]);

                if (matchedTrips.length > 0) {
                    resolvedTripId = matchedTrips[0].trip_id;
                }
            }
        }

        if (!resolvedTripId) {
            return res.status(400).json({ success: false, message: 'Validation error: valid trip_id or bus is required.' });
        }

        // Verify Trip exists and retrieve assigned Bus capacity
        const [tripInfo] = await pool.query(`
            SELECT t.trip_id, t.status, b.bus_number, b.capacity AS bus_capacity
            FROM Trip t
            INNER JOIN Bus b ON t.bus_id = b.bus_id
            WHERE t.trip_id = ?
        `, [resolvedTripId]);

        if (tripInfo.length === 0) {
            return res.status(404).json({ success: false, message: `Trip with ID ${resolvedTripId} does not exist.` });
        }

        const busCapacity = tripInfo[0].bus_capacity;
        const busNumber = tripInfo[0].bus_number;
        const stopName = (boarding_stop && boarding_stop.trim()) || 'Current Stop';

        // Insert into Passenger_Record. MySQL trigger 'trg_passenger_overcrowding' fires automatically!
        const [insertResult] = await pool.query(`
            INSERT INTO Passenger_Record (trip_id, boarding_stop, exit_stop, passenger_count, recorded_at)
            VALUES (?, ?, ?, ?, NOW())
        `, [resolvedTripId, stopName, exit_stop ? exit_stop.trim() : null, numCount]);

        const newRecordId = insertResult.insertId;

        const [savedRows] = await pool.query(
            'SELECT record_id, trip_id, boarding_stop, exit_stop, passenger_count, recorded_at FROM Passenger_Record WHERE record_id = ?',
            [newRecordId]
        );

        const formatted = formatPassengerRecord(savedRows[0], busNumber, busCapacity);

        res.status(201).json({
            success: true,
            message: formatted.overcrowded 
                ? `Passenger snapshot recorded. WARNING: Overcrowding detected (${numCount}/${busCapacity}). Automated safety alert evaluated by database trigger.`
                : 'Passenger snapshot recorded successfully within bus capacity limits.',
            data: formatted
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getPassengerRecordsByTrip,
    recordPassengerCount
};
