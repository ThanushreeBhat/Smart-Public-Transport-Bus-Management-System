// =============================================================================
// Driver Controller
// Member A: Database Engineer & Backend Developer
// =============================================================================

const { pool } = require('../config/db');

/**
 * GET /api/drivers
 * Retrieve all drivers with optional status filtering
 */
async function getAllDrivers(req, res, next) {
    try {
        const { status } = req.query;
        let query = 'SELECT driver_id, name, phone, license_no, status, created_at FROM Driver';
        const params = [];

        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
        }
        query += ' ORDER BY driver_id ASC';

        const [rows] = await pool.query(query, params);
        res.status(200).json({
            success: true,
            message: 'Drivers retrieved successfully.',
            data: rows
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/drivers/:id
 * Retrieve a specific driver by ID
 */
async function getDriverById(req, res, next) {
    try {
        const driverId = Number(req.params.id);
        if (!Number.isInteger(driverId) || driverId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid driver ID. ID must be a positive integer.'
            });
        }

        const [rows] = await pool.query(
            'SELECT driver_id, name, phone, license_no, status, created_at FROM Driver WHERE driver_id = ?',
            [driverId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Driver with ID ${driverId} not found.`
            });
        }

        res.status(200).json({
            success: true,
            message: 'Driver details retrieved successfully.',
            data: rows[0]
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/drivers
 * Create a new driver record
 */
async function createDriver(req, res, next) {
    try {
        const { name, phone, license_no, status = 'Available' } = req.body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Validation error: name is required.' });
        }
        if (!phone || typeof phone !== 'string' || phone.trim() === '') {
            return res.status(400).json({ success: false, message: 'Validation error: phone is required.' });
        }
        if (!license_no || typeof license_no !== 'string' || license_no.trim() === '') {
            return res.status(400).json({ success: false, message: 'Validation error: license_no is required.' });
        }

        const allowedStatuses = ['Available', 'On Duty', 'Inactive'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Validation error: status must be one of [${allowedStatuses.join(', ')}].`
            });
        }

        // Insert driver
        const [result] = await pool.query(
            'INSERT INTO Driver (name, phone, license_no, status) VALUES (?, ?, ?, ?)',
            [name.trim(), phone.trim(), license_no.trim().toUpperCase(), status]
        );

        const newDriverId = result.insertId;
        const [createdRows] = await pool.query(
            'SELECT driver_id, name, phone, license_no, status, created_at FROM Driver WHERE driver_id = ?',
            [newDriverId]
        );

        res.status(201).json({
            success: true,
            message: 'Driver created successfully.',
            data: createdRows[0]
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/drivers/:id
 * Update an existing driver record
 */
async function updateDriver(req, res, next) {
    try {
        const driverId = Number(req.params.id);
        if (!Number.isInteger(driverId) || driverId <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid driver ID.' });
        }

        const [existing] = await pool.query('SELECT driver_id FROM Driver WHERE driver_id = ?', [driverId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: `Driver with ID ${driverId} not found.` });
        }

        const { name, phone, license_no, status } = req.body;
        const updates = [];
        const params = [];

        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim() === '') {
                return res.status(400).json({ success: false, message: 'name cannot be empty.' });
            }
            updates.push('name = ?');
            params.push(name.trim());
        }

        if (phone !== undefined) {
            if (typeof phone !== 'string' || phone.trim() === '') {
                return res.status(400).json({ success: false, message: 'phone cannot be empty.' });
            }
            updates.push('phone = ?');
            params.push(phone.trim());
        }

        if (license_no !== undefined) {
            if (typeof license_no !== 'string' || license_no.trim() === '') {
                return res.status(400).json({ success: false, message: 'license_no cannot be empty.' });
            }
            updates.push('license_no = ?');
            params.push(license_no.trim().toUpperCase());
        }

        if (status !== undefined) {
            const allowedStatuses = ['Available', 'On Duty', 'Inactive'];
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({ success: false, message: `status must be one of [${allowedStatuses.join(', ')}].` });
            }
            updates.push('status = ?');
            params.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid update fields provided.' });
        }

        params.push(driverId);
        await pool.query(`UPDATE Driver SET ${updates.join(', ')} WHERE driver_id = ?`, params);

        const [updatedRows] = await pool.query(
            'SELECT driver_id, name, phone, license_no, status, created_at FROM Driver WHERE driver_id = ?',
            [driverId]
        );

        res.status(200).json({
            success: true,
            message: 'Driver updated successfully.',
            data: updatedRows[0]
        });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/drivers/:id
 * Delete a driver record if no scheduled trips reference them
 */
async function deleteDriver(req, res, next) {
    try {
        const driverId = Number(req.params.id);
        if (!Number.isInteger(driverId) || driverId <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid driver ID.' });
        }

        const [existing] = await pool.query('SELECT name FROM Driver WHERE driver_id = ?', [driverId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: `Driver with ID ${driverId} not found.` });
        }

        const [tripCheck] = await pool.query(
            'SELECT COUNT(*) AS trip_count FROM Trip WHERE driver_id = ?',
            [driverId]
        );

        if (tripCheck[0].trip_count > 0) {
            return res.status(409).json({
                success: false,
                message: `Cannot delete Driver "${existing[0].name}" because ${tripCheck[0].trip_count} trip(s) reference them. Consider marking driver status as 'Inactive' instead.`
            });
        }

        await pool.query('DELETE FROM Driver WHERE driver_id = ?', [driverId]);

        res.status(200).json({
            success: true,
            message: `Driver "${existing[0].name}" deleted successfully.`
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllDrivers,
    getDriverById,
    createDriver,
    updateDriver,
    deleteDriver
};
