# NHS Wearable Dashboard - Backend

This directory contains the Python Flask backend for the NHS Wearable Dashboard prototype.

## Features

- **API:** Provides REST endpoints to fetch staff information and historical wearable data.
- **Real-time Updates:** Uses Flask-SocketIO to push live updates of staff status (heart rate, HRV, stress level) to connected clients.
- **Data Simulation:** Includes a simulator (`simulator.py`) that periodically generates realistic wearable data for staff members.
- **Database:** Uses SQLite (`instance/hospital.db`) for persistent storage of staff and wearable data.

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

The server will start (usually on `http://0.0.0.0:5001`). The first time it runs, it will create the `instance/hospital.db` file and populate it with sample staff data. The simulator will start running automatically, generating data every 5 seconds.

## Endpoints

- `GET /api/staff`: Returns a list of all staff members and their current status.
- `GET /api/staff/<id>/data?minutes=N`: Returns wearable data for the specified staff ID for the last N minutes (default is 60).

## WebSocket Events

- Connect to the SocketIO server (usually `ws://localhost:5001`).
- Listen for `staff_update` events, which emit JSON data for a staff member whenever their simulated data is updated. 