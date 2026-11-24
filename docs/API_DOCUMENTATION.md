# REST API Documentation
## Smart Bus Overcrowding & Passenger Safety Management System
**Member A: Database Engineer & Backend Developer**

Base URL: `http://localhost:5000/api`  
Data Format: `application/json`

---

## Standard Response Structure

### Success Response
```json
{
  "success": true,
  "message": "Readable description of outcome",
  "data": { ... } // or array [ ... ]
}
```

### Error Response
```json
{
  "success": false,
  "message": "User-friendly description of error"
}
```

---

## 1. Health & Status

### `GET /health`
- **Purpose**: Verify backend server operational status, environment, and uptime.
- **Request Body**: None
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Smart Bus Safety Management System Backend is healthy and operational.",
  "data": {
    "environment": "development",
    "timestamp": "2026-11-03T07:15:00.000Z",
    "uptime_seconds": 128
  }
}
```

---

## 2. Bus Management Endpoints

### `GET /buses`
- **Purpose**: Retrieve list of buses with optional status and type filtering.
- **Query Parameters**:
  - `status` (optional): `Active`, `Maintenance`, `Inactive`
  - `bus_type` (optional): `Ordinary`, `Express`, `AC`, `Electric`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Buses retrieved successfully.",
  "data": [
    {
      "bus_id": 1,
      "bus_number": "KA-19-F-1101",
      "capacity": 45,
      "bus_type": "Ordinary",
      "status": "Active",
      "created_at": "2026-11-03 10:00:00"
    }
  ]
}
```

### `GET /buses/:id`
- **Purpose**: Retrieve single bus by ID.
- **Errors**: `400 Bad Request` (Invalid ID), `404 Not Found` (Bus not found).

### `POST /buses`
- **Purpose**: Register a new bus in the fleet.
- **Request Body**:
```json
{
  "bus_number": "KA-19-F-1109",
  "capacity": 45,
  "bus_type": "Express",
  "status": "Active"
}
```
- **Validation Rules**: `bus_number` required & unique; `capacity` > 0; `bus_type` in `Ordinary`, `Express`, `AC`, `Electric`.
- **Success Response (201 Created)**: Returns created bus object.
- **Errors**: `400 Bad Request` (Validation error), `409 Conflict` (Duplicate bus number).

### `PUT /buses/:id`
- **Purpose**: Update an existing bus record.
- **Request Body**: Any of `bus_number`, `capacity`, `bus_type`, `status`.

### `DELETE /buses/:id`
- **Purpose**: Delete a bus if not referenced by any scheduled trip.
- **Errors**: `409 Conflict` if trips exist referencing this bus.

---

## 3. Driver Management Endpoints

### `GET /drivers`
- **Purpose**: Retrieve all drivers.
- **Query Parameters**: `status` (`Available`, `On Duty`, `Inactive`).

### `GET /drivers/:id`
- **Purpose**: Retrieve driver details by ID.

### `POST /drivers`
- **Purpose**: Register a new bus driver.
- **Request Body**:
```json
{
  "name": "Kishore Rao",
  "phone": "+91-9845012399",
  "license_no": "KA19-20220005555",
  "status": "Available"
}
```
- **Validation**: All fields required; `phone` and `license_no` must be unique.
- **Errors**: `400 Bad Request`, `409 Conflict` (Duplicate phone or license).

### `PUT /drivers/:id`
- **Purpose**: Update driver contact, license, or duty status.

### `DELETE /drivers/:id`
- **Purpose**: Remove driver if no dependent trips exist.

---

## 4. Route & Bus Stop Endpoints

### `GET /routes`
- **Purpose**: Retrieve all routes with total count of associated stops.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Routes retrieved successfully.",
  "data": [
    {
      "route_id": 1,
      "route_name": "Route 15: State Bank - Surathkal Express",
      "source": "State Bank, Mangaluru",
      "destination": "Surathkal NITK",
      "distance_km": "18.50",
      "total_stops": 9
    }
  ]
}
```

### `GET /routes/:id`
- **Purpose**: Retrieve a route with its complete ordered sequence of bus stops.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Route details with ordered stops retrieved successfully.",
  "data": {
    "route_id": 1,
    "route_name": "Route 15: State Bank - Surathkal Express",
    "source": "State Bank, Mangaluru",
    "destination": "Surathkal NITK",
    "distance_km": "18.50",
    "stops": [
      { "stop_id": 1, "route_id": 1, "stop_name": "State Bank Terminal", "stop_order": 1 },
      { "stop_id": 2, "route_id": 1, "stop_name": "Hampankatta Signal", "stop_order": 2 }
    ]
  }
}
```

