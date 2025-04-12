# NHS Wearable Dashboard - Frontend

This directory contains the React frontend for the NHS Wearable Dashboard prototype, built using Vite, TypeScript, Tremor, Recharts, and Tailwind CSS.

## Features

-   **Real-time Updates:** Connects to the backend via Socket.IO to receive and display live staff wellness data (Heart Rate, HRV, Steadiness, Sleep Index, MWI, Stress Level).
-   **Historical Data Visualization:** Fetches and displays historical trends for wellness metrics using Recharts line charts.
-   **Interactive Time Ranges:** Allows users to select various time spans (1m, 5m, 10m, 30m, 1h, 6h, 1d, 2d, All) for viewing historical data.
-   **Data Sampling:** Intelligently samples data for longer time ranges ('1d', '2d', 'All') to maintain performance.
-   **Filtering & Sorting:**
    -   Filter staff list by Role.
    -   Sort staff list by Status (alert first), Name (A-Z/Z-A), or various metrics (MWI, HR, HRV, Sleep Index, Steadiness).
    -   Sort direction toggles automatically (High-Low / Low-High) when selecting the same sort key.
-   **Modern UI:** Uses the Tremor component library for a clean, data-rich dashboard interface.
-   **Multiple Views:** Offers a detailed dashboard view with graphs and a "Classic Cards" view.
-   **Animated Hover Effects:** Includes a parallax tilt effect on the classic staff cards using `react-parallax-tilt`.
-   **Custom Styling:** Includes Tailwind CSS configuration with custom "AI-themed" colors.

## Setup and Running

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    (Ensure you have Node.js and npm/yarn/pnpm installed)
    *   Using npm:
        ```bash
        npm install
        ```
    *   Using yarn:
        ```bash
        yarn install
        ```
    *   Using pnpm:
        ```bash
        pnpm install
        ```
    *This will install React, Tremor, Recharts, Tailwind CSS, Socket.IO Client, `react-parallax-tilt`, and other necessary development dependencies.*

3.  **Run the development server:**
    *   Using npm:
        ```bash
        npm run dev
        ```
    *   Using yarn:
        ```bash
        yarn dev
        ```
    *   Using pnpm:
        ```bash
        pnpm dev
        ```

The application will typically be available at `http://localhost:3000` or a similar port indicated by Vite. Ensure the backend server is running (usually on port 5001) for the frontend to connect and fetch data.

## Backend Connection

The frontend expects the backend API and Socket.IO server to be running at `http://localhost:5001` (configurable via VITE_BACKEND_URL environment variable). This is configured in `src/App.tsx`.

API endpoints used:
-   `GET /api/staff`: Fetches the list of staff with their latest status.
-   `GET /api/staff/<id>/data?minutes=N&sample=true`: Fetches historical wearable data.
    -   `minutes`: Optional. Limits data to the last N minutes. If omitted, fetches all data.
    -   `sample`: Optional. If `true`, the backend may return a sampled subset of data for long time ranges.

## Building for Production

*   Using npm:
    ```bash
    npm run build
    ```
*   Using yarn:
    ```bash
    yarn build
    ```
*   Using pnpm:
    ```bash
    pnpm build
    ```

This command generates a `dist` folder with the optimized static assets for deployment. 