# backend/simulator.py
import random
from datetime import datetime, timedelta
import logging
import math  # Added for MWI calc
from models import Staff, WearableData

logger = logging.getLogger(__name__)

# Store baseline HR/HRV and recent trend to make simulation slightly more realistic
staff_simulation_state = {}
last_simulated_day = None  # Track the day to update sleep daily


def initialize_simulation_state(staff_list):
    """Initialize state for each staff member if not already present."""
    global last_simulated_day
    current_day = datetime.utcnow().day
    if last_simulated_day is None:  # Initialize on first run
        last_simulated_day = current_day

    for staff in staff_list:
        if staff.id not in staff_simulation_state:
            staff_simulation_state[staff.id] = {
                "baseline_hr": random.randint(60, 80),
                "baseline_hrv": random.randint(40, 70),
                "hr_trend": 0,  # -1 (decreasing), 0 (stable), 1 (increasing)
                "hrv_trend": 0,
                "stress_event_chance": 0.05,  # 5% chance of starting a stress event per cycle
                # Add initial values for new fields (can be randomized)
                "sleep_hours": random.uniform(5.5, 8.5),
                "base_steadiness": random.uniform(0.7, 0.95),
                "sleep_index_last_night": random.uniform(
                    5.0, 9.5
                ),  # Initial last night value
            }
            logger.info(
                f"Initialized simulation state for Staff ID {staff.id} ({staff.name})"
            )
        # Update sleep index if it's a new day (or initialization)
        elif last_simulated_day != current_day:
            staff_simulation_state[staff.id]["sleep_index_last_night"] = random.uniform(
                5.0, 9.5
            )
            logger.info(
                f"Updated last night sleep index for Staff ID {staff.id} for new day."
            )

    # Update the tracked day after processing all staff
    if last_simulated_day != current_day:
        last_simulated_day = current_day


def calculate_stress_level(hr, hrv):
    """Determines stress level based on heart rate and HRV."""
    if hr > 120 or hrv < 25:
        return "Critical"
    elif hr > 100 or hrv < 40:
        return "High"
    else:
        return "Normal"


# --- New MWI Calculation --- ( Placeholder - needs refinement! )
def calculate_mwi(hr: int, hrv: int, steadiness: float, sleep: float) -> float:
    """Calculates a basic Mental Wellness Index (0-100). Higher is better.

    This is a VERY simplified placeholder formula.
    A real MWI would involve more complex analysis, trends, and potentially
    machine learning models based on validated research.
    """
    # Normalize/score each component (examples)
    hr_score = max(
        0, 100 - (max(0, hr - 60) * 1.5)
    )  # Lower HR (closer to 60) is better
    hrv_score = min(100, max(0, (hrv - 30) * 2))  # Higher HRV (above 30) is better
    steadiness_score = min(100, max(0, steadiness * 100))  # Higher steadiness is better
    sleep_score = min(100, max(0, (sleep - 4) * 25))  # 7-8 hours ideal (scores 75-100)

    # Combine scores (example weights - adjust as needed)
    # Weights: HR(20%), HRV(30%), Steadiness(30%), Sleep(20%)
    mwi = (
        (hr_score * 0.20)
        + (hrv_score * 0.30)
        + (steadiness_score * 0.30)
        + (sleep_score * 0.20)
    )

    return round(max(0, min(100, mwi)), 1)  # Clamp between 0-100 and round


# --- End MWI Calculation ---


