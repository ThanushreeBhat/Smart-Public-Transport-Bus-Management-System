// =============================================================================
// Bus Controller
// Member A: Database Engineer & Backend Developer
// =============================================================================

const { pool } = require('../config/db');

const ALLOWED_BUS_TYPES = ['Ordinary', 'Express', 'AC', 'Electric', 'Standard', 'Mini Bus'];
const ALLOWED_BUS_STATUSES = ['Active', 'Maintenance', 'Inactive'];

function formatBus(row) {
    if (!row) return row;
    return {
        ...row,
        id: row.bus_id,
        number: row.bus_number,
        type: row.bus_type
    };
}

/**
 * GET /api/buses
 * Retrieve all buses with optional status and bus_type filtering
 */
async function getAllBuses(req, res, next) {
    try {
        const { status, bus_type } = req.query;
        let query = 'SELECT bus_id, bus_number, capacity, bus_type, status, created_at FROM Bus';
        const params = [];
        const conditions = [];

        if (status) {
            conditions.push('status = ?');
            params.push(status);
        }
        if (bus_type) {
            conditions.push('bus_type = ?');
            params.push(bus_type);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY bus_id ASC';

        const [rows] = await pool.query(query, params);
        res.status(200).json({
            success: true,
            message: 'Buses retrieved successfully.',
            data: rows.map(formatBus)
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/buses/:id
 * Retrieve a specific bus by ID
 */
async function getBusById(req, res, next) {
    try {
        const busId = Number(req.params.id);
        if (!Number.isInteger(busId) || busId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid bus ID. ID must be a positive integer.'
            });
        }

        const [rows] = await pool.query(
            'SELECT bus_id, bus_number, capacity, bus_type, status, created_at FROM Bus WHERE bus_id = ?',
            [busId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Bus with ID ${busId} not found.`
            });
        }

        res.status(200).json({
            success: true,
            message: 'Bus details retrieved successfully.',
            data: formatBus(rows[0])
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/buses
 * Create a new bus record
 */
async function createBus(req, res, next) {
    try {
        const bus_number = req.body.bus_number || req.body.number;
        const capacity = req.body.capacity;
        const bus_type = req.body.bus_type || req.body.type || 'Standard';
        const status = req.body.status || 'Active';

        // Validation
        if (!bus_number || typeof bus_number !== 'string' || bus_number.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Validation error: bus_number is required.'
            });
        }

        const numericCapacity = Number(capacity);
        if (!Number.isInteger(numericCapacity) || numericCapacity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation error: capacity must be a positive integer greater than 0.'
            });
        }

        if (!ALLOWED_BUS_TYPES.includes(bus_type)) {
            return res.status(400).json({
                success: false,
                message: `Validation error: bus_type must be one of [${ALLOWED_BUS_TYPES.join(', ')}].`
            });
        }

        if (!ALLOWED_BUS_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Validation error: status must be one of [${ALLOWED_BUS_STATUSES.join(', ')}].`
            });
        }

        // Insert new bus
        const [result] = await pool.query(
            'INSERT INTO Bus (bus_number, capacity, bus_type, status) VALUES (?, ?, ?, ?)',
            [bus_number.trim().toUpperCase(), numericCapacity, bus_type, status]
        );

        const newBusId = result.insertId;
        const [createdRows] = await pool.query(
            'SELECT bus_id, bus_number, capacity, bus_type, status, created_at FROM Bus WHERE bus_id = ?',
            [newBusId]
        );

        res.status(201).json({
            success: true,
            message: 'Bus created successfully.',
            data: formatBus(createdRows[0])
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/buses/:id
 * Update an existing bus record
 */
async function updateBus(req, res, next) {
    try {
        const busId = Number(req.params.id);
        if (!Number.isInteger(busId) || busId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid bus ID.'
            });
        }

        // Check bus existence
        const [existing] = await pool.query('SELECT bus_id FROM Bus WHERE bus_id = ?', [busId]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Bus with ID ${busId} not found.`
            });
        }

        const bus_number = req.body.bus_number !== undefined ? req.body.bus_number : req.body.number;
        const capacity = req.body.capacity;
        const bus_type = req.body.bus_type !== undefined ? req.body.bus_type : req.body.type;
        const status = req.body.status;

        const updates = [];
        const params = [];

        if (bus_number !== undefined) {
            if (typeof bus_number !== 'string' || bus_number.trim() === '') {
                return res.status(400).json({ success: false, message: 'bus_number cannot be empty.' });
            }
            updates.push('bus_number = ?');
            params.push(bus_number.trim().toUpperCase());
        }

        if (capacity !== undefined) {
            const numericCapacity = Number(capacity);
            if (!Number.isInteger(numericCapacity) || numericCapacity <= 0) {
                return res.status(400).json({ success: false, message: 'capacity must be a positive integer.' });
            }
            updates.push('capacity = ?');
            params.push(numericCapacity);
        }

        if (bus_type !== undefined) {
            if (!ALLOWED_BUS_TYPES.includes(bus_type)) {
                return res.status(400).json({ success: false, message: `bus_type must be one of [${ALLOWED_BUS_TYPES.join(', ')}].` });
            }
            updates.push('bus_type = ?');
            params.push(bus_type);
        }

        if (status !== undefined) {
            if (!ALLOWED_BUS_STATUSES.includes(status)) {
                return res.status(400).json({ success: false, message: `status must be one of [${ALLOWED_BUS_STATUSES.join(', ')}].` });
            }
            updates.push('status = ?');
            params.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid update fields provided.'
            });
        }

        params.push(busId);
        await pool.query(`UPDATE Bus SET ${updates.join(', ')} WHERE bus_id = ?`, params);

        const [updatedRows] = await pool.query(
            'SELECT bus_id, bus_number, capacity, bus_type, status, created_at FROM Bus WHERE bus_id = ?',
            [busId]
        );

        res.status(200).json({
            success: true,
            message: 'Bus updated successfully.',
            data: formatBus(updatedRows[0])
        });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/buses/:id
 * Delete a bus record if no dependent trips exist
 */
async function deleteBus(req, res, next) {
    try {
        const busId = Number(req.params.id);
        if (!Number.isInteger(busId) || busId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid bus ID.'
            });
        }

        // Verify existence
        const [existing] = await pool.query('SELECT bus_number FROM Bus WHERE bus_id = ?', [busId]);
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Bus with ID ${busId} not found.`
            });
        }

        // Check dependent trips
        const [tripCheck] = await pool.query(
            'SELECT COUNT(*) AS trip_count FROM Trip WHERE bus_id = ?',
            [busId]
        );

        if (tripCheck[0].trip_count > 0) {
            return res.status(409).json({
                success: false,
                message: `Cannot delete Bus "${existing[0].bus_number}" because ${tripCheck[0].trip_count} scheduled or completed trip(s) reference it. Consider setting status to 'Inactive' instead.`
            });
        }

        await pool.query('DELETE FROM Bus WHERE bus_id = ?', [busId]);

        res.status(200).json({
            success: true,
            message: `Bus "${existing[0].bus_number}" deleted successfully.`
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllBuses,
    getBusById,
    createBus,
    updateBus,
    deleteBus
};