### `POST /routes`
- **Purpose**: Create a route and optionally its sequence of ordered stops atomically.
- **Request Body**:
```json
{
  "route_name": "Route 10: Mangaluru - Ullal",
  "source": "State Bank",
  "destination": "Ullal Beach",
  "distance_km": 12.0,
  "stops": [
    { "stop_name": "State Bank", "stop_order": 1 },
    { "stop_name": "Jeppu", "stop_order": 2 },
    { "stop_name": "Thokkottu", "stop_order": 3 },
    { "stop_name": "Ullal Stand", "stop_order": 4 }
  ]
}
```

### `PUT /routes/:id`
- **Purpose**: Update route details and/or replace its bus stop sequence.

### `DELETE /routes/:id`
- **Purpose**: Delete route if not referenced by any trips. Automatically cascades to stops.

---

## 5. Trip Scheduling Endpoints

### `GET /trips`
- **Purpose**: Retrieve all trips with joined Bus, Driver, and Route details.
- **Query Parameters**: `status`, `date`, `bus_id`, `driver_id`, `route_id`.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Trips retrieved successfully.",
  "data": [
    {
      "trip_id": 1,
      "bus_id": 1,
      "bus_number": "KA-19-F-1101",
      "bus_capacity": 45,
      "bus_type": "Ordinary",
      "driver_id": 1,
      "driver_name": "Ramesh Poojary",
      "driver_phone": "+91-9845012341",
      "route_id": 1,
      "route_name": "Route 15: State Bank - Surathkal Express",
      "source": "State Bank, Mangaluru",
      "destination": "Surathkal NITK",
      "trip_date": "2026-11-03",
      "start_time": "08:00:00",
      "end_time": "09:10:00",
      "status": "In Progress"
    }
  ]
}
```

### `GET /trips/:id`
- **Purpose**: Retrieve single trip details with occupancy and incident summary.

### `POST /trips`
- **Purpose**: Schedule a new trip.
- **Request Body**:
```json
{
  "bus_id": 1,
  "driver_id": 1,
  "route_id": 1,
  "trip_date": "2026-11-05",
  "start_time": "14:30:00",
  "end_time": "15:45:00",
  "status": "Scheduled"
}
```
- **Validation & Conflict Checks**:
  - Bus and Driver must exist and cannot be Inactive/Maintenance.
  - Checks for overlapping trip assignments for the same bus or driver on that date.
- **Errors**: `400 Bad Request`, `404 Not Found`, `409 Conflict`.

### `PUT /trips/:id`
- **Purpose**: Update trip schedule or mark status (`Scheduled`, `In Progress`, `Completed`, `Cancelled`).

### `DELETE /trips/:id`
- **Purpose**: Delete trip if no passenger records or incidents exist.

---

## 6. Passenger Monitoring Endpoints

### `GET /passengers/trip/:tripId`
- **Purpose**: Retrieve all point-in-time passenger occupancy snapshots for a trip, enriched with calculated occupancy percentage and overcrowding status.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Passenger records for Trip #1 retrieved successfully.",
  "data": {
    "trip": {
      "trip_id": 1,
      "bus_number": "KA-19-F-1101",
      "bus_capacity": 45
    },
    "records": [
      {
        "record_id": 4,
        "trip_id": 1,
        "boarding_stop": "Kottara Chowki",
        "exit_stop": "Kulur Bridge",
        "passenger_count": 56,
        "recorded_at": "2026-11-03 08:42:00",
        "bus_capacity": 45,
        "occupancy_percentage": 124.44,
        "overcrowded": true
      }
    ]
  }
}
```

### `POST /passengers`
- **Purpose**: Record a point-in-time snapshot of passengers onboard.
  > **Note**: `passenger_count` is total passengers currently on the bus.
  > **MySQL Trigger Action**: If `passenger_count > bus_capacity`, `trg_passenger_overcrowding` automatically inserts an Open High-severity `Safety_Incident` row in MySQL.
- **Request Body**:
```json
{
  "trip_id": 1,
  "boarding_stop": "Baikampady Gate",
  "exit_stop": "Surathkal Bus Stand",
  "passenger_count": 52
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Passenger snapshot recorded. WARNING: Overcrowding detected (52/45). Automated safety alert evaluated by database trigger.",
  "data": {
    "record_id": 18,
    "trip_id": 1,
    "boarding_stop": "Baikampady Gate",
    "exit_stop": "Surathkal Bus Stand",
    "passenger_count": 52,
    "recorded_at": "2026-11-03 10:30:00",
    "bus_capacity": 45,
    "occupancy_percentage": 115.56,
    "overcrowded": true
  }
}
```

