# NHS Wearable Dashboard - Frontend

This directory contains the React frontend for the NHS Wearable Dashboard prototype, built using Vite, TypeScript, and Tremor.

## Features

- **Real-time Updates:** Connects to the backend via Socket.IO to receive and display live staff wellness data (Heart Rate, HRV, Stress Level).
- **Modern UI:** Uses the Tremor component library for a clean, data-rich dashboard interface.
- **Interactive Cards:** Displays each staff member's status in individual cards with visual indicators (badges, icons) based on their stress level and vital signs.
- **Custom Styling:** Includes Tailwind CSS configuration with custom "AI-themed" colors.

## Setup and Running

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    *   Using npm:
        ```bash
        npm install
        ```
    *   Using yarn:
        ```bash
        yarn install
        ```

3.  **Run the development server:**
    *   Using npm:
        ```bash
        npm run dev
        ```
    *   Using yarn:
        ```bash
        yarn dev
        ```

The application will typically be available at `http://localhost:3000`. Ensure the backend server is running (usually on port 5001) for the frontend to connect and fetch data.

## Backend Connection

The frontend expects the backend API and Socket.IO server to be running at `http://localhost:5001`. This is configured in `src/App.tsx`. If your backend runs on a different address or port, update the `fetch` URL and the `io()` connection URL accordingly.

## Building for Production

*   Using npm:
    ```bash
    npm run build
    ```
*   Using yarn:
    ```bash
    yarn build
    ```

This command generates a `dist` folder with the optimized static assets for deployment. 