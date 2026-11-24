-- =============================================================================
-- SMART BUS OVERCROWDING & PASSENGER SAFETY MANAGEMENT SYSTEM
-- MySQL Stored Procedure: Comprehensive Trip Safety & Performance Report
-- Member A: Database Engineer & Backend Developer
-- =============================================================================

USE smart_bus_safety;

DROP PROCEDURE IF EXISTS Generate_Trip_Report;

DELIMITER //

CREATE PROCEDURE Generate_Trip_Report(IN p_trip_id INT)
BEGIN
    -- Ensure safe execution and prevent division by zero
    -- We use pre-aggregated derived tables (subqueries) for passenger records and 
    -- safety incidents to avoid the Cartesian product problem that occurs when joining
    -- multiple one-to-many child tables directly to Trip.

    SELECT 
        t.trip_id,
        t.trip_date,
        t.start_time,
        t.end_time,
        t.status AS trip_status,
        b.bus_number,
        b.bus_type,
        b.capacity AS bus_capacity,
        d.name AS driver_name,
        r.route_name,
        r.source,
        r.destination,
        r.distance_km,
        
        -- Passenger occupancy aggregate metrics
        COALESCE(p_agg.total_passenger_records, 0) AS total_passenger_records,
        COALESCE(p_agg.maximum_passengers, 0) AS maximum_passengers,
        COALESCE(ROUND(p_agg.average_passengers, 1), 0.0) AS average_passengers,
        
        -- Maximum occupancy percentage calculation (prevent division by zero)
        ROUND(
            CASE 
                WHEN b.capacity > 0 AND p_agg.maximum_passengers IS NOT NULL 
                THEN (p_agg.maximum_passengers / b.capacity) * 100.0
                ELSE 0.00 
            END, 
            2
        ) AS maximum_occupancy_percentage,

        -- Safety incidents breakdown
        COALESCE(i_agg.overcrowding_incident_count, 0) AS overcrowding_incident_count,
        COALESCE(i_agg.total_safety_incidents, 0) AS total_safety_incidents

    FROM Trip t
    INNER JOIN Bus b ON t.bus_id = b.bus_id
    INNER JOIN Driver d ON t.driver_id = d.driver_id
    INNER JOIN Route r ON t.route_id = r.route_id

    -- Left join pre-aggregated passenger metrics
    LEFT JOIN (
        SELECT 
            trip_id,
            COUNT(record_id) AS total_passenger_records,
            MAX(passenger_count) AS maximum_passengers,
            AVG(passenger_count) AS average_passengers
        FROM Passenger_Record
        WHERE trip_id = p_trip_id
        GROUP BY trip_id
    ) p_agg ON t.trip_id = p_agg.trip_id

    -- Left join pre-aggregated safety incident metrics
    LEFT JOIN (
        SELECT 
            trip_id,
            COUNT(CASE WHEN incident_type = 'Overcrowding' THEN 1 END) AS overcrowding_incident_count,
            COUNT(incident_id) AS total_safety_incidents
        FROM Safety_Incident
        WHERE trip_id = p_trip_id
        GROUP BY trip_id
    ) i_agg ON t.trip_id = i_agg.trip_id

    WHERE t.trip_id = p_trip_id;

END //

DELIMITER ;

-- =============================================================================
-- WORKBENCH & CLI TESTING INSTRUCTIONS
-- =============================================================================
-- Test with Trip 1 (Active trip with high occupancy and overcrowding incidents):
-- CALL Generate_Trip_Report(1);
--
-- Test with Trip 2 (Trip with normal passenger occupancy):
-- CALL Generate_Trip_Report(2);
--
-- Test with Trip 4 (Scheduled trip with no passenger records or incidents yet):
-- CALL Generate_Trip_Report(4);
--
-- Test with non-existent Trip:
-- CALL Generate_Trip_Report(9999); -- (Returns empty result set cleanly)
-- =============================================================================
