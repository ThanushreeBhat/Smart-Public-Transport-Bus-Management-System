-- =============================================================================
-- SMART BUS OVERCROWDING & PASSENGER SAFETY MANAGEMENT SYSTEM
-- Seed Data Script (MySQL 8.0+)
-- Realistic Sample Data: Mangaluru & Coastal Karnataka Transit Network
-- =============================================================================

USE smart_bus_safety;

-- Clear previous seed data if rerun (in safe foreign key order)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Safety_Incident;
TRUNCATE TABLE Passenger_Record;
TRUNCATE TABLE Trip;
TRUNCATE TABLE Bus_Stop;
TRUNCATE TABLE Route;
TRUNCATE TABLE Driver;
TRUNCATE TABLE Bus;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. BUS SEED DATA (6 Buses across various types & capacities)
-- =============================================================================
INSERT INTO Bus (bus_id, bus_number, capacity, bus_type, status) VALUES
(1, 'KA-19-F-1101', 45, 'Ordinary', 'Active'),
(2, 'KA-19-F-1102', 35, 'AC',       'Active'),
(3, 'KA-19-F-1103', 50, 'Express',  'Active'),
(4, 'KA-19-F-1104', 30, 'Ordinary', 'Active'),
(5, 'KA-20-E-2201', 55, 'Express',  'Active'),
(6, 'KA-19-F-1106', 40, 'Electric', 'Maintenance');

-- Reset Auto-Increment to continue safely after ID 6
ALTER TABLE Bus AUTO_INCREMENT = 7;

-- =============================================================================
-- 2. DRIVER SEED DATA (6 Licensed Drivers)
-- =============================================================================
INSERT INTO Driver (driver_id, name, phone, license_no, status) VALUES
(1, 'Ramesh Poojary',    '+91-9845012341', 'KA19-20150001234', 'On Duty'),
(2, 'Suresh Shetty',     '+91-9845012342', 'KA19-20160002345', 'On Duty'),
(3, 'Abdul Hameed',      '+91-9845012343', 'KA19-20170003456', 'Available'),
(4, 'Ganesh Kulal',      '+91-9845012344', 'KA20-20180004567', 'On Duty'),
(5, 'Prashanth Mendon',  '+91-9845012345', 'KA19-20190005678', 'Available'),
(6, 'Dinesh Acharya',    '+91-9845012346', 'KA20-20200006789', 'Inactive');

ALTER TABLE Driver AUTO_INCREMENT = 7;

-- =============================================================================
-- 3. ROUTE SEED DATA (4 Primary Transit Corridors)
-- =============================================================================
INSERT INTO Route (route_id, route_name, source, destination, distance_km) VALUES
(1, 'Route 15: State Bank - Surathkal Express', 'State Bank, Mangaluru', 'Surathkal NITK', 18.50),
(2, 'Route 31: Mangaluru - Udupi Express',     'State Bank, Mangaluru', 'Udupi City Bus Stand', 55.00),
(3, 'Route 4C: Hampankatta - Pumpwell Circular','Hampankatta',           'Pumpwell Circle', 8.20),
(4, 'Route 22: Kankanady - Moodbidri',          'Kankanady Market',      'Moodbidri Bus Stand', 34.00);

ALTER TABLE Route AUTO_INCREMENT = 5;

-- =============================================================================
-- 4. BUS_STOP SEED DATA (Ordered stops for each route)
-- =============================================================================
-- Route 1: State Bank -> Surathkal (18.5 km)
INSERT INTO Bus_Stop (stop_id, route_id, stop_name, stop_order) VALUES
(1, 1, 'State Bank Terminal', 1),
(2, 1, 'Hampankatta Signal',   2),
(3, 1, 'PVS Circle',          3),
(4, 1, 'KSRTC Bejai',         4),
(5, 1, 'Kottara Chowki',      5),
(6, 1, 'Kulur Bridge',        6),
(7, 1, 'Baikampady Gate',     7),
(8, 1, 'Surathkal Bus Stand', 8),
(9, 1, 'NITK Campus Gate',    9);

-- Route 2: Mangaluru -> Udupi (55 km)
INSERT INTO Bus_Stop (stop_id, route_id, stop_name, stop_order) VALUES
(10, 2, 'State Bank Terminal', 1),
(11, 2, 'Kottara Chowki',      2),
(12, 2, 'Surathkal Stand',     3),
(13, 2, 'Mulki Old Bus Stand', 4),
(14, 2, 'Padubidri Junction',  5),
(15, 2, 'Kaup Light House Rd', 6),
(16, 2, 'Katapadi Circle',     7),
(17, 2, 'Udupi City Bus Stand', 8);

