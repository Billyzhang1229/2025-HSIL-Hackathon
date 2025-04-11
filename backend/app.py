# backend/app.py
import eventlet

eventlet.monkey_patch()

import os
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import logging

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# --- Absolute Path Setup ---
basedir = os.path.abspath(os.path.dirname(__file__))
instance_folder = os.path.join(basedir, "instance")
db_path = os.path.join(instance_folder, "hospital.db")
# Ensure instance folder exists *before* configuring the app
try:
    if not os.path.exists(instance_folder):
        os.makedirs(instance_folder)
        logger.info(f"Created instance folder at {instance_folder}")
except OSError as e:
    logger.error(f"Error creating instance folder {instance_folder}: {e}")
# --- End Absolute Path Setup ---

# Initialize Flask app
app = Flask(__name__, instance_path=instance_folder, instance_relative_config=False)

# Configuration
app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY", "your_secret_key_here"
)  # Change in production
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize extensions
CORS(
    app, resources={r"/api/*": {"origins": "*"}, r"/socket.io/*": {"origins": "*"}}
)  # Allow frontend access
# Use eventlet for async mode which is required by APScheduler with Flask-SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

# Import models after db is initialized and within app context
from models import db, Staff, WearableData

# Import simulator function
from simulator import simulate_data

# Associate db with app *after* app creation and config
db.init_app(app)


# --- Database Initialization ---
def init_db():
    """Initializes the database and adds sample staff if empty."""
    # Folder creation moved before app init
    with app.app_context():
        logger.info(f"Ensuring database tables exist at {db_path}...")
        # The check for instance folder existence is done above now.
        # instance_path = os.path.join(app.instance_path) <--- Remove/Comment out
        # if not os.path.exists(instance_path):
        #     os.makedirs(instance_path)
        #     logger.info(f"Created instance folder at {instance_path}")

        try:
            db.create_all()
            logger.info("Database tables created (if they didn't exist).")
        except Exception as e:
            logger.error(f"Error during db.create_all(): {e}", exc_info=True)
            raise  # Re-raise the exception to see the problem

        if Staff.query.count() == 0:
            logger.info("No staff found. Adding sample staff...")
            sample_staff = [
                Staff(name="Dr. Alice Green", role="Doctor"),
                Staff(name="Bob White", role="Nurse"),
                Staff(name="Carol Black", role="Nurse"),
                Staff(name="Dave Gray", role="Technician"),
            ]
            db.session.add_all(sample_staff)
            db.session.commit()
            logger.info("Sample staff added.")
        else:
            logger.info(f"Found {Staff.query.count()} staff members in the database.")


# --- API Endpoints ---
@app.route("/api/staff", methods=["GET"])
def get_staff():
    """Returns a list of all staff members with their latest status."""
    staff_list = Staff.query.all()
    return jsonify([staff.to_dict() for staff in staff_list])


@app.route("/api/staff/<int:staff_id>/data", methods=["GET"])
def get_staff_data(staff_id):
    """Returns recent wearable data for a specific staff member."""
    # Default to last 1 hour, allow specifying time range via query params (e.g., ?minutes=10)
    minutes_back = int(request.args.get("minutes", 60))
    time_threshold = datetime.utcnow() - timedelta(minutes=minutes_back)

    data = (
        WearableData.query.filter(
            WearableData.staff_id == staff_id, WearableData.timestamp >= time_threshold
        )
        .order_by(WearableData.timestamp.asc())
        .all()
    )

    if not data and Staff.query.get(staff_id) is None:
        return jsonify({"error": "Staff member not found"}), 404

    return jsonify([d.to_dict() for d in data])


# --- SocketIO Events ---
@socketio.on("connect")
def handle_connect():
    """Handles new client connections."""
    logger.info(f"Client connected: {request.sid}")
    # Optionally send initial full state
    # staff_list = Staff.query.all()
    # emit('initial_state', {'staff': [s.to_dict() for s in staff_list]}, room=request.sid)


@socketio.on("disconnect")
def handle_disconnect():
    """Handles client disconnections."""
    logger.info(f"Client disconnected: {request.sid}")


def send_staff_update(staff_member):
    """Emits updated staff data via SocketIO."""
    update_data = staff_member.to_dict()
    logger.debug(f"Emitting update for staff {staff_member.id}: {update_data}")
    try:
        socketio.emit("staff_update", update_data)
        logger.debug(f"Successfully emitted staff_update for staff {staff_member.id}")
    except Exception as e:
        logger.error(
            f"Error emitting staff_update for staff {staff_member.id}: {e}",
            exc_info=True,
        )


# --- Simulation Scheduler ---
scheduler = BackgroundScheduler()


def run_simulation_job():
    """Function to be scheduled for running the simulation."""
    logger.info("Running simulation job...")
    with app.app_context():  # Need app context for db operations
        simulate_data(app, db, socketio, send_staff_update)
    logger.info("Simulation job finished.")


# --- Main Execution ---
if __name__ == "__main__":
    init_db()  # Ensure DB is ready before starting

    # Schedule the simulation to run every 5 seconds
    scheduler.add_job(func=run_simulation_job, trigger="interval", seconds=5)
    scheduler.start()
    logger.info("Simulation scheduler started, running every 5 seconds.")

    logger.info("Starting Flask-SocketIO server...")
    # Use eventlet server for better async/WebSocket performance
    # Run on 0.0.0.0 to be accessible from the frontend container/host
    socketio.run(app, host="0.0.0.0", port=5001, debug=False, use_reloader=False)

    # Shut down the scheduler when exiting
    try:
        # Keep the main thread alive
        while True:
            pass
    except (KeyboardInterrupt, SystemExit):
        logger.info("Shutting down scheduler...")
        scheduler.shutdown()
        logger.info("Server stopped.")
