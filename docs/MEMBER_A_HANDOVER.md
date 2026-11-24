# Member A to Member B: Integration Handover Document
## Smart Bus Overcrowding & Passenger Safety Management System
**From**: Member A (Database Engineer & Backend Developer)  
**To**: Member B (Frontend Developer — React, Vite, Tailwind CSS)  
**Date**: November 2026

Welcome, Member B! This document contains everything you need to connect your React + Vite + Tailwind CSS frontend to the backend REST API and MySQL database without having to read through backend implementation code.

---

## 1. Quick Integration Summary

| Parameter | Configuration |
| :--- | :--- |
| **Backend Base URL** | `http://localhost:5000/api` |
| **Frontend Expected Origin** | `http://localhost:5173` (Vite Default) |
| **CORS Policy** | Fully configured for `http://localhost:5173` with credentials and standard HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`) |
| **Content-Type** | `application/json` for all POST/PUT/PATCH bodies |
| **Data Envelopes** | All successful responses wrap results in `{ success: true, message: "...", data: ... }` |
| **Error Format** | All error responses return `{ success: false, message: "..." }` with standard HTTP error codes (`400`, `404`, `409`, `500`) |

---

## 2. Setting Up the Backend on Your Machine

1. Ensure MySQL is running on port 3306.
2. In MySQL Workbench, run these four scripts in order:
   - `smart-bus-safety/database/schema.sql`
   - `smart-bus-safety/database/seed.sql`
   - `smart-bus-safety/database/trigger.sql`
   - `smart-bus-safety/database/procedures.sql`
3. Navigate to `smart-bus-safety/backend/`:
   ```bash
   cd smart-bus-safety/backend
   npm install
   cp .env.example .env
   ```
4. Put your MySQL password in `.env`:
   ```env
   PORT=5000
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=smart_bus_safety
   FRONTEND_URL=http://localhost:5173
   ```
5. Start the backend:
   ```bash
   npm run dev
   ```
   Verify at `http://localhost:5000/api/health`.

---

## 3. Frontend Pages & Endpoint Mapping

### Page 1: Admin Dashboard (`/` or `/dashboard`)
Fetch data from:
```http
GET /api/dashboard
```
**Response Object Shape:**
```typescript
interface DashboardData {
  total_buses: number;
  active_buses: number;
  total_drivers: number;
  available_drivers: number;
  on_duty_drivers: number;
  todays_trips: number;
  in_progress_trips: number;
  scheduled_trips: number;
  total_trips: number;
  overcrowded_trips: number;    // Distinct active trips with unresolved overcrowding
  open_incidents: number;       // Pending safety issues
  resolved_incidents: number;
  total_incidents: number;
  recent_unresolved_alerts: Array<{
    incident_id: number;
    trip_id: number;
    incident_type: string;
    severity: "Low" | "Medium" | "High" | "Critical";
    status: "Open" | "Investigating" | "Resolved";
    description: string;
    reported_at: string;
    bus_number: string;
    route_name: string;
  }>;
}
```

---

### Page 2: Bus Fleet Management (`/buses`)
- **List Buses**: `GET /api/buses` (optional query: `?status=Active&bus_type=AC`)
- **Get Bus Details**: `GET /api/buses/:id`
- **Add Bus**: `POST /api/buses`
  - Body: `{ bus_number: string, capacity: number, bus_type: "Ordinary"|"Express"|"AC"|"Electric", status: "Active"|"Maintenance"|"Inactive" }`
- **Edit Bus**: `PUT /api/buses/:id`
- **Delete Bus**: `DELETE /api/buses/:id` *(Returns 409 Conflict if trips exist for this bus)*

---

### Page 3: Driver Management (`/drivers`)
- **List Drivers**: `GET /api/drivers` (optional query: `?status=Available`)
- **Get Driver Details**: `GET /api/drivers/:id`
- **Add Driver**: `POST /api/drivers`
  - Body: `{ name: string, phone: string, license_no: string, status: "Available"|"On Duty"|"Inactive" }`
- **Edit Driver**: `PUT /api/drivers/:id`
- **Delete Driver**: `DELETE /api/drivers/:id` *(Returns 409 Conflict if trips exist for this driver)*

---

### Page 4: Route & Bus Stops (`/routes`)
- **List Routes**: `GET /api/routes`
  - Returns array of routes with `total_stops` count.
- **Route Details + Stop Sequence**: `GET /api/routes/:id`
  - Returns route metadata with ordered `stops: [{ stop_id, stop_name, stop_order }]`.
- **Create Route with Ordered Stops**: `POST /api/routes`
  - Body:
    ```json
    {
      "route_name": "Route 15: State Bank - Surathkal Express",
      "source": "State Bank",
      "destination": "Surathkal NITK",
      "distance_km": 18.5,
      "stops": [
        { "stop_name": "State Bank Terminal", "stop_order": 1 },
        { "stop_name": "Hampankatta Signal", "stop_order": 2 },
        { "stop_name": "PVS Circle", "stop_order": 3 }
      ]
    }
    ```
