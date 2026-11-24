# Backend API & Database Test Checklist
## Smart Bus Overcrowding & Passenger Safety Management System
**Member A: Database Engineer & Backend Developer**

This checklist details every required manual and automated test for verifying the database integrity, triggers, stored procedures, and REST API endpoints.

---

## 1. System Health & Connectivity Verification

| Step | Test Objective | Method & Endpoint | Expected Status | Expected Response / Database State | Verified? |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **1.1** | Backend Service Health | `GET /api/health` | `200 OK` | `{"success": true, "data": {"environment": "development", "uptime_seconds": ...}}` | [ ] |
| **1.2** | Database Connectivity | Check console upon `npm start` | Log Output | `[DB] Successfully connected to MySQL database "smart_bus_safety"` | [ ] |
| **1.3** | 404 Route Fallback | `GET /api/nonexistent` | `404 Not Found` | `{"success": false, "message": "API endpoint not found: GET /api/nonexistent"}` | [ ] |

---

## 2. Bus Management CRUD

| Step | Test Objective | Method & Endpoint | Expected Status | Test Payload / Check | Verified? |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **2.1** | List All Buses | `GET /api/buses` | `200 OK` | Returns array of 6 seed buses (`KA-19-F-1101` etc.) | [ ] |
| **2.2** | Filter Active Buses | `GET /api/buses?status=Active` | `200 OK` | Returns only active buses | [ ] |
| **2.3** | Get Bus By ID | `GET /api/buses/1` | `200 OK` | Details of bus ID 1 with capacity 45 | [ ] |
| **2.4** | Create New Bus | `POST /api/buses` | `201 Created` | Payload: `{"bus_number": "KA-19-F-9999", "capacity": 40, "bus_type": "Ordinary"}` | [ ] |
| **2.5** | Reject Negative Capacity | `POST /api/buses` | `400 Bad Request` | Payload: `{"bus_number": "KA-19-F-8888", "capacity": -10, "bus_type": "AC"}` | [ ] |
| **2.6** | Reject Duplicate Bus No | `POST /api/buses` | `409 Conflict` | Payload: `{"bus_number": "KA-19-F-1101", "capacity": 50, "bus_type": "AC"}` | [ ] |
| **2.7** | Update Bus Details | `PUT /api/buses/1` | `200 OK` | Payload: `{"status": "Active", "capacity": 48}` | [ ] |
| **2.8** | Reject Deletion of Referenced Bus | `DELETE /api/buses/1` | `409 Conflict` | Bus 1 has scheduled trips in seed data; returns conflict message | [ ] |

---

## 3. Driver Management CRUD

| Step | Test Objective | Method & Endpoint | Expected Status | Test Payload / Check | Verified? |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **3.1** | List All Drivers | `GET /api/drivers` | `200 OK` | Returns array of 6 seed drivers | [ ] |
| **3.2** | Filter Available Drivers | `GET /api/drivers?status=Available` | `200 OK` | Returns drivers ready for trip dispatch | [ ] |
| **3.3** | Get Driver By ID | `GET /api/drivers/3` | `200 OK` | Details for driver 'Abdul Hameed' | [ ] |
| **3.4** | Create New Driver | `POST /api/drivers` | `201 Created` | Payload: `{"name": "Vinod Kumar", "phone": "+91-9845099999", "license_no": "KA19-20230009999"}` | [ ] |
| **3.5** | Reject Duplicate Phone | `POST /api/drivers` | `409 Conflict` | Payload with existing phone `+91-9845012341` | [ ] |
| **3.6** | Update Driver Status | `PUT /api/drivers/3` | `200 OK` | Payload: `{"status": "On Duty"}` | [ ] |
| **3.7** | Reject Deletion of Referenced Driver | `DELETE /api/drivers/1` | `409 Conflict` | Driver 1 has dependent trips; returns clean conflict error | [ ] |

---

## 4. Route & Bus Stop Management

| Step | Test Objective | Method & Endpoint | Expected Status | Test Payload / Check | Verified? |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **4.1** | List All Routes | `GET /api/routes` | `200 OK` | Returns routes with total stop count | [ ] |
| **4.2** | Get Route with Stops | `GET /api/routes/1` | `200 OK` | Returns Route 1 with ordered `stops` array (1 to 9) | [ ] |
| **4.3** | Create Route with Stops | `POST /api/routes` | `201 Created` | Payload with nested `stops: [{"stop_name": "A", "stop_order": 1}, ...]` | [ ] |
| **4.4** | Reject Route Deletion with Dependent Trips | `DELETE /api/routes/1` | `409 Conflict` | Route 1 has active trips; rejects deletion | [ ] |

---

## 5. Trip Scheduling

| Step | Test Objective | Method & Endpoint | Expected Status | Test Payload / Check | Verified? |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **5.1** | List Scheduled Trips | `GET /api/trips` | `200 OK` | Returns trips with joined Bus, Driver, and Route metadata | [ ] |
| **5.2** | Get Trip By ID | `GET /api/trips/1` | `200 OK` | Returns Trip 1 details with passenger and incident summaries | [ ] |
| **5.3** | Schedule New Trip | `POST /api/trips` | `201 Created` | Payload: `{"bus_id": 3, "driver_id": 3, "route_id": 1, "trip_date": "2026-11-10", "start_time": "14:00:00"}` | [ ] |
| **5.4** | Reject Inactive Bus | `POST /api/trips` | `400 Bad Request` | Payload with Bus 6 (Maintenance status) | [ ] |
| **5.5** | Reject Time Collision | `POST /api/trips` | `409 Conflict` | Scheduling same bus on existing trip time slot | [ ] |

---

