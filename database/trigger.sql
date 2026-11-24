-- =============================================================================
-- SMART BUS OVERCROWDING & PASSENGER SAFETY MANAGEMENT SYSTEM
-- MySQL Trigger: Automated Passenger Overcrowding Safety Incident Generator
-- Member A: Database Engineer & Backend Developer
-- =============================================================================

USE smart_bus_safety;

DROP TRIGGER IF EXISTS trg_passenger_overcrowding;

DELIMITER //

CREATE TRIGGER trg_passenger_overcrowding
AFTER INSERT ON Passenger_Record
FOR EACH ROW
BEGIN
    -- Declare local variables to hold bus capacity and existing unresolved incident count
    DECLARE v_bus_capacity INT DEFAULT 0;
    DECLARE v_active_incident_count INT DEFAULT 0;
    DECLARE v_exceeded_count INT DEFAULT 0;

    -- Retrieve the assigned bus capacity for the trip associated with this passenger record
    SELECT b.capacity INTO v_bus_capacity
    FROM Trip t
    INNER JOIN Bus b ON t.bus_id = b.bus_id
    WHERE t.trip_id = NEW.trip_id;

    -- Check if the recorded occupancy exceeds the maximum legal bus capacity
    IF NEW.passenger_count > v_bus_capacity AND v_bus_capacity > 0 THEN
        
        -- Duplicate Prevention Policy:
        -- Check whether an unresolved ('Open' or 'Investigating') Overcrowding incident 
        -- is already active for this trip. This prevents flooding the incident table 
        -- with redundant alerts on consecutive stops during an ongoing crowded journey.
        SELECT COUNT(*) INTO v_active_incident_count
        FROM Safety_Incident
        WHERE trip_id = NEW.trip_id
          AND incident_type = 'Overcrowding'
          AND status IN ('Open', 'Investigating');

        -- If no active overcrowding incident exists, create a new High-severity incident
        IF v_active_incident_count = 0 THEN
            SET v_exceeded_count = NEW.passenger_count - v_bus_capacity;

            INSERT INTO Safety_Incident (
                trip_id,
                incident_type,
                description,
                severity,
                status,
                reported_at,
                resolved_at
            ) VALUES (
                NEW.trip_id,
                'Overcrowding',
                CONCAT(
                    'Automated Alert: Overcrowding detected on Trip #', NEW.trip_id,
                    ' at boarding stop "', NEW.boarding_stop, '". ',
                    'Observed Passenger Snapshot: ', NEW.passenger_count,
                    ', Authorized Bus Capacity: ', v_bus_capacity,
                    '. Capacity exceeded by ', v_exceeded_count, ' passengers.'
                ),
                'High',
                'Open',
                COALESCE(NEW.recorded_at, NOW()),
                NULL
            );
        END IF;

    END IF;
END //

DELIMITER ;

-- =============================================================================
-- VERIFICATION & DEMONSTRATION INSTRUCTIONS FOR VIVA / WORKBENCH
-- =============================================================================
-- 1. Test Normal Insert (Should NOT generate an incident):
--    Trip 4 uses Bus 2 with capacity 35. Insert count 25:
--    INSERT INTO Passenger_Record (trip_id, boarding_stop, passenger_count)
--    VALUES (4, 'Kankanady Market', 25);
--    Verify: SELECT * FROM Safety_Incident WHERE trip_id = 4; -- (Returns empty)
--
-- 2. Test Overcrowded Insert (SHOULD automatically generate High severity incident):
--    Insert count 42 (42 > 35):
--    INSERT INTO Passenger_Record (trip_id, boarding_stop, passenger_count)
--    VALUES (4, 'Nanthoor Junction', 42);
--    Verify: SELECT * FROM Safety_Incident WHERE trip_id = 4 AND incident_type = 'Overcrowding';
--    -- (Returns 1 Open High severity record with formatted description)
--
-- 3. Test Duplicate Prevention on subsequent overcrowded snapshot:
--    Insert count 45 while incident is still Open:
--    INSERT INTO Passenger_Record (trip_id, boarding_stop, passenger_count)
--    VALUES (4, 'Vamanjoor Church', 45);
--    Verify: SELECT COUNT(*) FROM Safety_Incident WHERE trip_id = 4 AND incident_type = 'Overcrowding';
--    -- (Count remains 1; no redundant open incident created)
--
-- 4. Test After Resolution:
--    UPDATE Safety_Incident SET status = 'Resolved', resolved_at = NOW() WHERE trip_id = 4;
--    INSERT INTO Passenger_Record (trip_id, boarding_stop, passenger_count)
--    VALUES (4, 'Gurupura Bridge', 44);
--    Verify: A new Open incident is now created because the prior one was resolved!
-- =============================================================================
