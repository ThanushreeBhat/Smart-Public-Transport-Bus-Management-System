// =============================================================================
// Route & Stops Controller
// Member A: Database Engineer & Backend Developer
// =============================================================================

const { pool } = require('../config/db');

function formatRoute(row, stopsList = null) {
    if (!row) return row;
    const stopsArray = stopsList || (row.stops_str ? row.stops_str.split(' || ') : []);
    return {
        ...row,
        id: row.route_id,
        name: row.route_name,
        stops: stopsArray
    };
}

/**
 * GET /api/routes
 * Retrieve all routes along with their stop count, stop array, and terminal endpoints
 */
async function getAllRoutes(req, res, next) {
    try {
        const query = `
            SELECT 
                r.route_id, 
                r.route_name, 
                r.source, 
                r.destination, 
                r.distance_km, 
                r.created_at,
                COUNT(s.stop_id) AS total_stops,
                GROUP_CONCAT(s.stop_name ORDER BY s.stop_order SEPARATOR ' || ') AS stops_str
            FROM Route r
            LEFT JOIN Bus_Stop s ON r.route_id = s.route_id
            GROUP BY r.route_id, r.route_name, r.source, r.destination, r.distance_km, r.created_at
            ORDER BY r.route_id ASC
        `;

        const [rows] = await pool.query(query);
        res.status(200).json({
            success: true,
            message: 'Routes retrieved successfully.',
            data: rows.map(r => formatRoute(r))
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/routes/:id
 * Retrieve a single route along with its complete ordered sequence of bus stops
 */
async function getRouteById(req, res, next) {
    try {
        const routeId = Number(req.params.id);
        if (!Number.isInteger(routeId) || routeId <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid route ID.' });
        }

        const [routeRows] = await pool.query(
            'SELECT route_id, route_name, source, destination, distance_km, created_at FROM Route WHERE route_id = ?',
            [routeId]
        );

        if (routeRows.length === 0) {
            return res.status(404).json({ success: false, message: `Route with ID ${routeId} not found.` });
        }

        const [stopRows] = await pool.query(
            'SELECT stop_id, route_id, stop_name, stop_order FROM Bus_Stop WHERE route_id = ? ORDER BY stop_order ASC',
            [routeId]
        );

        const stopsNames = stopRows.map(s => s.stop_name);
        const routeData = {
            ...routeRows[0],
            id: routeRows[0].route_id,
            name: routeRows[0].route_name,
            stops: stopsNames,
            stops_detail: stopRows
        };

        res.status(200).json({
            success: true,
            message: 'Route details with ordered stops retrieved successfully.',
            data: routeData
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/routes
 * Create a new route and optionally its sequence of ordered stops atomically (Transaction)
 */
async function createRoute(req, res, next) {
    const connection = await pool.getConnection();
    try {
        const route_name = req.body.route_name || req.body.name;
        const source = req.body.source;
        const destination = req.body.destination;
        const distance_km = req.body.distance_km;
        const stops = req.body.stops;

        if (!route_name || typeof route_name !== 'string' || route_name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Validation error: route_name is required.' });
        }
        if (!source || typeof source !== 'string' || source.trim() === '') {
            return res.status(400).json({ success: false, message: 'Validation error: source is required.' });
        }
        if (!destination || typeof destination !== 'string' || destination.trim() === '') {
            return res.status(400).json({ success: false, message: 'Validation error: destination is required.' });
        }

        const numericDistance = distance_km !== undefined && distance_km !== null ? Number(distance_km) : null;
        if (numericDistance !== null && (isNaN(numericDistance) || numericDistance <= 0)) {
            return res.status(400).json({ success: false, message: 'Validation error: distance_km must be a positive number.' });
        }

        // Start transaction for atomic route + stops creation
        await connection.beginTransaction();

        const [routeResult] = await connection.query(
            'INSERT INTO Route (route_name, source, destination, distance_km) VALUES (?, ?, ?, ?)',
            [route_name.trim(), source.trim(), destination.trim(), numericDistance]
        );

        const newRouteId = routeResult.insertId;

        // If stops array is provided, insert them sequentially
        const stopsList = [];
        if (Array.isArray(stops) && stops.length > 0) {
            const stopValues = [];
            for (let i = 0; i < stops.length; i++) {
                const s = stops[i];
                const stopName = typeof s === 'string' ? s : s.stop_name;
                const stopOrder = s.stop_order !== undefined ? Number(s.stop_order) : (i + 1);

                if (stopName && typeof stopName === 'string' && stopName.trim() !== '') {
                    stopValues.push([newRouteId, stopName.trim(), stopOrder]);
                    stopsList.push(stopName.trim());
                }
            }

            if (stopValues.length > 0) {
                await connection.query(
                    'INSERT INTO Bus_Stop (route_id, stop_name, stop_order) VALUES ?',
                    [stopValues]
                );
            }
        }

        await connection.commit();

        // Fetch complete created route
        const [createdRoute] = await pool.query('SELECT * FROM Route WHERE route_id = ?', [newRouteId]);

        res.status(201).json({
            success: true,
            message: 'Route created successfully with ordered stops.',
            data: {
                ...createdRoute[0],
                id: createdRoute[0].route_id,
                name: createdRoute[0].route_name,
                stops: stopsList
            }
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
}

/**
 * PUT /api/routes/:id
 * Update route metadata and optionally replace its stops in a transaction
 */
async function updateRoute(req, res, next) {
    const connection = await pool.getConnection();
    try {
        const routeId = Number(req.params.id);
        if (!Number.isInteger(routeId) || routeId <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid route ID.' });
        }

        const [existing] = await pool.query('SELECT route_id FROM Route WHERE route_id = ?', [routeId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: `Route with ID ${routeId} not found.` });
        }

        const route_name = req.body.route_name !== undefined ? req.body.route_name : req.body.name;
        const source = req.body.source;
        const destination = req.body.destination;
        const distance_km = req.body.distance_km;
        const stops = req.body.stops;

        const updates = [];
        const params = [];

        if (route_name !== undefined) {
            if (typeof route_name !== 'string' || route_name.trim() === '') {
                return res.status(400).json({ success: false, message: 'route_name cannot be empty.' });
            }
            updates.push('route_name = ?');
            params.push(route_name.trim());
        }

        if (source !== undefined) {
            if (typeof source !== 'string' || source.trim() === '') {
                return res.status(400).json({ success: false, message: 'source cannot be empty.' });
            }
            updates.push('source = ?');
            params.push(source.trim());
        }

        if (destination !== undefined) {
            if (typeof destination !== 'string' || destination.trim() === '') {
                return res.status(400).json({ success: false, message: 'destination cannot be empty.' });
            }
            updates.push('destination = ?');
            params.push(destination.trim());
        }

        if (distance_km !== undefined) {
            const numDist = Number(distance_km);
            if (isNaN(numDist) || numDist <= 0) {
                return res.status(400).json({ success: false, message: 'distance_km must be a positive number.' });
            }
            updates.push('distance_km = ?');
            params.push(numDist);
        }

        await connection.beginTransaction();

        if (updates.length > 0) {
            params.push(routeId);
            await connection.query(`UPDATE Route SET ${updates.join(', ')} WHERE route_id = ?`, params);
        }

        // If stops array is supplied, replace stops
        const stopsList = [];
        if (Array.isArray(stops)) {
            await connection.query('DELETE FROM Bus_Stop WHERE route_id = ?', [routeId]);
            if (stops.length > 0) {
                const stopValues = [];
                stops.forEach((s, idx) => {
                    const stopName = typeof s === 'string' ? s : s.stop_name;
                    const stopOrder = s.stop_order !== undefined ? Number(s.stop_order) : (idx + 1);
                    if (stopName && typeof stopName === 'string' && stopName.trim() !== '') {
                        stopValues.push([routeId, stopName.trim(), stopOrder]);
                        stopsList.push(stopName.trim());
                    }
                });
                if (stopValues.length > 0) {
                    await connection.query('INSERT INTO Bus_Stop (route_id, stop_name, stop_order) VALUES ?', [stopValues]);
                }
            }
        }

        await connection.commit();

        const [updatedRoute] = await pool.query('SELECT * FROM Route WHERE route_id = ?', [routeId]);

        res.status(200).json({
            success: true,
            message: 'Route updated successfully.',
            data: {
                ...updatedRoute[0],
                id: updatedRoute[0].route_id,
                name: updatedRoute[0].route_name,
                stops: stopsList
            }
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
}

/**
 * DELETE /api/routes/:id
 * Delete a route if no scheduled trips reference it
 */
async function deleteRoute(req, res, next) {
    try {
        const routeId = Number(req.params.id);
        if (!Number.isInteger(routeId) || routeId <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid route ID.' });
        }

        const [existing] = await pool.query('SELECT route_name FROM Route WHERE route_id = ?', [routeId]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: `Route with ID ${routeId} not found.` });
        }

        // Verify dependent trips
        const [tripCheck] = await pool.query(
            'SELECT COUNT(*) AS trip_count FROM Trip WHERE route_id = ?',
            [routeId]
        );

        if (tripCheck[0].trip_count > 0) {
            return res.status(409).json({
                success: false,
                message: `Cannot delete Route "${existing[0].route_name}" because ${tripCheck[0].trip_count} scheduled trip(s) depend on it.`
            });
        }

        // Deleting route will cascade to Bus_Stop according to FK definition
        await pool.query('DELETE FROM Route WHERE route_id = ?', [routeId]);

        res.status(200).json({
            success: true,
            message: `Route "${existing[0].route_name}" and its associated stops were deleted successfully.`
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllRoutes,
    getRouteById,
    createRoute,
    updateRoute,
    deleteRoute
};