## 6. MySQL Trigger Verification (Passenger Overcrowding)

> **Core Viva Demonstration Feature**: Validates that `trg_passenger_overcrowding` runs in MySQL upon `INSERT` into `Passenger_Record`.

| Step | Test Objective | Method & Endpoint | Expected Result | Verified? |
| :---: | :--- | :--- | :--- | :---: |
| **6.1** | **Normal Snapshot Test**<br>(Count $\le$ Capacity) | `POST /api/passengers`<br>Payload: `{"trip_id": 4, "boarding_stop": "Kankanady Market", "passenger_count": 25}` *(Bus 2 capacity = 35)* | `201 Created`<br>`occupancy_percentage: 71.43%`<br>`overcrowded: false`<br>**No Safety Incident created in DB.** | [ ] |
| **6.2** | **Overcrowded Snapshot Test**<br>(Count $>$ Capacity) | `POST /api/passengers`<br>Payload: `{"trip_id": 4, "boarding_stop": "Nanthoor Junction", "passenger_count": 42}` *(42 > 35)* | `201 Created`<br>`occupancy_percentage: 120.00%`<br>`overcrowded: true`<br>**MySQL Trigger automatically inserts 1 Safety_Incident row:**<br>- `incident_type = 'Overcrowding'`<br>- `severity = 'High'`<br>- `status = 'Open'` | [ ] |
| **6.3** | **Duplicate Alert Prevention Test**<br>(Second overloaded snapshot while incident is Open) | `POST /api/passengers`<br>Payload: `{"trip_id": 4, "boarding_stop": "Vamanjoor Church", "passenger_count": 45}` *(45 > 35)* | `201 Created`<br>`overcrowded: true`<br>**Check DB:** Total Open incidents for Trip 4 remains **1**. Redundant duplicate incident is suppressed. | [ ] |
| **6.4** | **Incident Resolution & Re-trigger Test** | 1. Resolve Incident:<br>`PATCH /api/incidents/<id>/status`<br>Payload: `{"status": "Resolved"}`<br>2. Record another surge:<br>`POST /api/passengers`<br>Payload: `{"trip_id": 4, "boarding_stop": "Gurupura Bridge", "passenger_count": 44}` | Incident marks `resolved_at = NOW()`.<br>Because previous incident was resolved, **Trigger creates a NEW Open incident for the new surge.** | [ ] |

---

## 7. Safety Incidents & Status Lifecycle

| Step | Test Objective | Method & Endpoint | Expected Status | Check | Verified? |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **7.1** | List Incidents with Filters | `GET /api/incidents?status=Open` | `200 OK` | Returns active open incidents | [ ] |
| **7.2** | Filter by Severity | `GET /api/incidents?severity=High` | `200 OK` | Returns high severity overcrowding alerts | [ ] |
| **7.3** | Get Incident By ID | `GET /api/incidents/1` | `200 OK` | Enriched details with driver & bus info | [ ] |
| **7.4** | Resolve Incident | `PATCH /api/incidents/1/status`<br>`{"status": "Resolved"}` | `200 OK` | `resolved_at` is updated to current timestamp | [ ] |
| **7.5** | Reopen Incident | `PATCH /api/incidents/1/status`<br>`{"status": "Investigating"}` | `200 OK` | `resolved_at` is cleared to `NULL` | [ ] |
| **7.6** | Manual Incident Creation | `POST /api/incidents`<br>`{"trip_id": 2, "incident_type": "Accident", "severity": "High"}` | `201 Created` | Manual incident recorded | [ ] |

---

## 8. Stored Procedure & Report Verification

> **Core Viva Demonstration Feature**: Validates `CALL Generate_Trip_Report(p_trip_id)` execution.

| Step | Test Objective | Method & Endpoint | Expected Result | Verified? |
| :---: | :--- | :--- | :--- | :---: |
| **8.1** | Direct MySQL Call in Workbench | `CALL Generate_Trip_Report(1);` | Returns 1 row with `trip_id`, `bus_number`, `max_occupancy_percentage`, `overcrowding_incident_count` | [ ] |
| **8.2** | Trip Report REST API | `GET /api/reports/trip/1` | `200 OK`<br>Returns JSON with computed aggregates from stored procedure | [ ] |
| **8.3** | Trip Report with 0 Records | `GET /api/reports/trip/4` | `200 OK`<br>`total_passenger_records: 0`, `maximum_occupancy_percentage: 0` (no divide-by-zero error) | [ ] |
| **8.4** | Non-existent Trip Report | `GET /api/reports/trip/9999` | `404 Not Found` | [ ] |

---

## 9. Dashboard Statistics Verification

| Step | Test Objective | Method & Endpoint | Expected Result | Verified? |
| :---: | :--- | :--- | :--- | :---: |
| **9.1** | Live Dashboard Metrics | `GET /api/dashboard` | `200 OK`<br>Computes real counts from DB: `total_buses`, `active_buses`, `total_drivers`, `todays_trips`, `overcrowded_trips`, `open_incidents`, `resolved_incidents` | [ ] |
| **9.2** | Verify Overcrowded Trips Count | Inspect `overcrowded_trips` | Matches distinct active trips having Open Overcrowding incidents | [ ] |

---

## 10. Security & Input Sanitization Checks

| Step | Test Objective | Method & Endpoint | Expected Result | Verified? |
| :---: | :--- | :--- | :--- | :---: |
| **10.1** | SQL Injection Resistance | `GET /api/buses?status=Active' OR '1'='1` | Parameterized query safely sanitizes string; no unauthorized records returned | [ ] |
| **10.2** | Non-exposure of Passwords | Inspect API error responses | No database password, internal host, or stack traces leaked in error JSON | [ ] |

