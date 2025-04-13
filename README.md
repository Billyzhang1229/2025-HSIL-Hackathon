# Shield

## Staff Health Intelligence for Early Level Deterioration

**Protecting those who protect us**

---

## The Challenge: The NHS Workforce Crisis

The NHS is facing unprecedented challenges regarding its workforce:

*   **Financial Strain:** Industrial action in 2023-24 resulted in an estimated loss of £1.5 billion.
*   **Performance Decline:** 73% of staff reported their performance suffered when overworked.
*   **Hidden Fatigue:** Surveys reveal a disconnect, with 67% admitting feeling fine despite showing physical fatigue symptoms.
*   **Ineffective Monitoring:** Current approaches like self-reporting, surveys, and basic chatbots often fail to capture early signs of deterioration.

> Clearly the cost of inaction is very high. Without intervention, the NHS faces worsening staff shortages, increased medical errors, and rising costs. Our current approach is unsustainable and puts both healthcare workers and patients at risk. Healthcare systems are actively looking for solutions.

> “Regular inspections are mandatory for cars on our roads, but in our healthcare system, we often wait until our bodies break down before taking action. Why wait for something to go wrong - why not prioritise our healthcare provider’s health the same way?”

---

## The Solution: SHIELD

SHIELD combines wearable technology, AI, and workforce optimization to predict and prevent burnout before it occurs.

1.  **Wearable Integration:**
    *   Leverages data from existing wearables staff already own (smartwatches, fitness trackers).
    *   Tracks key physiological markers: sleep patterns, recovery metrics, movement/activity, and heart rate variability (HRV).
    *   Eliminates the need for costly new hardware deployments.

2.  **AI Prediction Engine:**
    *   Combines health metrics, work schedules, and environmental data.
    *   Aims to flag burnout risk up to three weeks before overt symptoms manifest.
    *   Utilizes a proprietary dataset for personalized predictions and targeted interventions.
    *   Enables research collaborations to study burnout factors and estimate associated costs.

3.  **Organisational Dashboard:**
    *   Provides a clear, actionable view of staff wellness trends and burnout risk across departments.
    *   Helps identify and optimize for hotspots of high stress, patient risk, and workload imbalances.

---

## This Prototype: The Organisational Dashboard

This repository contains the code implementation for the **Organisational Dashboard** component of the SHIELD project, along with a backend **simulation engine** to provide data for demonstration purposes.

### Technology Stack

*   **Backend:**
    *   Python
    *   Flask (Web framework)
    *   Flask-SQLAlchemy (Database ORM)
    *   Flask-SocketIO (Real-time communication)
    *   APScheduler (Running the simulation)
    *   SQLite (Database)
*   **Frontend:**
    *   React
    *   TypeScript
    *   Vite (Build tool)
    *   Tremor (UI component library)
    *   Recharts (Charting library)
    *   Tailwind CSS (Styling)
    *   Socket.IO Client (Real-time communication)
    *   `react-parallax-tilt` (Card hover effect)

### Running the Prototype

**Prerequisites:**

*   Git
*   Python 3.x and Pip
*   Node.js and a package manager (npm, yarn, or pnpm)

**Steps:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Billyzhang1229/2025-HSIL-Hackathon.git
    cd 2025-HSIL-Hackathon
    ```

2.  **Setup and Run Backend:**
    ```bash
    # Navigate to backend directory
    cd backend

    # Create and activate a virtual environment (recommended)
    python -m venv venv
    source venv/bin/activate  # Use `venv\Scripts\activate` on Windows

    # Install backend dependencies
    pip install -r requirements.txt

    # Run the backend server & simulator
    python app.py
    ```
    *   This will start the Flask server (usually on port 5001).
    *   On the first run, it creates `instance/hospital.db`, loads staff from `staff_data.json`, and populates ~48 hours of historical data.
    *   The live simulator will run every 5 seconds.
    *   *Note: To reset historical data, stop the server and delete `backend/instance/hospital.db`.*

3.  **Setup and Run Frontend:**
    ```bash
    # Navigate to frontend directory (from the root)
    cd ../frontend

    # Install frontend dependencies (use your preferred manager)
    npm install
    # or: yarn install
    # or: pnpm install

    # Run the frontend development server
    npm run dev
    # or: yarn dev
    # or: pnpm dev
    ```
    *   This will start the Vite development server (usually on port 3000 or similar).
    *   Open the provided URL in your browser to view the dashboard.

4.  **Explore:** Interact with the dashboard – select staff, change time ranges, filter, and sort to see the simulated data and UI features.

---

## Human-in-the-Loop Design & Rollout Strategy

SHIELD is designed with a user-centric, phased approach:

*   **Phase 0:** Single Floor Pilot
*   **Phase 1:** Single Ward Pilot (e.g., 20 nurses, 10 doctors)
*   **Phase 2:** Expansion to 3 Departments (e.g., A&E, ICU, General Medicine)
*   **Phase 3:** Full Hospital Implementation
*   **Phase 4:** Multi-Hospital Deployment

---

## The Impact

By proactively identifying and mitigating burnout risk, SHIELD aims to deliver significant benefits:

*   **Estimated savings of £42M across the NHS** through reduced absenteeism, turnover, and improved staff retention.
*   Improved staff well-being and morale.
*   Enhanced patient safety through a more resilient and focused workforce.

---

## The Team

*   **Ananya Kaushik:** University of Cambridge - Clinical Genomics Specialist, AI for Life Science/Healthcare Consultant
*   **Ao Zhang:** University of Oxford - Computer Scientist, AI 4 Health Data Science

---

**Help us protect those who protect us everyday.**