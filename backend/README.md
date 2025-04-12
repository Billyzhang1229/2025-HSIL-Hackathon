# NHS Wearable Dashboard - Backend

This directory contains the Python Flask backend for the NHS Wearable Dashboard prototype.

## Features

-   **API:** Provides REST endpoints to fetch staff information and historical wearable data (including Heart Rate, HRV, Steadiness, Sleep Index, MWI).
-   **Real-time Updates:** Uses Flask-SocketIO to push live updates of staff status to connected clients.
-   **Data Simulation:**
    -   Includes a detailed simulator (`simulator.py`) that periodically generates realistic wearable data for staff members.
    -   Simulates Heart Rate, HRV, Steadiness, Mental Wellness Index (MWI).
    -   Simulates a dynamic daily Sleep Index pattern (ramps up/down during night, zero during day).
    -   Updates staff status (stress level, current metrics) based on simulated data.
-   **Historical Data Population:** On the first run with an empty database, automatically populates the last 48 hours of simulated historical data.
-   **Database:** Uses SQLite (`instance/hospital.db`) via Flask-SQLAlchemy for persistent storage of staff and historical `WearableData`.
-   **Dependencies:** Managed via `requirements.txt` (Flask, Flask-SocketIO, Flask-SQLAlchemy, APScheduler, python-dotenv, eventlet).

## Setup and Running

1.  **Create a virtual environment (optional but recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate # On Windows use `venv\Scripts\activate`
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the application:**
    ```bash
    python app.py
    ```

The server will start (usually on `http://0.0.0.0:5001`).
-   The first time it runs, it will:
    -   Create the `instance/hospital.db` SQLite database file.
    -   Load initial staff details from `staff_data.json`.
    -   Populate the `WearableData` table with ~48 hours of simulated historical data.
-   On subsequent runs, it will use the existing database.
-   The live simulator (running via APScheduler) starts automatically, generating new data and sending updates via WebSocket every 5 seconds.

**Important:** To force a fresh start with new historical data, stop the server and delete the `backend/instance/hospital.db` file before running `python app.py` again.

## Endpoints

-   `GET /api/staff`: Returns a list of all staff members and their current status.
-   `GET /api/staff/<id>/data?minutes=N&sample=true`: Returns historical `WearableData` for the specified staff ID.
    -   `minutes`: Optional. If provided, limits results to the last N minutes.
    -   `sample`: Optional. If `true`, the backend may return a sampled subset of data for long time ranges (currently > 100 points) to improve frontend performance.
    -   If `minutes` is omitted, returns all available historical data (potentially sampled if `sample=true`).

## WebSocket Events

-   Connect to the SocketIO server (usually `ws://localhost:5001`).
-   Listen for `staff_update` events, which emit JSON data for a staff member whenever their simulated data is updated in the live simulation loop. 