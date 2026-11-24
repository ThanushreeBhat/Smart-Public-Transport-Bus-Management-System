// =============================================================================
// Trip Controller
// Member A: Database Engineer & Backend Developer
// =============================================================================

const { pool } = require('../config/db');

/**
 * GET /api/trips
 * Retrieve scheduled/in-progress/completed trips with joined Bus, Driver, and Route details
 */
async function getAllTrips(req, res, next) {
    try {
        const { status, date, bus_id, driver_id, route_id } = req.query;
        let query = `
            SELECT 
                t.trip_id,
                t.bus_id,
                b.bus_number,
                b.capacity AS bus_capacity,
                b.bus_type,
                t.driver_id,
                d.name AS driver_name,
                d.phone AS driver_phone,
                t.route_id,
                r.route_name,
                r.source,
                r.destination,
                r.distance_km,
                t.trip_date,
                t.start_time,
                t.end_time,
                t.status,
                t.created_at
            FROM Trip t
            INNER JOIN Bus b ON t.bus_id = b.bus_id
            INNER JOIN Driver d ON t.driver_id = d.driver_id
            INNER JOIN Route r ON t.route_id = r.route_id
        `;

        const params = [];
        const conditions = [];

        if (status) {
            conditions.push('t.status = ?');
            params.push(status);
        }
        if (date) {
            conditions.push('t.trip_date = ?');
            params.push(date);
        }
        if (bus_id) {
            conditions.push('t.bus_id = ?');
            params.push(Number(bus_id));
        }
        if (driver_id) {
            conditions.push('t.driver_id = ?');
            params.push(Number(driver_id));
        }
        if (route_id) {
            conditions.push('t.route_id = ?');
            params.push(Number(route_id));
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY t.trip_date DESC, t.start_time DESC';

        const [rows] = await pool.query(query, params);
        res.status(200).json({
            success: true,
            message: 'Trips retrieved successfully.',
            data: rows
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/trips/:id
 * Retrieve single trip with detailed bus, driver, route, and summary stats
 */
async function getTripById(req, res, next) {
    try {
        const tripId = Number(req.params.id);
        if (!Number.isInteger(tripId) || tripId <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid trip ID.' });
        }

        const query = `
            SELECT 
                t.trip_id,
                t.bus_id,
                b.bus_number,
                b.capacity AS bus_capacity,
                b.bus_type,
                t.driver_id,
                d.name AS driver_name,
                d.phone AS driver_phone,
                t.route_id,
                r.route_name,
                r.source,
                r.destination,
                r.distance_km,
                t.trip_date,
                t.start_time,
                t.end_time,
                t.status,
                t.created_at
            FROM Trip t
            INNER JOIN Bus b ON t.bus_id = b.bus_id
            INNER JOIN Driver d ON t.driver_id = d.driver_id
            INNER JOIN Route r ON t.route_id = r.route_id
            WHERE t.trip_id = ?
        `;

        const [rows] = await pool.query(query, [tripId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: `Trip with ID ${tripId} not found.` });
        }

        // Fetch recent passenger snapshot count & active incidents for quick trip overview
        const [passengerStats] = await pool.query(
            'SELECT COUNT(*) AS total_records, MAX(passenger_count) AS max_passenger_count FROM Passenger_Record WHERE trip_id = ?',
            [tripId]
        );

        const [incidentStats] = await pool.query(
            'SELECT COUNT(*) AS total_incidents, SUM(CASE WHEN status != "Resolved" THEN 1 ELSE 0 END) AS active_incidents FROM Safety_Incident WHERE trip_id = ?',
            [tripId]
        );

        const tripData = {
            ...rows[0],
            passenger_metrics: {
                total_records: passengerStats[0].total_records,
                max_passenger_count: passengerStats[0].max_passenger_count || 0
            },
            incident_metrics: {
                total_incidents: incidentStats[0].total_incidents,
                active_incidents: Number(incidentStats[0].active_incidents) || 0
            }
        };

        res.status(200).json({
            success: true,
            message: 'Trip details retrieved successfully.',
            data: tripData
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/trips
 * Schedule a new trip with existence, status, time, and conflict validation
 */
async function createTrip(req, res, next) {
    try {
        const { bus_id, driver_id, route_id, trip_date, start_time, end_time, status = 'Scheduled' } = req.body;

        // Validation
        const numBusId = Number(bus_id);
        const numDriverId = Number(driver_id);
        const numRouteId = Number(route_id);

        if (!numBusId || numBusId <= 0) {
            return res.status(400).json({ success: false, message: 'Validation error: valid bus_id is required.' });
        }
        if (!numDriverId || numDriverId <= 0) {
            return res.status(400).json({ success: false, message: 'Validation error: valid driver_id is required.' });
        }
        if (!numRouteId || numRouteId <= 0) {
            return res.status(400).json({ success: false, message: 'Validation error: valid route_id is required.' });
        }
        if (!trip_date || !/^\d{4}-\d{2}-\d{2}$/.test(trip_date)) {
            return res.status(400).json({ success: false, message: 'Validation error: trip_date in YYYY-MM-DD format is required.' });
        }
        if (!start_time) {
            return res.status(400).json({ success: false, message: 'Validation error: start_time is required.' });
        }
        if (end_time && end_time <= start_time) {
            return res.status(400).json({ success: false, message: 'Validation error: end_time must be later than start_time.' });
        }

        const allowedStatuses = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Validation error: status must be one of [${allowedStatuses.join(', ')}].` });
        }

        // Verify Bus exists and is available
        const [busRows] = await pool.query('SELECT bus_id, bus_number, status FROM Bus WHERE bus_id = ?', [numBusId]);
        if (busRows.length === 0) {
            return res.status(404).json({ success: false, message: `Bus with ID ${numBusId} does not exist.` });
        }
        if (busRows[0].status === 'Maintenance' || busRows[0].status === 'Inactive') {
            return res.status(400).json({
                success: false,
                message: `Bus "${busRows[0].bus_number}" cannot be scheduled because its status is "${busRows[0].status}".`
            });
        }

        // Verify Driver exists and is not inactive
        const [driverRows] = await pool.query('SELECT driver_id, name, status FROM Driver WHERE driver_id = ?', [numDriverId]);
        if (driverRows.length === 0) {
            return res.status(404).json({ success: false, message: `Driver with ID ${numDriverId} does not exist.` });
        }
        if (driverRows[0].status === 'Inactive') {
            return res.status(400).json({
                success: false,
                message: `Driver "${driverRows[0].name}" cannot be scheduled because their status is "Inactive".`
            });
        }

        // Verify Route exists
        const [routeRows] = await pool.query('SELECT route_id FROM Route WHERE route_id = ?', [numRouteId]);
        if (routeRows.length === 0) {
            return res.status(404).json({ success: false, message: `Route with ID ${numRouteId} does not exist.` });
        }

        // Simple scheduling conflict check:
        // Ensure neither the bus nor driver is already scheduled on an overlapping trip on the same date/start_time
        const [conflictCheck] = await pool.query(`
            SELECT trip_id, bus_id, driver_id, start_time, end_time 
            FROM Trip 
            WHERE trip_date = ? 
              AND status != 'Cancelled'
              AND (bus_id = ? OR driver_id = ?)
              AND (
                -- Direct start_time collision
                start_time = ?
                -- Or overlapping time slot when end_time is known
                OR (? IS NOT NULL AND end_time IS NOT NULL AND start_time < ? AND end_time > ?)
              )
        `, [trip_date, numBusId, numDriverId, start_time, end_time, end_time, start_time]);

        if (conflictCheck.length > 0) {
            const conflict = conflictCheck[0];
            const conflictType = conflict.bus_id === numBusId ? 'Bus' : 'Driver';
            return res.status(409).json({
                success: false,
                message: `Scheduling conflict: The assigned ${conflictType} is already scheduled on Trip #${conflict.trip_id} on ${trip_date} at ${conflict.start_time}.`
            });
        }

        // Insert Trip
        const [result] = await pool.query(`
            INSERT INTO Trip (bus_id, driver_id, route_id, trip_date, start_time, end_time, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [numBusId, numDriverId, numRouteId, trip_date, start_time, end_time || null, status]);

        const newTripId = result.insertId;

        // Fetch inserted trip with joined attributes
        const [createdTrip] = await pool.query(`
            SELECT 
                t.trip_id, t.bus_id, b.bus_number, b.capacity AS bus_capacity, b.bus_type,
                t.driver_id, d.name AS driver_name, d.phone AS driver_phone,
                t.route_id, r.route_name, r.source, r.destination,
                t.trip_date, t.start_time, t.end_time, t.status
            FROM Trip t
            INNER JOIN Bus b ON t.bus_id = b.bus_id
            INNER JOIN Driver d ON t.driver_id = d.driver_id
            INNER JOIN Route r ON t.route_id = r.route_id
            WHERE t.trip_id = ?
        `, [newTripId]);

        res.status(201).json({
            success: true,
            message: 'Trip scheduled successfully.',
            data: createdTrip[0]
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/trips/:id
 * Update an existing trip schedule or execution status
 */
async function updateTrip(req, res, next) {
    try {
        const tripId = Number(req.params.id);
        if (!Number.isInteger(tripId) || tripId <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid trip ID.' });
        }

        const [existing] = await pool.query('SELECT * FROM Trip WHERE trip_id = ?', [tripId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: `Trip with ID ${tripId} not found.` });
        }

        const { bus_id, driver_id, route_id, trip_date, start_time, end_time, status } = req.body;
        const updates = [];
        const params = [];

        if (bus_id !== undefined) {
            const numBus = Number(bus_id);
            if (!numBus || numBus <= 0) return res.status(400).json({ success: false, message: 'Invalid bus_id.' });
            updates.push('bus_id = ?');
            params.push(numBus);
        }

        if (driver_id !== undefined) {
            const numDriver = Number(driver_id);
            if (!numDriver || numDriver <= 0) return res.status(400).json({ success: false, message: 'Invalid driver_id.' });
            updates.push('driver_id = ?');
            params.push(numDriver);
        }

        if (route_id !== undefined) {
            const numRoute = Number(route_id);
            if (!numRoute || numRoute <= 0) return res.status(400).json({ success: false, message: 'Invalid route_id.' });
            updates.push('route_id = ?');
            params.push(numRoute);
        }

        if (trip_date !== undefined) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(trip_date)) {
                return res.status(400).json({ success: false, message: 'trip_date must be in YYYY-MM-DD format.' });
            }
            updates.push('trip_date = ?');
            params.push(trip_date);
        }

        if (start_time !== undefined) {
            updates.push('start_time = ?');
            params.push(start_time);
        }

        if (end_time !== undefined) {
            updates.push('end_time = ?');
            params.push(end_time || null);
        }

        if (status !== undefined) {
            const allowedStatuses = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({ success: false, message: `status must be one of [${allowedStatuses.join(', ')}].` });
            }
            updates.push('status = ?');
            params.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid update fields provided.' });
        }

        params.push(tripId);
        await pool.query(`UPDATE Trip SET ${updates.join(', ')} WHERE trip_id = ?`, params);

        // Fetch updated
        const [updated] = await pool.query(`
            SELECT 
                t.trip_id, t.bus_id, b.bus_number, b.capacity AS bus_capacity, b.bus_type,
                t.driver_id, d.name AS driver_name,
                t.route_id, r.route_name, r.source, r.destination,
                t.trip_date, t.start_time, t.end_time, t.status
            FROM Trip t
            INNER JOIN Bus b ON t.bus_id = b.bus_id
            INNER JOIN Driver d ON t.driver_id = d.driver_id
            INNER JOIN Route r ON t.route_id = r.route_id
            WHERE t.trip_id = ?
        `, [tripId]);

        res.status(200).json({
            success: true,
            message: 'Trip updated successfully.',
            data: updated[0]
        });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/trips/:id
 * Delete a trip record if no passenger records or incidents exist
 */
async function deleteTrip(req, res, next) {
    try {
        const tripId = Number(req.params.id);
        if (!Number.isInteger(tripId) || tripId <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid trip ID.' });
        }

        const [existing] = await pool.query('SELECT trip_id FROM Trip WHERE trip_id = ?', [tripId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: `Trip with ID ${tripId} not found.` });
        }

        // Check passenger records
        const [pCheck] = await pool.query('SELECT COUNT(*) AS count FROM Passenger_Record WHERE trip_id = ?', [tripId]);
        if (pCheck[0].count > 0) {
            return res.status(409).json({
                success: false,
                message: `Cannot delete Trip #${tripId} because it has ${pCheck[0].count} recorded passenger snapshot(s). Consider changing status to 'Cancelled' instead.`
            });
        }

        // Check safety incidents
        const [iCheck] = await pool.query('SELECT COUNT(*) AS count FROM Safety_Incident WHERE trip_id = ?', [tripId]);
        if (iCheck[0].count > 0) {
            return res.status(409).json({
                success: false,
                message: `Cannot delete Trip #${tripId} because ${iCheck[0].count} safety incident(s) are associated with it.`
            });
        }

        await pool.query('DELETE FROM Trip WHERE trip_id = ?', [tripId]);

        res.status(200).json({
            success: true,
            message: `Trip #${tripId} deleted successfully.`
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllTrips,
    getTripById,
    createTrip,
    updateTrip,
    deleteTrip
};
