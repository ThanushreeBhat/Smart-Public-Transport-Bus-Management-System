// =============================================================================
// Dashboard Controller
// Member A: Database Engineer & Backend Developer
// =============================================================================

const { pool } = require('../config/db');

/**
 * GET /api/dashboard
 * Computes live operational dashboard metrics directly via database queries:
 * - total_buses
 * - active_buses
 * - total_drivers
 * - todays_trips
 * - overcrowded_trips (distinct trips with an unresolved Overcrowding incident)
 * - open_incidents
 * - resolved_incidents
 */
async function getDashboardSummary(req, res, next) {
    try {
        // Query 1: Bus metrics
        const [busStats] = await pool.query(`
            SELECT 
                COUNT(*) AS total_buses,
                SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active_buses
            FROM Bus
        `);

        // Query 2: Driver metrics
        const [driverStats] = await pool.query(`
            SELECT 
                COUNT(*) AS total_drivers,
                SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS available_drivers,
                SUM(CASE WHEN status = 'On Duty' THEN 1 ELSE 0 END) AS on_duty_drivers
            FROM Driver
        `);

        // Query 3: Today's Trips metrics
        const [tripStats] = await pool.query(`
            SELECT 
                COUNT(*) AS todays_trips,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress_trips,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_trips,
                SUM(CASE WHEN status = 'Scheduled' THEN 1 ELSE 0 END) AS scheduled_trips
            FROM Trip
            WHERE trip_date = CURDATE()
        `);

        // Query 4: Total trips overall
        const [totalTripsCount] = await pool.query('SELECT COUNT(*) AS total_trips FROM Trip');

        // Query 5: Safety Incidents & Overcrowded Trips metrics
        // Overcrowded trips rule: Distinct trips currently associated with an unresolved ('Open' or 'Investigating') Overcrowding incident
        const [incidentStats] = await pool.query(`
            SELECT 
                COUNT(*) AS total_incidents,
                SUM(CASE WHEN status IN ('Open', 'Investigating') THEN 1 ELSE 0 END) AS open_incidents,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved_incidents,
                COUNT(DISTINCT CASE 
                    WHEN incident_type = 'Overcrowding' AND status IN ('Open', 'Investigating') 
                    THEN trip_id 
                    ELSE NULL 
                END) AS overcrowded_trips
            FROM Safety_Incident
        `);

        // Query 6: Quick recent unresolved alerts list for dashboard ticker
        const [recentIncidents] = await pool.query(`
            SELECT 
                i.incident_id,
                i.trip_id,
                i.incident_type,
                i.severity,
                i.status,
                i.description,
                i.reported_at,
                b.bus_number,
                r.route_name
            FROM Safety_Incident i
            INNER JOIN Trip t ON i.trip_id = t.trip_id
            INNER JOIN Bus b ON t.bus_id = b.bus_id
            INNER JOIN Route r ON t.route_id = r.route_id
            WHERE i.status IN ('Open', 'Investigating')
            ORDER BY FIELD(i.severity, 'Critical', 'High', 'Medium', 'Low'), i.reported_at DESC
            LIMIT 5
        `);

        const dashboardData = {
            total_buses: Number(busStats[0].total_buses) || 0,
            active_buses: Number(busStats[0].active_buses) || 0,
            total_drivers: Number(driverStats[0].total_drivers) || 0,
            available_drivers: Number(driverStats[0].available_drivers) || 0,
            on_duty_drivers: Number(driverStats[0].on_duty_drivers) || 0,
            todays_trips: Number(tripStats[0].todays_trips) || 0,
            "today's_trips": Number(tripStats[0].todays_trips) || 0,
            in_progress_trips: Number(tripStats[0].in_progress_trips) || 0,
            scheduled_trips: Number(tripStats[0].scheduled_trips) || 0,
            total_trips: Number(totalTripsCount[0].total_trips) || 0,
            overcrowded_trips: Number(incidentStats[0].overcrowded_trips) || 0,
            open_incidents: Number(incidentStats[0].open_incidents) || 0,
            resolved_incidents: Number(incidentStats[0].resolved_incidents) || 0,
            total_incidents: Number(incidentStats[0].total_incidents) || 0,
            recent_unresolved_alerts: recentIncidents
        };

        res.status(200).json({
            success: true,
            message: 'Dashboard metrics retrieved successfully from database.',
            data: dashboardData
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getDashboardSummary
};

