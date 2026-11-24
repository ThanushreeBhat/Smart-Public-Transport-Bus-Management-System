-- =============================================================================
-- SMART BUS OVERCROWDING & PASSENGER SAFETY MANAGEMENT SYSTEM
-- Database Schema Script (MySQL 8.0+)
-- Member A: Database Engineer & Backend Developer
-- =============================================================================

-- Step 1: Create Database if it does not already exist
CREATE DATABASE IF NOT EXISTS smart_bus_safety
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Step 2: Select the Database
USE smart_bus_safety;

-- Step 3: Disable foreign key checks temporarily during table recreation if executed in Workbench
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables in reverse dependency order for clean re-runs if needed
DROP TABLE IF EXISTS Safety_Incident;
DROP TABLE IF EXISTS Passenger_Record;
DROP TABLE IF EXISTS Trip;
DROP TABLE IF EXISTS Bus_Stop;
DROP TABLE IF EXISTS Route;
DROP TABLE IF EXISTS Driver;
DROP TABLE IF EXISTS Bus;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- TABLE 1: Bus
-- Purpose: Stores physical bus inventory, types, operational status, and capacity.
-- =============================================================================
CREATE TABLE Bus (
    bus_id INT AUTO_INCREMENT PRIMARY KEY,
    bus_number VARCHAR(20) NOT NULL,
    capacity INT NOT NULL,
    bus_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_bus_number UNIQUE (bus_number),
    CONSTRAINT chk_bus_capacity CHECK (capacity > 0),
    CONSTRAINT chk_bus_status CHECK (status IN ('Active', 'Maintenance', 'Inactive')),
    CONSTRAINT chk_bus_type CHECK (bus_type IN ('Ordinary', 'Express', 'AC', 'Electric', 'Standard', 'Mini Bus'))
) ENGINE=InnoDB;

CREATE INDEX idx_bus_status ON Bus (status);

-- =============================================================================
-- TABLE 2: Driver
-- Purpose: Stores commercial transport driver information, license, and duty status.
-- =============================================================================
CREATE TABLE Driver (
    driver_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    license_no VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_driver_phone UNIQUE (phone),
    CONSTRAINT uq_driver_license UNIQUE (license_no),
    CONSTRAINT chk_driver_status CHECK (status IN ('Available', 'On Duty', 'Inactive', 'Active'))
) ENGINE=InnoDB;

CREATE INDEX idx_driver_status ON Driver (status);

-- =============================================================================
-- TABLE 3: Route
-- Purpose: Defines transit lines connecting a designated source and destination.
-- =============================================================================
CREATE TABLE Route (
    route_id INT AUTO_INCREMENT PRIMARY KEY,
    route_name VARCHAR(100) NOT NULL,
    source VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    distance_km DECIMAL(7, 2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_route_distance CHECK (distance_km IS NULL OR distance_km > 0)
) ENGINE=InnoDB;

CREATE INDEX idx_route_source_dest ON Route (source, destination);

-- =============================================================================
-- TABLE 4: Bus_Stop
-- Purpose: Stores ordered sequence of intermediate boarding/alighting stops for a route.
-- =============================================================================
CREATE TABLE Bus_Stop (
    stop_id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    stop_name VARCHAR(100) NOT NULL,
    stop_order INT NOT NULL,
    CONSTRAINT fk_bus_stop_route FOREIGN KEY (route_id)
        REFERENCES Route (route_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT uq_route_stop_order UNIQUE (route_id, stop_order),
    CONSTRAINT chk_stop_order CHECK (stop_order > 0)
) ENGINE=InnoDB;

CREATE INDEX idx_bus_stop_route ON Bus_Stop (route_id);

-- =============================================================================
-- TABLE 5: Trip
-- Purpose: Schedules an assigned Bus and Driver across a Route on a given date/time.
-- =============================================================================
CREATE TABLE Trip (
    trip_id INT AUTO_INCREMENT PRIMARY KEY,
    bus_id INT NOT NULL,
    driver_id INT NOT NULL,
    route_id INT NOT NULL,
    trip_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trip_bus FOREIGN KEY (bus_id)
        REFERENCES Bus (bus_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_trip_driver FOREIGN KEY (driver_id)
        REFERENCES Driver (driver_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_trip_route FOREIGN KEY (route_id)
        REFERENCES Route (route_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT chk_trip_status CHECK (status IN ('Scheduled', 'In Progress', 'Ongoing', 'Completed', 'Cancelled')),
    CONSTRAINT chk_trip_time_window CHECK (end_time IS NULL OR end_time > start_time)
) ENGINE=InnoDB;

CREATE INDEX idx_trip_bus ON Trip (bus_id);
CREATE INDEX idx_trip_driver ON Trip (driver_id);
CREATE INDEX idx_trip_route ON Trip (route_id);
CREATE INDEX idx_trip_date_status ON Trip (trip_date, status);

-- =============================================================================
-- TABLE 6: Passenger_Record
-- Purpose: Stores point-in-time passenger occupancy snapshot at a specific transit stop.
-- Note: passenger_count represents total passengers onboard at that moment.
-- =============================================================================
CREATE TABLE Passenger_Record (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    boarding_stop VARCHAR(100) NOT NULL,
    exit_stop VARCHAR(100) NULL,
    passenger_count INT NOT NULL,
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_passenger_trip FOREIGN KEY (trip_id)
        REFERENCES Trip (trip_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT chk_passenger_count CHECK (passenger_count >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_passenger_trip ON Passenger_Record (trip_id);
CREATE INDEX idx_passenger_recorded_at ON Passenger_Record (recorded_at);

-- =============================================================================
-- TABLE 7: Safety_Incident
-- Purpose: Records safety concerns, including trigger-generated Overcrowding alerts.
-- =============================================================================
CREATE TABLE Safety_Incident (
    incident_id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    incident_type VARCHAR(50) NOT NULL,
    description TEXT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'Medium',
    status VARCHAR(30) NOT NULL DEFAULT 'Open',
    reported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    CONSTRAINT fk_incident_trip FOREIGN KEY (trip_id)
        REFERENCES Trip (trip_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT chk_incident_type CHECK (incident_type IN ('Overcrowding', 'Accident', 'Medical Emergency', 'Passenger Safety', 'Other')),
    CONSTRAINT chk_incident_severity CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    CONSTRAINT chk_incident_status CHECK (status IN ('Open', 'Investigating', 'Resolved'))
) ENGINE=InnoDB;

CREATE INDEX idx_incident_trip ON Safety_Incident (trip_id);
CREATE INDEX idx_incident_status_severity ON Safety_Incident (status, severity);
CREATE INDEX idx_incident_type ON Safety_Incident (incident_type);
