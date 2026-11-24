# Complete System Working & Technical Workflow Documentation
## Smart Bus Overcrowding & Passenger Safety Management System

**Course**: Database Management Systems (DBMS) Mini-Project  
**Architecture**: 3-Tier Web Application (Presentation, Application, Data)  
**Stack**: React 19 (Vite, Tailwind CSS) &bull; Node.js + Express.js &bull; MySQL 8.0+ (InnoDB)  

---

## 1. System Architecture & High-Level Overview

The system operates on an industry-standard **3-Tier Relational Architecture**. The database is not just a passive storage store; it functions as an active participant in business logic through automated triggers and stored procedures.

```mermaid
flowchart TD
    subgraph Tier1 ["Tier 1: Presentation Layer (React + Vite + Tailwind CSS)"]
        UI_Dash["Dashboard View"]
        UI_Fleet["Fleet & Driver Forms"]
        UI_Trip["Trip Dispatcher"]
        UI_Mon["Passenger Monitoring Panel"]
        UI_Inc["Safety Incident Manager"]
        UI_Rep["Trip Safety Reports"]
    end

    subgraph Tier2 ["Tier 2: Application Layer (Node.js + Express.js - Port 5000)"]
        CORS["CORS & Request Parser"]
        Router["Express API Router (/api/*)"]
        Controllers["Controllers (Validation, Conflict Logic, Formatting)"]
        Pool["mysql2 Connection Pool (10 pooled connections)"]
        CORS --> Router --> Controllers --> Pool
    end

    subgraph Tier3 ["Tier 3: Database Layer (MySQL 8.0 Engine)"]
        Tables[("7 Core Relational Tables<br>Bus, Driver, Route, Bus_Stop, Trip, Passenger_Record, Safety_Incident")]
        Trigger{{"Trigger: trg_passenger_overcrowding<br>(AFTER INSERT ON Passenger_Record)"}}
        Proc{{"Stored Procedure: Generate_Trip_Report<br>(Aggregates, Subqueries, Zero-Division Safe)"}}
        Pool <--> Tables
        Tables -.-> Trigger
        Trigger -.->|Auto Insert Alert| Tables
        Pool <--> Proc
    end

    Tier1 <-->|REST API JSON Requests / Responses| Tier2
```

---

## 2. Core Functional Workflows

---

### Workflow 1: Route & Sequential Stop Onboarding (Atomic Transaction)

A public transit route is not just an origin and destination; it consists of an ordered sequence of intermediate stops. If route creation fails halfway through inserting stops, the database must not be left in an inconsistent state.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Transit Operator
    participant UI as React UI (RoutesPage)
    participant API as Express API (/api/routes)
    participant DB as MySQL Database

    Admin->>UI: Enters Route Name, Source, Destination, Distance & Stops list
    UI->>API: POST /api/routes { route_name, source, destination, stops: [...] }
    Note over API: Begins Database Transaction (START TRANSACTION)
    API->>DB: INSERT INTO Route (route_name, source, destination, distance_km)
    DB-->>API: Returns new route_id
    loop For each stop in stops array
        API->>DB: INSERT INTO Bus_Stop (route_id, stop_name, stop_order)
    end
    alt All inserts succeed
        Note over API: COMMIT Transaction
        API->>DB: COMMIT;
        API-->>UI: 201 Created { success: true, data: { route_id, name, stops: [...] } }
        UI-->>Admin: Displays Route with ordered stop badges
    else Any insert fails (e.g., duplicate stop_order)
        Note over API: ROLLBACK Transaction
        API->>DB: ROLLBACK;
        API-->>UI: 400 Bad Request { success: false, message: "..." }
        UI-->>Admin: Shows error alert; database remains clean
    end
