// =============================================================================
// Dashboard Controller
// Member A: Database Engineer & Backend Developer
// =============================================================================

const { pool } = require('../config/db');

/**
 * GET /api/dashboard
 * Computes live operational dashboard metrics directly via database queries
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
                SUM(CASE WHEN status IN ('Available', 'Active') THEN 1 ELSE 0 END) AS available_drivers,
                SUM(CASE WHEN status = 'On Duty' THEN 1 ELSE 0 END) AS on_duty_drivers
            FROM Driver
        `);

        // Query 3: Today's Trips metrics
        const [tripStats] = await pool.query(`
            SELECT 
                COUNT(*) AS todays_trips,
                SUM(CASE WHEN status IN ('In Progress', 'Ongoing') THEN 1 ELSE 0 END) AS in_progress_trips,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_trips,
                SUM(CASE WHEN status = 'Scheduled' THEN 1 ELSE 0 END) AS scheduled_trips
            FROM Trip
            WHERE trip_date = CURDATE()
        `);

        // Query 4: Total trips overall
        const [totalTripsCount] = await pool.query('SELECT COUNT(*) AS total_trips FROM Trip');

        // Query 5: Safety Incidents & Overcrowded Trips metrics
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

        // Query 6: Recent Trips for Dashboard Display
        const [recentTrips] = await pool.query(`
            SELECT 
                t.trip_id,
                b.bus_number AS bus,
                r.route_name AS route,
                t.status
            FROM Trip t
            INNER JOIN Bus b ON t.bus_id = b.bus_id
            INNER JOIN Route r ON t.route_id = r.route_id
            ORDER BY t.trip_date DESC, t.start_time DESC
            LIMIT 5
        `);

        // Query 7: Safety Alerts for Dashboard Display
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

        const totalBuses = Number(busStats[0].total_buses) || 0;
        const todaysTrips = Number(tripStats[0].todays_trips) || 0;
        const overcrowdedTrips = Number(incidentStats[0].overcrowded_trips) || 0;
        const openIncidents = Number(incidentStats[0].open_incidents) || 0;

        const dashboardData = {
            total_buses: totalBuses,
            active_buses: Number(busStats[0].active_buses) || 0,
            total_drivers: Number(driverStats[0].total_drivers) || 0,
            available_drivers: Number(driverStats[0].available_drivers) || 0,
            on_duty_drivers: Number(driverStats[0].on_duty_drivers) || 0,
            todays_trips: todaysTrips,
            "today's_trips": todaysTrips,
            in_progress_trips: Number(tripStats[0].in_progress_trips) || 0,
            scheduled_trips: Number(tripStats[0].scheduled_trips) || 0,
            total_trips: Number(totalTripsCount[0].total_trips) || 0,
            overcrowded_trips: overcrowdedTrips,
            open_incidents: openIncidents,
            resolved_incidents: Number(incidentStats[0].resolved_incidents) || 0,
            total_incidents: Number(incidentStats[0].total_incidents) || 0,
            
            // Direct array of cards for frontend Dashboard.jsx
            stats: [
                {
                    title: 'Total Buses',
                    value: String(totalBuses).padStart(2, '0')
                },
                {
                    title: "Today's Trips",
                    value: String(todaysTrips).padStart(2, '0')
                },
                {
                    title: 'Overcrowded Trips',
                    value: String(overcrowdedTrips).padStart(2, '0')
                },
                {
                    title: 'Open Incidents',
                    value: String(openIncidents).padStart(2, '0')
                }
            ],
            recent_trips: recentTrips,
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
