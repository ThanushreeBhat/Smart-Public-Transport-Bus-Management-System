// =============================================================================
// Safety Incident Controller
// Member A: Database Engineer & Backend Developer
// =============================================================================

const { pool } = require('../config/db');

/**
 * GET /api/incidents
 * Retrieve all safety incidents with optional query filters:
 * - trip_id, status, severity, incident_type
 * Returns enriched records with Bus, Driver, and Route metadata.
 */
async function getAllIncidents(req, res, next) {
    try {
        const { trip_id, status, severity, incident_type } = req.query;

        let query = `
            SELECT 
                i.incident_id,
                i.trip_id,
                i.incident_type,
                i.description,
                i.severity,
                i.status,
                i.reported_at,
                i.resolved_at,
                t.trip_date,
                t.start_time,
                b.bus_number,
                b.capacity AS bus_capacity,
                d.name AS driver_name,
                d.phone AS driver_phone,
                r.route_name,
                r.source,
                r.destination
            FROM Safety_Incident i
            INNER JOIN Trip t ON i.trip_id = t.trip_id
            INNER JOIN Bus b ON t.bus_id = b.bus_id
            INNER JOIN Driver d ON t.driver_id = d.driver_id
            INNER JOIN Route r ON t.route_id = r.route_id
        `;

        const params = [];
        const conditions = [];

        if (trip_id) {
            conditions.push('i.trip_id = ?');
            params.push(Number(trip_id));
        }
        if (status) {
            conditions.push('i.status = ?');
            params.push(status);
        }
        if (severity) {
            conditions.push('i.severity = ?');
            params.push(severity);
        }
        if (incident_type) {
            conditions.push('i.incident_type = ?');
            params.push(incident_type);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += `
            ORDER BY 
                FIELD(i.status, 'Open', 'Investigating', 'Resolved'),
                FIELD(i.severity, 'Critical', 'High', 'Medium', 'Low'),
                i.reported_at DESC
        `;

        const [rows] = await pool.query(query, params);

        res.status(200).json({
            success: true,
            message: 'Safety incidents retrieved successfully.',
            data: rows
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/incidents/:id
 * Retrieve details of a specific incident
 */
async function getIncidentById(req, res, next) {
    try {
        const incidentId = Number(req.params.id);
        if (!Number.isInteger(incidentId) || incidentId <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid incident ID.' });
        }

        const query = `
            SELECT 
                i.incident_id,
                i.trip_id,
                i.incident_type,
                i.description,
                i.severity,
                i.status,
                i.reported_at,
                i.resolved_at,
                t.trip_date,
                t.start_time,
                b.bus_number,
                b.capacity AS bus_capacity,
                d.name AS driver_name,
                d.phone AS driver_phone,
                r.route_name,
                r.source,
                r.destination
            FROM Safety_Incident i
            INNER JOIN Trip t ON i.trip_id = t.trip_id
            INNER JOIN Bus b ON t.bus_id = b.bus_id
            INNER JOIN Driver d ON t.driver_id = d.driver_id
            INNER JOIN Route r ON t.route_id = r.route_id
            WHERE i.incident_id = ?
        `;

        const [rows] = await pool.query(query, [incidentId]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Safety incident with ID ${incidentId} not found.`
            });
        }

        res.status(200).json({
            success: true,
            message: 'Incident details retrieved successfully.',
            data: rows[0]
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/incidents/:id/status
 * Update the status of an incident (Open -> Investigating -> Resolved)
 * Rules:
 * - When status is set to 'Resolved', resolved_at is set to current timestamp.
 * - When reopened ('Open' or 'Investigating'), resolved_at is cleared to NULL.
 * - Immutable fields (incident_id, trip_id) cannot be modified.
 */
async function updateIncidentStatus(req, res, next) {
    try {
        const incidentId = Number(req.params.id);
        if (!Number.isInteger(incidentId) || incidentId <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid incident ID.' });
        }

        const { status, description } = req.body;

        const allowedStatuses = ['Open', 'Investigating', 'Resolved'];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Validation error: status is required and must be one of [${allowedStatuses.join(', ')}].`
            });
        }

        // Verify incident existence
        const [existing] = await pool.query('SELECT incident_id, trip_id, status FROM Safety_Incident WHERE incident_id = ?', [incidentId]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Safety incident with ID ${incidentId} not found.`
            });
        }

        // Determine resolved_at adjustment
        let resolvedAtClause = 'resolved_at = NULL';
        if (status === 'Resolved') {
            resolvedAtClause = 'resolved_at = NOW()';
        }

        const updates = ['status = ?', resolvedAtClause];
        const params = [status];

        // Optional description append or note
        if (description !== undefined && typeof description === 'string' && description.trim() !== '') {
            updates.push('description = CONCAT(description, " | Note: ", ?)');
            params.push(description.trim());
        }

        params.push(incidentId);

        await pool.query(`UPDATE Safety_Incident SET ${updates.join(', ')} WHERE incident_id = ?`, params);

        // Fetch updated incident
        const [updatedRows] = await pool.query(`
            SELECT 
                incident_id, trip_id, incident_type, description, 
                severity, status, reported_at, resolved_at 
            FROM Safety_Incident 
            WHERE incident_id = ?
        `, [incidentId]);

        res.status(200).json({
            success: true,
            message: `Incident #${incidentId} status updated to '${status}'.`,
            data: updatedRows[0]
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/incidents
 * Manually report a non-overcrowding safety incident (e.g. Accident, Medical Emergency, Safety)
 */
async function createManualIncident(req, res, next) {
    try {
        const { trip_id, incident_type, description, severity = 'Medium' } = req.body;

        const numTripId = Number(trip_id);
        if (!numTripId || numTripId <= 0) {
            return res.status(400).json({ success: false, message: 'Validation error: valid trip_id is required.' });
        }

        const allowedTypes = ['Overcrowding', 'Accident', 'Medical Emergency', 'Passenger Safety', 'Other'];
        if (!incident_type || !allowedTypes.includes(incident_type)) {
            return res.status(400).json({
                success: false,
                message: `Validation error: incident_type must be one of [${allowedTypes.join(', ')}].`
            });
        }

        const allowedSeverities = ['Low', 'Medium', 'High', 'Critical'];
        if (!allowedSeverities.includes(severity)) {
            return res.status(400).json({
                success: false,
                message: `Validation error: severity must be one of [${allowedSeverities.join(', ')}].`
            });
        }

        // Verify trip exists
        const [tripRows] = await pool.query('SELECT trip_id FROM Trip WHERE trip_id = ?', [numTripId]);
        if (tripRows.length === 0) {
            return res.status(404).json({ success: false, message: `Trip with ID ${numTripId} not found.` });
        }

        const [result] = await pool.query(`
            INSERT INTO Safety_Incident (trip_id, incident_type, description, severity, status, reported_at)
            VALUES (?, ?, ?, ?, 'Open', NOW())
        `, [numTripId, incident_type, description ? description.trim() : null, severity]);

        const [createdRows] = await pool.query('SELECT * FROM Safety_Incident WHERE incident_id = ?', [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Safety incident logged successfully.',
            data: createdRows[0]
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllIncidents,
    getIncidentById,
    updateIncidentStatus,
    createManualIncident
};

