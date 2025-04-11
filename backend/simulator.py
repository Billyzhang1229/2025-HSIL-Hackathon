# backend/simulator.py
import random
from datetime import datetime
import logging
from models import Staff, WearableData

logger = logging.getLogger(__name__)

# Store baseline HR/HRV and recent trend to make simulation slightly more realistic
staff_simulation_state = {}


def initialize_simulation_state(staff_list):
    """Initialize state for each staff member if not already present."""
    for staff in staff_list:
        if staff.id not in staff_simulation_state:
            staff_simulation_state[staff.id] = {
                "baseline_hr": random.randint(60, 80),
                "baseline_hrv": random.randint(40, 70),
                "hr_trend": 0,  # -1 (decreasing), 0 (stable), 1 (increasing)
                "hrv_trend": 0,
                "stress_event_chance": 0.05,  # 5% chance of starting a stress event per cycle
            }
            logger.info(
                f"Initialized simulation state for Staff ID {staff.id} ({staff.name})"
            )


def calculate_stress_level(hr, hrv):
    """Determines stress level based on heart rate and HRV."""
    if hr > 120 or hrv < 25:
        return "Critical"
    elif hr > 100 or hrv < 40:
        return "High"
    else:
        return "Normal"


def simulate_data(app, db, socketio, update_callback):
    """Simulates wearable data for all staff members."""
    try:
        staff_list = Staff.query.all()
        if not staff_list:
            logger.warning("Simulator: No staff members found in the database.")
            return

        initialize_simulation_state(staff_list)

        now = datetime.utcnow()

        for staff in staff_list:
            state = staff_simulation_state[staff.id]
            baseline_hr = state["baseline_hr"]
            baseline_hrv = state["baseline_hrv"]

            # Simulate HR fluctuations
            # Base random change + effect of current trend (-1, 0, or 1) * multiplier
            hr_change = random.randint(-2, 2) + state["hr_trend"] * 2

            # --- Trend State Management ---
            # Check if a new stress event should start (only if trend is stable)
            if (
                state["hr_trend"] == 0
                and random.random() < state["stress_event_chance"]
            ):
                hr_change += random.randint(20, 40)  # Add large spike
                state["hr_trend"] = 1  # Start increasing trend (stress peak)
                state["stress_event_chance"] = (
                    0  # Disable new events during stress/recovery
                )
                logger.info(f"Stress event triggered for Staff ID {staff.id}")
            # Check if stress peak phase should end and recovery should begin
            elif state["hr_trend"] == 1:
                state["hr_trend"] = -1  # Start recovery trend (decreasing)
                logger.info(f"Recovery phase started for Staff ID {staff.id}")
            # Check if recovery phase should end
            elif state["hr_trend"] == -1:
                # Check if HR is back near baseline OR just end after one cycle
                if staff.current_heart_rate <= baseline_hr + 5:
                    state["hr_trend"] = 0  # Back to normal trend
                    state["stress_event_chance"] = (
                        0.05  # Re-enable chance for new stress events
                    )
                    logger.info(f"Recovery phase ended for Staff ID {staff.id}")
                # else: keep hr_trend = -1 for another cycle if needed (optional refinement)

            # --- HR Calculation ---
            # Adjust HR based on calculated change
            current_hr = staff.current_heart_rate + hr_change

            # Add gentle pull towards baseline if significantly off AND trend is stable
            if state["hr_trend"] == 0:
                if current_hr > baseline_hr + 10:
                    current_hr -= random.randint(0, 2)  # Stronger pull down
                elif current_hr < baseline_hr - 5:
                    current_hr += random.randint(0, 1)  # Gentle pull up

            # Keep HR within reasonable bounds
            current_hr = max(50, min(160, current_hr))

            # --- HRV Calculation ---
            # Simulate HRV (generally inverse to HR/stress)
            hrv_change = random.randint(-3, 3)
            # Stronger inverse effect based on trend:
            if state["hr_trend"] == 1:  # Stressing -> Lower HRV more
                hrv_change -= random.randint(4, 8)
            elif state["hr_trend"] == -1:  # Recovering -> Increase HRV more
                hrv_change += random.randint(2, 5)

            # General inverse correlation with absolute HR level
            if current_hr > 100:
                hrv_change -= random.randint(1, 5)
            elif current_hr < 70:
                hrv_change += random.randint(0, 2)

            # Keep HRV within reasonable bounds
            current_hrv = max(15, min(100, staff.current_hrv + hrv_change))

            # Simulate steps (simple random increment)
            current_steps = random.randint(0, 10)

            # Determine stress level
            stress_level = calculate_stress_level(current_hr, current_hrv)

            # Create new data record
            new_data = WearableData(
                staff_id=staff.id,
                timestamp=now,
                heart_rate=current_hr,
                hrv=current_hrv,
                steps=current_steps,
            )
            db.session.add(new_data)

            # Update staff's current status
            staff.current_heart_rate = current_hr
            staff.current_hrv = current_hrv
            staff.stress_level = stress_level
            staff.last_update = now

            # Commit changes for this staff member
            db.session.commit()
            logger.debug(
                f"Simulated data for Staff ID {staff.id}: HR={current_hr}, HRV={current_hrv}, Stress={stress_level}, Trend={state['hr_trend']}"
            )

            # Emit update via SocketIO using the callback
            update_callback(staff)

    except Exception as e:
        logger.error(f"Error during simulation: {e}", exc_info=True)
        db.session.rollback()  # Rollback in case of error