```

---

### Workflow 2: Trip Dispatching & Collision Prevention

To maintain public safety and schedule reliability, the application layer prevents dispatch conflicts before committing records to the `Trip` table.

```mermaid
flowchart TD
    A[Operator clicks 'Schedule Trip'] --> B[Input: Bus, Driver, Route, Date, Start Time, End Time]
    B --> C{Are Bus & Driver Active?}
    C -- No --> D[Reject 400: Inactive Vehicle or Driver]
    C -- Yes --> E{Check Collision Query in DB:<br>Is Bus OR Driver assigned to another overlapping trip on this date?}
    E -- Yes Collision --> F[Reject 409 Conflict: Scheduling collision detected]
    E -- No Collision --> G[INSERT INTO Trip: bus_id, driver_id, route_id, trip_date, start_time, end_time, status]
    G --> H[Return 201 Created with joined Bus, Driver, Route metadata]
    H --> I[React Trips table updates dynamically]
```

---

### Workflow 3: Passenger Snapshot Recording & Trigger Execution

This is the **primary DBMS demonstration flow**. When a transit conductor or sensor logs passenger numbers departing a stop, the database trigger independently evaluates overcrowding and logs safety violations.

```mermaid
sequenceDiagram
    autonumber
    actor Conductor as Conductor / Dispatcher
    participant UI as PassengerMonitoring.jsx
    participant API as Express (/api/passengers)
    participant DB as MySQL Table: Passenger_Record
    participant Trig as Trigger: trg_passenger_overcrowding
    participant Inc as MySQL Table: Safety_Incident

    Conductor->>UI: Selects Bus & Enters current passenger count (e.g. 56 on a 45-capacity bus)
    UI->>API: POST /api/passengers { trip_id: 1, boarding_stop: "Kottara Chowki", passenger_count: 56 }
    Note over API: Validates positive integer count
    API->>DB: INSERT INTO Passenger_Record (trip_id, boarding_stop, passenger_count, recorded_at)
    
    Note over DB,Trig: Database Engine automatically fires AFTER INSERT trigger
    Trig->>DB: SELECT capacity FROM Bus WHERE bus_id = (SELECT bus_id FROM Trip WHERE trip_id = 1)
    DB-->>Trig: Returns capacity = 45

    Note over Trig: Evaluates: 56 > 45 (Overcrowding detected!)
    Trig->>Inc: SELECT COUNT(*) FROM Safety_Incident WHERE trip_id = 1 AND incident_type = 'Overcrowding' AND status IN ('Open', 'Investigating')
    
    alt Active Overcrowding Alert Already Exists
        Inc-->>Trig: Count > 0
        Note over Trig: Suppress Duplicate: Alert already active on this ongoing trip
    else No Active Overcrowding Alert
        Inc-->>Trig: Count = 0
        Trig->>Inc: INSERT INTO Safety_Incident (trip_id, incident_type, description, severity, status, reported_at) VALUES (1, 'Overcrowding', 'Observed: 56, Capacity: 45. Exceeded by 11.', 'High', 'Open', NOW())
    end

    DB-->>API: Insert confirmed (record_id = 18)
    Note over API: Calculates occupancy = (56 / 45) * 100 = 124.4%
    API-->>UI: 201 Created { record_id, passenger_count: 56, capacity: 45, occupancy_percentage: 124.4, overcrowded: true }
    UI-->>Conductor: Red Warning Banner: Overcrowding Detected! Progress bar turns red.
```

---

### Workflow 4: Safety Incident Lifecycle & Resolution

Safety incidents follow an auditable state machine (`Open` &rarr; `Investigating` &rarr; `Resolved`).

```mermaid
stateDiagram-v2
    [*] --> Open: Trigger automatically creates 'Overcrowding' incident (or manual report)
    Open --> Investigating: Dispatcher acknowledges & investigates (feeder bus dispatched)
    Investigating --> Resolved: Issue resolved; supervisor clicks 'Resolve' in UI
    Open --> Resolved: Direct resolution
    
    note right of Resolved
        Automatic Timestamping:
        resolved_at = NOW()
        Duplicate alert suppression clears;
        new surges will log a fresh incident.
    end note

    Resolved --> Investigating: Reopened (resolved_at reset to NULL)
    Resolved --> Open: Reopened (resolved_at reset to NULL)