-- Route 3: Hampankatta -> Pumpwell Circular (8.2 km)
INSERT INTO Bus_Stop (stop_id, route_id, stop_name, stop_order) VALUES
(18, 3, 'Hampankatta Junction', 1),
(19, 3, 'Jyothi Circle',        2),
(20, 3, 'KMC Hospital Road',    3),
(21, 3, 'Kankanady Circle',     4),
(22, 3, 'Pumpwell Flyover',     5),
(23, 3, 'Nanthoor Circle',      6),
(24, 3, 'Mallikatta Circle',    7),
(25, 3, 'Hampankatta Terminal', 8);

-- Route 4: Kankanady -> Moodbidri (34 km)
INSERT INTO Bus_Stop (stop_id, route_id, stop_name, stop_order) VALUES
(26, 4, 'Kankanady Market',  1),
(27, 4, 'Nanthoor Junction', 2),
(28, 4, 'Vamanjoor Church',  3),
(29, 4, 'Gurupura Bridge',   4),
(30, 4, 'Kaikamba Circle',   5),
(31, 4, 'Mijar Alvas Campus', 6),
(32, 4, 'Moodbidri Bus Stand', 7);

ALTER TABLE Bus_Stop AUTO_INCREMENT = 33;

-- =============================================================================
-- 5. TRIP SEED DATA (9 Realistic Scheduled/In Progress/Completed Trips)
-- Note: Uses CURDATE() and CURDATE() - INTERVAL 1 DAY for dynamic current demonstration
-- =============================================================================
INSERT INTO Trip (trip_id, bus_id, driver_id, route_id, trip_date, start_time, end_time, status) VALUES
-- Trip 1: Today Morning Rush - Surathkal (Capacity 45) -> Will have overcrowding snapshot
(1, 1, 1, 1, CURDATE(), '08:00:00', '09:10:00', 'In Progress'),

-- Trip 2: Today Morning Udupi Express (Capacity 50) -> Normal occupancy
(2, 3, 2, 2, CURDATE(), '08:30:00', '10:00:00', 'In Progress'),

-- Trip 3: Today Circular Shuttle (Capacity 30) -> High passenger demand, will have overcrowding
(3, 4, 4, 3, CURDATE(), '09:00:00', '09:50:00', 'In Progress'),

-- Trip 4: Today Moodbidri College Shuttle (Capacity 35) -> Scheduled
(4, 2, 3, 4, CURDATE(), '11:00:00', '12:30:00', 'Scheduled'),

-- Trip 5: Today Afternoon Surathkal (Capacity 45) -> Scheduled
(5, 1, 1, 1, CURDATE(), '13:30:00', '14:40:00', 'Scheduled'),

-- Trip 6: Today Evening Express Udupi (Capacity 55) -> Scheduled
(6, 5, 2, 2, CURDATE(), '17:00:00', '18:45:00', 'Scheduled'),

