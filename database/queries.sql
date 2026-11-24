-- =============================================================================
-- SMART BUS OVERCROWDING & PASSENGER SAFETY MANAGEMENT SYSTEM
-- Practical SQL Demonstration Queries (12 Key Analytical & Operational Queries)
-- Member A: Database Engineer & Backend Developer
-- =============================================================================

USE smart_bus_safety;

-- =============================================================================
-- QUERY 1: Active Fleet Inventory & Capacity Overview
-- Demonstrates: SELECT, WHERE, ORDER BY
-- Purpose: Lists all active transit buses categorized by type and passenger capacity.
-- =============================================================================
SELECT 
    bus_id,
    bus_number,
    bus_type,
    capacity,
    status,
    created_at
FROM Bus
WHERE status = 'Active'
ORDER BY capacity DESC, bus_number ASC;

-- =============================================================================
-- QUERY 2: Available Drivers Ready for Trip Assignment
-- Demonstrates: SELECT, WHERE with status filtering
-- Purpose: Finds all certified drivers who are currently not assigned or on duty.
-- =============================================================================
SELECT 
    driver_id,
    name AS driver_name,
    phone,
    license_no,
    status
FROM Driver
WHERE status = 'Available'
ORDER BY name ASC;

-- =============================================================================
-- QUERY 3: Transit Routes with Ordered Stops Sequence
-- Demonstrates: INNER JOIN, GROUP_CONCAT, GROUP BY, ORDER BY
-- Purpose: Displays each route with an aggregated string of ordered transit stops.
-- =============================================================================
SELECT 
    r.route_id,
    r.route_name,
    r.source,
    r.destination,
    r.distance_km,
    COUNT(s.stop_id) AS total_stops,
    GROUP_CONCAT(CONCAT(s.stop_order, '. ', s.stop_name) ORDER BY s.stop_order SEPARATOR ' -> ') AS ordered_itinerary
FROM Route r
LEFT JOIN Bus_Stop s ON r.route_id = s.route_id
GROUP BY r.route_id, r.route_name, r.source, r.destination, r.distance_km
ORDER BY r.route_id ASC;

-- =============================================================================
-- QUERY 4: Comprehensive Scheduled Trip Dispatch Board
-- Demonstrates: Multiple INNER JOINs, Date/Time formatting, String Concatenation
-- Purpose: Shows trip schedule with assigned vehicle, driver, and complete route metadata.
-- =============================================================================
SELECT 
    t.trip_id,
    t.trip_date,
    TIME_FORMAT(t.start_time, '%H:%i') AS departure_time,
    TIME_FORMAT(t.end_time, '%H:%i') AS expected_arrival,
    t.status AS trip_status,
    b.bus_number,
    b.bus_type,
    b.capacity AS bus_capacity,
    d.name AS assigned_driver,
    d.phone AS driver_phone,
    r.route_name,
    CONCAT(r.source, ' to ', r.destination) AS transit_corridor
FROM Trip t
INNER JOIN Bus b ON t.bus_id = b.bus_id
INNER JOIN Driver d ON t.driver_id = d.driver_id
INNER JOIN Route r ON t.route_id = r.route_id
ORDER BY t.trip_date DESC, t.start_time ASC;

-- =============================================================================
-- QUERY 5: Detection of Overcrowded Passenger Snapshots
-- Demonstrates: INNER JOIN, Arithmetic Expressions, WHERE clause comparing snapshot to capacity
-- Purpose: Pinpoints exact stops where onboard passenger count breached legal capacity.
-- =============================================================================
SELECT 
    pr.record_id,
    pr.trip_id,
    t.trip_date,
    b.bus_number,
    b.capacity AS authorized_capacity,
    pr.passenger_count AS observed_passengers,
    (pr.passenger_count - b.capacity) AS excess_passengers,
    ROUND(((pr.passenger_count / b.capacity) * 100), 1) AS occupancy_pct,
    pr.boarding_stop,
    pr.recorded_at
FROM Passenger_Record pr
INNER JOIN Trip t ON pr.trip_id = t.trip_id
INNER JOIN Bus b ON t.bus_id = b.bus_id
WHERE pr.passenger_count > b.capacity
ORDER BY pr.recorded_at DESC;

-- =============================================================================
-- QUERY 6: Passenger Occupancy Percentage & Utilization Categorization
-- Demonstrates: CASE expression, Mathematical operations, Aliasing
-- Purpose: Categorizes passenger snapshots into intuitive occupancy levels for dispatchers.
-- =============================================================================
SELECT 
    pr.record_id,
    pr.trip_id,
    b.bus_number,
    b.capacity,
    pr.passenger_count,
    ROUND(((pr.passenger_count / b.capacity) * 100), 2) AS occupancy_percentage,
    CASE 
        WHEN pr.passenger_count > b.capacity THEN 'CRITICAL: OVERCROWDED'
        WHEN pr.passenger_count >= (b.capacity * 0.90) THEN 'HIGH: Near Capacity (>= 90%)'
        WHEN pr.passenger_count >= (b.capacity * 0.50) THEN 'MODERATE: Balanced (50-89%)'
        ELSE 'LOW: Under-utilized (< 50%)'
    END AS occupancy_category,
    pr.boarding_stop,
    pr.recorded_at
FROM Passenger_Record pr
INNER JOIN Trip t ON pr.trip_id = t.trip_id
INNER JOIN Bus b ON t.bus_id = b.bus_id
ORDER BY pr.record_id DESC;