```

---

### Workflow 5: Analytical Trip Safety Report via Stored Procedure

When an auditor or manager inspects a trip, MySQL executes `Generate_Trip_Report(p_trip_id)`:

```mermaid
flowchart LR
    A["Operator selects Trip #1 in UI"] --> B["GET /api/reports/trip/1"]
    B --> C["CALL Generate_Trip_Report(1);"]
    
    subgraph StoredProc ["Inside Stored Procedure Engine"]
        SP1["Pre-aggregate Passenger_Record in subquery (p_agg):<br>Total Snapshots, MAX(passengers), AVG(passengers)"]
        SP2["Pre-aggregate Safety_Incident in subquery (i_agg):<br>Total Incidents, Overcrowding Incidents Count"]
        SP3["Join Trip with Bus, Driver, Route, p_agg, and i_agg"]
        SP4["Calculate Peak Occupancy %: ROUND((MAX / capacity) * 100, 2)"]
    end
    
    C --> StoredProc
    StoredProc --> D["Returns 1 unified row"]
    D --> E["Express formats JSON response"]
    E --> F["React renders Metric Cards, Gauge, and enables CSV Download"]
```

---

## 3. Database Engine Internals & Design Rationale

### 1. Point-in-Time Snapshot Semantics
- In this system, `passenger_count` is **not** an incremental delta of boarding passengers ($+5$ or $-2$).
- It is a **true physical census snapshot** of passengers present on the bus upon departing the stop.
- **Why?** Real-world public transit safety regulations penalize operating a bus whose instantaneous passenger load breaches gross vehicle weight ratings. Calculating safety compliance requires comparing instantaneous snapshots against legal vehicle capacity, not summing boarding totals.

### 2. Cartesian Product Prevention in Reporting
A classic pitfall when writing DBMS queries is joining multiple one-to-many child tables:
$$\text{Trip (1)} \longleftrightarrow \text{Passenger\_Record (M)} \quad \text{and} \quad \text{Trip (1)} \longleftrightarrow \text{Safety\_Incident (N)}$$
Joining them directly produces $M \times N$ rows (a Cartesian product). If a trip has 5 passenger records and 2 incidents, 10 joined rows result, doubling sums and falsifying averages.
- **The Stored Procedure Solution**: Derived pre-aggregations (`p_agg` and `i_agg`) group records by `trip_id` *before* the outer join, ensuring an exact 1:1 join onto the parent `Trip` record.

### 3. Comprehensive Referential Integrity Rules
- `Bus`, `Driver`, `Route`, and `Trip` use `ON DELETE RESTRICT`. Any attempt to delete a referenced entity throws MySQL error `1451`.
- The Express centralized error handler intercepts `1451` and delivers a clean HTTP `409 Conflict` response with an explanatory message.
- `Bus_Stop` uses `ON DELETE CASCADE` linked to `Route`. When a route without scheduled trips is deleted, its intermediate stops are automatically cleaned up.

---

## 4. Viva Examination Preparation: Q&A Defense

| Question | Technical Answer |
| :--- | :--- |
| **Why is the trigger implemented in MySQL rather than Express?** | Implementing the trigger at the database level guarantees data integrity regardless of the entry point. Whether data is inserted via the Express API, MySQL Workbench, mobile terminal, or bulk batch imports, the safety trigger is guaranteed to execute. |
| **Why does the trigger have duplicate prevention?** | During peak commute times, an overloaded bus may remain crowded across several consecutive stops. Duplicate prevention prevents flooding the `Safety_Incident` table with redundant rows, maintaining operational clarity for dispatchers. |
| **How does Express handle database connection pooling?** | Rather than opening and closing a TCP handshake on every HTTP request, `mysql2/promise` maintains a reusable pool of 10 connections. This reduces query latency from $\sim 50\text{ms}$ to $<2\text{ms}$. |
| **What indexes are created and why?** | B-Tree indexes are created on all foreign keys (`bus_id`, `driver_id`, `route_id`, `trip_id`) and commonly filtered status columns (`status`, `trip_date`). This converts $O(N)$ full table scans into $O(\log N)$ indexed lookups. |
| **What happens if bus capacity is 0?** | The database enforces `CHECK (capacity > 0)`. In addition, the stored procedure uses `CASE WHEN b.capacity > 0 ... ELSE 0.00 END` to prevent divide-by-zero crashes. |