# --- NEW Historical Data Population Function ---
def populate_historical_data(app, db):
    """Fills the WearableData table with simulated data for the past 48 hours."""
    logger.info("Starting historical data population...")
    all_staff = Staff.query.all()
    if not all_staff:
        logger.warning("Cannot populate historical data: No staff found.")
        return

    # Ensure simulation state is initialized for all staff
    # Use a separate state copy for historical simulation to avoid conflicts?
    # For simplicity, we'll use the main state but reset trends.
    global staff_simulation_state, last_simulated_day
    staff_simulation_state = {}  # Reset state for historical run
    last_simulated_day = None
    initialize_simulation_state(all_staff)  # Initialize based on current DB state

    now = datetime.utcnow()
    start_time = now - timedelta(days=2)
    current_time = start_time

    simulation_interval_seconds = 5  # Simulate data point every 5 seconds
    data_to_add = []

    while current_time <= now:
        current_day = current_time.day
        current_hour_utc = current_time.hour
        current_minute = current_time.minute

        # Update daily values if the day has rolled over
        if last_simulated_day != current_day:
            for staff_id in staff_simulation_state:
                # Simulate new sleep for the *previous* night when day changes
                staff_simulation_state[staff_id]["sleep_index_last_night"] = (
                    random.uniform(5.0, 9.5)
                )
            last_simulated_day = current_day
            logger.debug(f"Historical sim: Updated daily values for day {current_day}")

        for staff in all_staff:
            state = staff_simulation_state[staff.id]
            # Use staff's current values as starting point if needed, or simulate from scratch
            # For simplicity, using state + staff model defaults as baseline
            baseline_hr = state["baseline_hr"]
            baseline_hrv = state["baseline_hrv"]
            base_steadiness = state["base_steadiness"]
            sleep_index_last_night = state["sleep_index_last_night"]
            sleep_hours = state["sleep_hours"]  # Keep constant for now

            # --- Simulate HR/HRV based on state trend (similar to live sim) ---
            # We need current_hr/hrv to simulate next step, use state or defaults
            prev_hr = staff.current_heart_rate  # Or state.get('last_hr', baseline_hr)
            prev_hrv = staff.current_hrv  # Or state.get('last_hrv', baseline_hrv)

            hr_change = random.randint(-2, 2) + state["hr_trend"] * 2
            # Simplified trend logic for historical data (less likely to have extreme peaks)
            if state["hr_trend"] == 0 and random.random() < (
                state["stress_event_chance"] / 10
            ):  # Lower chance
                hr_change += random.randint(10, 20)
                state["hr_trend"] = 1
            elif state["hr_trend"] == 1:
                state["hr_trend"] = -1
            elif state["hr_trend"] == -1:
                if prev_hr <= baseline_hr + 5:
                    state["hr_trend"] = 0

            current_hr = prev_hr + hr_change
            if state["hr_trend"] == 0:
                if current_hr > baseline_hr + 10:
                    current_hr -= random.randint(0, 2)
                elif current_hr < baseline_hr - 5:
                    current_hr += random.randint(0, 1)
            current_hr = max(50, min(160, current_hr))

            hrv_change = random.randint(-3, 3)
            if state["hr_trend"] == 1:
                hrv_change -= random.randint(2, 5)
            elif state["hr_trend"] == -1:
                hrv_change += random.randint(1, 4)
            if current_hr > 100:
                hrv_change -= random.randint(0, 3)
            elif current_hr < 70:
                hrv_change += random.randint(0, 1)
            current_hrv = max(15, min(100, prev_hrv + hrv_change))

            # Update state for next iteration (optional, but helps continuity)
            # state['last_hr'] = current_hr
            # state['last_hrv'] = current_hrv

            # --- Simulate Steadiness (similar to live sim) ---
            prev_steadiness = (
                staff.current_steadiness
            )  # Or state.get('last_steadiness', base_steadiness)
            steadiness_change = random.uniform(-0.05, 0.05)
            if state["hr_trend"] == 1:
                steadiness_change -= random.uniform(0.0, 0.1)
            elif state["hr_trend"] == -1:
                steadiness_change += random.uniform(0.0, 0.05)
            current_steadiness = round(
                max(0, min(1, base_steadiness + steadiness_change)), 2
            )
            # state['last_steadiness'] = current_steadiness

            # --- Determine Sleep Index to store for this timestamp (Improved Logic) ---
            current_sleep_index_to_store = 0.0  # Default to 0 (awake/daytime)

            sleep_start_hour = 23
            deep_sleep_start_hour = 0  # Midnight
            wake_up_start_hour = 6
            sleep_end_hour = 7  # Fully awake by 7:00

            # Check if within the potential sleep window (22:00 - 07:59 UTC)
            # This broad check avoids calculating sleep outside these hours
            if not (
                sleep_end_hour <= current_hour_utc < sleep_start_hour - 1
            ):  # simplified check for outside 7am to 10pm

                # Falling Asleep Phase (23:00 - 23:59)
                if current_hour_utc == sleep_start_hour:
                    progress = current_minute / 60.0
                    target = sleep_index_last_night * progress
                    variation = random.uniform(-0.5, 0.5)
                    current_sleep_index_to_store = round(
                        max(0, min(10, target + variation)), 1
                    )

                # Deep Sleep Phase (00:00 - 05:59)
                elif deep_sleep_start_hour <= current_hour_utc < wake_up_start_hour:
                    variation = random.uniform(
                        -0.7, 0.7
                    )  # Slightly more variation during sleep
                    current_sleep_index_to_store = round(
                        max(0, min(10, sleep_index_last_night + variation)), 1
                    )

                # Waking Up Phase (06:00 - 06:59)
                elif current_hour_utc == wake_up_start_hour:
                    progress = current_minute / 60.0
                    target = sleep_index_last_night * (1 - progress)
                    variation = random.uniform(-0.3, 0.3)
                    current_sleep_index_to_store = round(
                        max(0, min(10, target + variation)), 1
                    )

                # Else (e.g., 22:xx, 07:xx), it remains 0.0 as initialized

            # --- Calculate MWI ---
            mwi = calculate_mwi(
                current_hr, current_hrv, current_steadiness, sleep_hours
            )

            # Create WearableData object
            data_point = WearableData(
                staff_id=staff.id,
                timestamp=current_time,
                heart_rate=current_hr,
                hrv=current_hrv,
                steadiness=current_steadiness,
                sleep_index=current_sleep_index_to_store,
                mwi=mwi,  # Store calculated MWI
            )
            data_to_add.append(data_point)

            # --- Update Staff model (important for subsequent iterations) ---
            # This ensures the *next* simulation step uses updated values
            # We'll update the Staff object in memory but commit only at the end of history
            # Note: This might be slow for very long histories; consider optimizing if needed
            staff.current_heart_rate = current_hr
            staff.current_hrv = current_hrv
            staff.current_steadiness = current_steadiness
            staff.mental_wellness_index = mwi
            staff.current_sleep_index = round(
                sleep_index_last_night, 1
            )  # Store actual last night score here
            staff.last_update = current_time  # Track last simulated update time

        # Increment time for the next loop iteration
        current_time += timedelta(seconds=simulation_interval_seconds)

    # Bulk insert the generated data
    if data_to_add:
        logger.info(f"Bulk inserting {len(data_to_add)} historical records...")
        db.session.bulk_save_objects(data_to_add)
        db.session.commit()
        logger.info("Bulk insert complete.")
    else:
        logger.warning("No historical data points were generated.")

    # --- Final Update for Staff Model ---
    # After populating history, commit the final state of the staff objects
    if all_staff:
        logger.info("Committing final staff states after historical population...")
        try:
            db.session.add_all(all_staff)  # Add potentially modified staff objects
            db.session.commit()
            logger.info("Final staff states committed.")
        except Exception as e:
            logger.error(f"Error committing final staff states: {e}", exc_info=True)
            db.session.rollback()