- **Delete Route**: `DELETE /api/routes/:id` *(Rejects if scheduled trips exist; cascades to stops if no trips)*

---

### Page 5: Trip Dispatch & Schedules (`/trips`)
- **List Trips**: `GET /api/trips`
  - Includes joined `bus_number`, `bus_capacity`, `driver_name`, `driver_phone`, `route_name`, `source`, `destination`.
  - Supports filters: `?status=In Progress&date=2026-11-03`.
- **Trip Details**: `GET /api/trips/:id`
  - Returns trip info + `passenger_metrics` and `incident_metrics`.
- **Schedule Trip**: `POST /api/trips`
  - Body:
    ```json
    {
      "bus_id": 1,
      "driver_id": 1,
      "route_id": 1,
      "trip_date": "2026-11-05",
      "start_time": "08:30:00",
      "end_time": "09:45:00",
      "status": "Scheduled"
    }
    ```
- **Update Trip Status**: `PUT /api/trips/:id` (e.g. set status to `In Progress` or `Completed`).

---

### Page 6: Passenger Occupancy & Overcrowding Monitor (`/monitoring`)
> **Crucial Concept**: `passenger_count` is a **point-in-time snapshot** of total passengers onboard the bus when leaving a stop. Do not sum these up in your UI.

- **Get Journey Occupancy Snapshots**: `GET /api/passengers/trip/:tripId`
  - Returns all recorded snapshots with `occupancy_percentage` and boolean `overcrowded`.
- **Submit Passenger Snapshot**: `POST /api/passengers`
  - Body:
    ```json
    {
      "trip_id": 1,
      "boarding_stop": "Kottara Chowki",
      "exit_stop": "Kulur Bridge",
      "passenger_count": 56
    }
    ```
  - **What Happens**:
    - Backend inserts the record.
    - The MySQL Trigger `trg_passenger_overcrowding` runs in the database.
    - If `passenger_count > bus_capacity`, an `Overcrowding` incident is automatically created in `Safety_Incident` with `severity: 'High'` and `status: 'Open'`.
    - Response contains:
      ```json
      {
        "success": true,
        "data": {
          "record_id": 19,
          "passenger_count": 56,
          "bus_capacity": 45,
          "occupancy_percentage": 124.44,
          "overcrowded": true
        }
      }
      ```
    - In your React UI, show an alert banner if `overcrowded === true`.

---

### Page 7: Safety Incidents Tracker (`/incidents`)
- **List Incidents**: `GET /api/incidents`
  - Query filters: `?status=Open&severity=High&incident_type=Overcrowding`
  - Displays vehicle number, driver name, driver phone, and formatted description.
- **Update Status**: `PATCH /api/incidents/:id/status`
  - Body: `{ "status": "Investigating" }` or `{ "status": "Resolved", "description": "Resolved by dispatching feeder bus" }`
  - Automatically manages `resolved_at` timestamp.
- **Manual Incident Logging**: `POST /api/incidents`
  - Body: `{ "trip_id": 2, "incident_type": "Medical Emergency"|"Accident"|"Passenger Safety"|"Other", "severity": "Medium"|"High"|"Critical", "description": "..." }`

---

### Page 8: Trip Safety Report (`/reports/:tripId`)
- **Get Stored Procedure Report**: `GET /api/reports/trip/:tripId`
  - Calls MySQL Stored Procedure `CALL Generate_Trip_Report(p_trip_id)` and returns computed metrics:
    - `total_passenger_records`
    - `maximum_passengers`
    - `average_passengers`
    - `maximum_occupancy_percentage`
    - `overcrowding_incident_count`
    - `total_safety_incidents`
  - Perfect for a "Generate Trip Performance Certificate" or printable PDF/modal view in React.

---

## 4. Key Design Decisions & Assumptions
1. **Snapshots, Not Deltas**: `passenger_count` is the actual count of passengers on the bus at that stop.
2. **Duplicate Suppression**: If a trip has an unresolved Overcrowding incident, the trigger will not spam the database with duplicate rows for subsequent overcrowded stops on that same trip. Once marked `Resolved`, a new incident will be logged if another surge occurs.
3. **Delete Restrictions**: Deleting a bus, driver, or route that has trips will return HTTP `409 Conflict`. Recommend providing an "Archive / Set Inactive" option in your UI for those cases.
4. **Dates & Times**: All dates are formatted as `YYYY-MM-DD` and times as `HH:MM:SS`.

If you run into any questions or need custom query fields, let Member A know! The backend is verified and ready for seamless frontend integration.