-- Trip 7: Yesterday Morning Express (Capacity 50) -> Completed
(7, 3, 1, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:00:00', '09:15:00', 'Completed'),

-- Trip 8: Yesterday Udupi Intercity (Capacity 55) -> Completed with resolved incident
(8, 5, 4, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '09:30:00', '11:15:00', 'Completed'),

-- Trip 9: Today Cancelled Trip due to bus inspection
(9, 2, 5, 3, CURDATE(), '07:30:00', '08:15:00', 'Cancelled');

ALTER TABLE Trip AUTO_INCREMENT = 10;

-- =============================================================================
-- 6. PASSENGER_RECORD SEED DATA
-- Important: passenger_count represents total passengers on the bus at that stop.
-- Note: When trigger.sql is imported AFTER this seed script, it will handle live inserts.
-- =============================================================================
-- Trip 1: Bus 1 (Capacity = 45). Overcrowded at Kottara Chowki (56 passengers)!
INSERT INTO Passenger_Record (record_id, trip_id, boarding_stop, exit_stop, passenger_count, recorded_at) VALUES
(1, 1, 'State Bank Terminal', 'Hampankatta Signal', 28, CONCAT(CURDATE(), ' 08:05:00')),
(2, 1, 'Hampankatta Signal',   'PVS Circle',        38, CONCAT(CURDATE(), ' 08:18:00')),
(3, 1, 'PVS Circle',          'KSRTC Bejai',       44, CONCAT(CURDATE(), ' 08:28:00')),
(4, 1, 'Kottara Chowki',      'Kulur Bridge',      56, CONCAT(CURDATE(), ' 08:42:00')), -- OVERCROWDED (56 > 45)
(5, 1, 'Kulur Bridge',        'Baikampady Gate',   52, CONCAT(CURDATE(), ' 08:52:00')); -- Still overcrowded

-- Trip 2: Bus 3 (Capacity = 50). Normal operation throughout
INSERT INTO Passenger_Record (record_id, trip_id, boarding_stop, exit_stop, passenger_count, recorded_at) VALUES
(6, 2, 'State Bank Terminal', 'Kottara Chowki',    32, CONCAT(CURDATE(), ' 08:35:00')),
(7, 2, 'Kottara Chowki',      'Surathkal Stand',   46, CONCAT(CURDATE(), ' 08:55:00')),
(8, 2, 'Surathkal Stand',     'Mulki Old Bus Stand', 42, CONCAT(CURDATE(), ' 09:15:00')),
(9, 2, 'Padubidri Junction',  'Udupi City Bus Stand', 35, CONCAT(CURDATE(), ' 09:40:00'));

-- Trip 3: Bus 4 (Capacity = 30). Overcrowded at Jyothi Circle (38 passengers)!
INSERT INTO Passenger_Record (record_id, trip_id, boarding_stop, exit_stop, passenger_count, recorded_at) VALUES
(10, 3, 'Hampankatta Junction', 'Jyothi Circle',     22, CONCAT(CURDATE(), ' 09:05:00')),
(11, 3, 'Jyothi Circle',        'KMC Hospital Road', 38, CONCAT(CURDATE(), ' 09:15:00')), -- OVERCROWDED (38 > 30)
(12, 3, 'KMC Hospital Road',    'Kankanady Circle',  35, CONCAT(CURDATE(), ' 09:25:00'));

-- Trip 7: Yesterday Trip (Bus 3, Capacity = 50). Normal history
INSERT INTO Passenger_Record (record_id, trip_id, boarding_stop, exit_stop, passenger_count, recorded_at) VALUES
(13, 7, 'State Bank Terminal', 'Kottara Chowki',    25, CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 08:10:00')),
(14, 7, 'Kottara Chowki',      'Surathkal Bus Stand', 48, CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 08:45:00'));

-- Trip 8: Yesterday Trip (Bus 5, Capacity = 55). Had morning surge (62 passengers)
INSERT INTO Passenger_Record (record_id, trip_id, boarding_stop, exit_stop, passenger_count, recorded_at) VALUES
(15, 8, 'State Bank Terminal', 'Kottara Chowki',    40, CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 09:35:00')),
(16, 8, 'Kottara Chowki',      'Surathkal Stand',   62, CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 10:05:00')), -- OVERCROWDED (62 > 55)
(17, 8, 'Mulki Old Bus Stand', 'Udupi City Bus Stand', 50, CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 10:45:00'));

ALTER TABLE Passenger_Record AUTO_INCREMENT = 18;

-- =============================================================================
-- 7. SAFETY_INCIDENT SEED DATA
-- Pre-seeding historical & active incidents so dashboard & queries show rich data
-- (Live trigger will create new incidents dynamically on subsequent inserts)
-- =============================================================================
INSERT INTO Safety_Incident (incident_id, trip_id, incident_type, description, severity, status, reported_at, resolved_at) VALUES
-- Incident 1: Overcrowding on Trip 1 (Active / Open)
(1, 1, 'Overcrowding', 
 'Automated Alert: Overcrowding detected on Trip #1 at stop "Kottara Chowki". Observed: 56 passengers, Permitted Bus Capacity: 45. Exceeded by: 11.',
 'High', 'Open', CONCAT(CURDATE(), ' 08:42:00'), NULL),

-- Incident 2: Overcrowding on Trip 3 (Investigating)
(2, 3, 'Overcrowding', 
 'Automated Alert: Overcrowding detected on Trip #3 at stop "Jyothi Circle". Observed: 38 passengers, Permitted Bus Capacity: 30. Exceeded by: 8.',
 'High', 'Investigating', CONCAT(CURDATE(), ' 09:15:00'), NULL),

-- Incident 3: Yesterday resolved overcrowding on Trip 8
(3, 8, 'Overcrowding', 
 'Automated Alert: Overcrowding detected on Trip #8 at stop "Kottara Chowki". Observed: 62 passengers, Permitted Bus Capacity: 55. Exceeded by: 7.',
 'High', 'Resolved', 
 CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 10:05:00'), 
 CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 10:45:00')),

-- Incident 4: Non-overcrowding safety issue on Trip 7 (Door sensor malfunction)
(4, 7, 'Passenger Safety', 
 'Rear pneumatic passenger door mechanism was slow to close at KSRTC Bejai stop; verified and cleared by technician.',
 'Medium', 'Resolved', 
 CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 08:25:00'), 
 CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 09:30:00')),

-- Incident 5: Medical assistance requested on Trip 2 (Resolved)
(5, 2, 'Medical Emergency', 
 'Elderly passenger felt dizzy due to heat near Surathkal; conductor administered first aid and water. Passenger safely disembarked.',
 'Medium', 'Resolved', 
 CONCAT(CURDATE(), ' 09:10:00'), 
 CONCAT(CURDATE(), ' 09:25:00'));

ALTER TABLE Safety_Incident AUTO_INCREMENT = 6;