-- =============================================================================
-- QUERY 7: Trip Frequency and Scheduled Distance by Transit Route
-- Demonstrates: COUNT, SUM, COALESCE, GROUP BY, ORDER BY
-- Purpose: Evaluates route operations, total scheduled trips, and total route kilometers.
-- =============================================================================
SELECT 
    r.route_id,
    r.route_name,
    r.distance_km,
    COUNT(t.trip_id) AS total_scheduled_trips,
    SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) AS completed_trips,
    SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress_trips,
    ROUND(COUNT(t.trip_id) * COALESCE(r.distance_km, 0), 1) AS total_network_km
FROM Route r
LEFT JOIN Trip t ON r.route_id = t.route_id
GROUP BY r.route_id, r.route_name, r.distance_km
ORDER BY total_scheduled_trips DESC;

-- =============================================================================
-- QUERY 8: Safety Incidents Tally Grouped by Severity and Type
-- Demonstrates: Aggregate functions, GROUP BY multiple columns, Rollup simulation
-- Purpose: Identifies safety risk distribution across severity levels.
-- =============================================================================
SELECT 
    incident_type,
    severity,
    COUNT(*) AS incident_count,
    SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) AS open_count,
    SUM(CASE WHEN status = 'Investigating' THEN 1 ELSE 0 END) AS investigating_count,
    SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved_count
FROM Safety_Incident
GROUP BY incident_type, severity
ORDER BY 
    FIELD(severity, 'Critical', 'High', 'Medium', 'Low'),
    incident_count DESC;

-- =============================================================================
-- QUERY 9: Real-time Unresolved Safety Incidents Queue
-- Demonstrates: Multi-table JOIN, WHERE IN, Date calculation (Resolution Latency)
-- Purpose: Operational alert view for transport dispatchers showing pending issues.
-- =============================================================================
SELECT 
    i.incident_id,
    i.trip_id,
    i.incident_type,
    i.severity,
    i.status,
    i.description,
    i.reported_at,
    TIMESTAMPDIFF(MINUTE, i.reported_at, NOW()) AS minutes_since_reported,
    b.bus_number,
    d.name AS driver_name,
    d.phone AS driver_phone,
    r.route_name
FROM Safety_Incident i
INNER JOIN Trip t ON i.trip_id = t.trip_id
INNER JOIN Bus b ON t.bus_id = b.bus_id
INNER JOIN Driver d ON t.driver_id = d.driver_id
INNER JOIN Route r ON t.route_id = r.route_id
WHERE i.status IN ('Open', 'Investigating')
ORDER BY 
    FIELD(i.severity, 'Critical', 'High', 'Medium', 'Low'),
    i.reported_at ASC;

-- =============================================================================
-- QUERY 10: Route-Wise Safety and Overcrowding Performance Summary
-- Demonstrates: Subquery aggregations, LEFT JOIN, Aggregation across dimensions
-- Purpose: High-level management summary of safety records per transit corridor.
-- =============================================================================
SELECT 
    r.route_id,
    r.route_name,
    COUNT(DISTINCT t.trip_id) AS total_trips,
    COALESCE(SUM(i_sub.total_incidents), 0) AS total_safety_incidents,
    COALESCE(SUM(i_sub.overcrowding_incidents), 0) AS overcrowding_incidents,
    COALESCE(SUM(p_sub.overcrowded_snapshots), 0) AS overcrowded_snapshot_count
FROM Route r
LEFT JOIN Trip t ON r.route_id = t.route_id
LEFT JOIN (
    SELECT 
        trip_id,
        COUNT(incident_id) AS total_incidents,
        SUM(CASE WHEN incident_type = 'Overcrowding' THEN 1 ELSE 0 END) AS overcrowding_incidents
    FROM Safety_Incident
    GROUP BY trip_id
) i_sub ON t.trip_id = i_sub.trip_id
LEFT JOIN (
    SELECT 
        pr.trip_id,
        SUM(CASE WHEN pr.passenger_count > b.capacity THEN 1 ELSE 0 END) AS overcrowded_snapshots
    FROM Passenger_Record pr
    INNER JOIN Trip tr ON pr.trip_id = tr.trip_id
    INNER JOIN Bus b ON tr.bus_id = b.bus_id
    GROUP BY pr.trip_id
) p_sub ON t.trip_id = p_sub.trip_id
GROUP BY r.route_id, r.route_name
ORDER BY overcrowding_incidents DESC, total_trips DESC;

-- =============================================================================
-- QUERY 11: Top 5 Busiest Boarding Stops by Observed Passengers
-- Demonstrates: GROUP BY, Aggregates (MAX, AVG, COUNT), Subquery / JOIN
-- Purpose: Identifies hot spots where extra feeder buses should be deployed.
-- =============================================================================
SELECT 
    pr.boarding_stop,
    COUNT(pr.record_id) AS snapshot_frequency,
    MAX(pr.passenger_count) AS peak_passenger_count,
    ROUND(AVG(pr.passenger_count), 1) AS average_passenger_count
FROM Passenger_Record pr
GROUP BY pr.boarding_stop
ORDER BY peak_passenger_count DESC, snapshot_frequency DESC
LIMIT 5;

-- =============================================================================
-- QUERY 12: Driver Safety & Trip Execution Profile
-- Demonstrates: LEFT JOIN, GROUP BY, Aggregate CASE, HAVING
-- Purpose: Evaluates driver performance and safety incident distribution.
-- =============================================================================
SELECT 
    d.driver_id,
    d.name AS driver_name,
    d.license_no,
    d.status AS current_status,
    COUNT(DISTINCT t.trip_id) AS assigned_trips,
    SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) AS completed_trips,
    COUNT(DISTINCT i.incident_id) AS incidents_encountered
FROM Driver d
LEFT JOIN Trip t ON d.driver_id = t.driver_id
LEFT JOIN Safety_Incident i ON t.trip_id = i.trip_id
GROUP BY d.driver_id, d.name, d.license_no, d.status
ORDER BY assigned_trips DESC;