---

## 7. Safety Incident Management Endpoints

### `GET /incidents`
- **Purpose**: Retrieve safety incidents with comprehensive filters.
- **Query Parameters**:
  - `status`: `Open`, `Investigating`, `Resolved`
  - `severity`: `Low`, `Medium`, `High`, `Critical`
  - `incident_type`: `Overcrowding`, `Accident`, `Medical Emergency`, `Passenger Safety`, `Other`
  - `trip_id`: integer
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Safety incidents retrieved successfully.",
  "data": [
    {
      "incident_id": 1,
      "trip_id": 1,
      "incident_type": "Overcrowding",
      "description": "Automated Alert: Overcrowding detected on Trip #1 at stop \"Kottara Chowki\". Observed: 56 passengers, Permitted Bus Capacity: 45.",
      "severity": "High",
      "status": "Open",
      "reported_at": "2026-11-03 08:42:00",
      "resolved_at": null,
      "bus_number": "KA-19-F-1101",
      "driver_name": "Ramesh Poojary",
      "driver_phone": "+91-9845012341",
      "route_name": "Route 15: State Bank - Surathkal Express"
    }
  ]
}
```

### `GET /incidents/:id`
- **Purpose**: Retrieve single incident details.

### `PATCH /incidents/:id/status`
- **Purpose**: Update incident lifecycle status (`Open`, `Investigating`, `Resolved`).
  - Sets `resolved_at = NOW()` when marked `Resolved`.
  - Clears `resolved_at = NULL` if reopened.
- **Request Body**:
```json
{
  "status": "Resolved",
  "description": "Additional feeder bus deployed at Kottara Chowki; crowding resolved."
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Incident #1 status updated to 'Resolved'.",
  "data": {
    "incident_id": 1,
    "trip_id": 1,
    "status": "Resolved",
    "resolved_at": "2026-11-03 10:45:00"
  }
}
```

### `POST /incidents`
- **Purpose**: Manually log an incident (Accident, Medical Emergency, Passenger Safety).

---

## 8. Stored Procedure & Reports Endpoints

### `GET /reports/trip/:tripId`
- **Purpose**: Invokes MySQL Stored Procedure `CALL Generate_Trip_Report(p_trip_id)` and returns computed trip safety metrics.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Comprehensive safety report for Trip #1 generated successfully.",
  "data": {
    "trip_id": 1,
    "trip_date": "2026-11-03",
    "start_time": "08:00:00",
    "end_time": "09:10:00",
    "trip_status": "In Progress",
    "bus_number": "KA-19-F-1101",
    "bus_type": "Ordinary",
    "bus_capacity": 45,
    "driver_name": "Ramesh Poojary",
    "route_name": "Route 15: State Bank - Surathkal Express",
    "source": "State Bank, Mangaluru",
    "destination": "Surathkal NITK",
    "distance_km": 18.5,
    "total_passenger_records": 5,
    "maximum_passengers": 56,
    "average_passengers": 42.8,
    "maximum_occupancy_percentage": 124.44,
    "overcrowding_incident_count": 1,
    "total_safety_incidents": 1
  }
}
```
- **Errors**: `400 Bad Request` (Invalid ID), `404 Not Found` (Trip does not exist).

---

## 9. Dashboard Endpoints

### `GET /dashboard`
- **Purpose**: Retrieve database-driven fleet and safety statistics for admin visualization.
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Dashboard metrics retrieved successfully from database.",
  "data": {
    "total_buses": 6,
    "active_buses": 5,
    "total_drivers": 6,
    "available_drivers": 2,
    "on_duty_drivers": 3,
    "todays_trips": 6,
    "today's_trips": 6,
    "in_progress_trips": 3,
    "scheduled_trips": 2,
    "total_trips": 9,
    "overcrowded_trips": 2,
    "open_incidents": 2,
    "resolved_incidents": 3,
    "total_incidents": 5,
    "recent_unresolved_alerts": [
      {
        "incident_id": 1,
        "trip_id": 1,
        "incident_type": "Overcrowding",
        "severity": "High",
        "status": "Open",
        "description": "Automated Alert: Overcrowding detected...",
        "bus_number": "KA-19-F-1101",
        "route_name": "Route 15: State Bank - Surathkal Express"
      }
    ]
  }
}
```