# --- End Historical Data Population ---


# --- Simulation Logic for Live Updates ---
def simulate_data(app, db, socketio, update_callback):
    with app.app_context():  # Ensure we have app context
        all_staff = Staff.query.all()
        if not all_staff:
            logger.warning("simulate_data: No staff found to simulate.")
            return

        now = datetime.utcnow()
        simulated_data_points = []  # Collect points to potentially save
        staff_to_update = []  # Collect staff objects that changed

        for staff in all_staff:
            state = staff_simulation_state[staff.id]
            baseline_hr = state["baseline_hr"]
            baseline_hrv = state["baseline_hrv"]
            base_steadiness = state["base_steadiness"]

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

            # --- Simulate Steadiness --- (Simple fluctuation around baseline)
            steadiness_change = random.uniform(-0.05, 0.05)
            # Reduce steadiness slightly during stress
            if state["hr_trend"] == 1:
                steadiness_change -= random.uniform(0.0, 0.1)
            # Increase slightly during recovery
            elif state["hr_trend"] == -1:
                steadiness_change += random.uniform(0.0, 0.05)
            current_steadiness = max(0, min(1, base_steadiness + steadiness_change))
            # --- End Steadiness Simulation ---

            # --- Get Sleep Index ---
            # Get the value generated for last night
            sleep_index_last_night = state["sleep_index_last_night"]
            # Set current sleep index to 0 if it's considered 'daytime' (e.g., 8 AM - 10 PM UTC)
            current_hour_utc = now.hour
            is_night = 22 <= current_hour_utc or current_hour_utc < 8
            # Get the stored sleep hours (or default)
            sleep_hours = staff.sleep_hours_last_night or 7.5

            # Determine sleep index to store in WearableData (0 during day)
            # Use staff.current_sleep_index which should hold last night's score
            sleep_index_to_store = 0.0
            if is_night and staff.current_sleep_index is not None:
                sleep_index_to_store = staff.current_sleep_index

            # ... Calculate MWI (using sleep_hours) ...
            current_mwi = calculate_mwi(
                current_hr, current_hrv, current_steadiness, sleep_hours
            )
            # Clamp MWI just in case
            current_mwi = max(0, min(100, round(current_mwi, 1)))

            # Create new data record (WearableData)
            data_point = WearableData(
                staff_id=staff.id,
                timestamp=now,
                heart_rate=current_hr,
                hrv=current_hrv,
                steadiness=round(current_steadiness, 2),
                # Store the potentially zeroed-out value for current timestamp
                sleep_index=sleep_index_to_store,
                mwi=current_mwi,  # Also store MWI in historical record
            )
            simulated_data_points.append(data_point)

            # Update staff's current status
            staff.current_heart_rate = current_hr
            staff.current_hrv = current_hrv
            staff.stress_level = stress_level
            staff.current_steadiness = round(
                current_steadiness, 2
            )  # Store rounded value
            staff.current_sleep_index = round(sleep_index_to_store, 1)
            staff.sleep_hours_last_night = round(sleep_hours, 1)
            staff.mental_wellness_index = current_mwi  # Update MWI on staff object
            staff.last_update = now

            # Commit changes for this staff member
            staff_to_update.append(staff)

            # Call the update callback (e.g., send_staff_update)
            if update_callback:
                update_callback(staff)

        # --- Commit Changes ---
        try:
            # Add new wearable data points
            if simulated_data_points:
                db.session.add_all(simulated_data_points)

            # Add staff objects marked for update (SQLAlchemy handles updates)
            # No need to explicitly add if they were fetched from the session,
            # but adding them ensures they are part of the commit.
            # If staff objects were modified, they are already dirty.
            # db.session.add_all(staff_to_update) # Usually not needed if staff came from session

            db.session.commit()  # Commit both WearableData and Staff changes
            logger.debug(
                f"Committed {len(simulated_data_points)} data points and updates for {len(staff_to_update)} staff."
            )
        except Exception as e:
            logger.error(f"Error committing simulation data: {e}", exc_info=True)
            db.session.rollback()
