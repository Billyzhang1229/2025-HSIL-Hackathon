import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Removed NavLink, useLocation, useNavigate from here
import { Card, Grid, Title, Text, Metric, Col, Badge, Select, SelectItem, Button, Flex } from "@tremor/react";
import { BeakerIcon, HeartIcon, ArrowTrendingUpIcon, FunnelIcon, ArrowsUpDownIcon } from '@heroicons/react/24/solid'; // Added FunnelIcon, ArrowsUpDownIcon

// Import page components
import DashboardPage from './pages/DashboardPage';
import ClassicCardsPage from './pages/ClassicCardsPage';
// Import NavigationBar component
import NavigationBar from './components/NavigationBar';

// Define the structure of the staff data we expect
interface StaffData {
  id: number;
  name: string;
  role: string;
  stress_level: 'Normal' | 'High' | 'Critical';
  current_heart_rate: number;
  current_hrv: number;
  last_update: string | null;
}

// Define structure for historical data points
interface WearablePoint {
    timestamp: string; // ISO format string
    heart_rate: number | null;
    hrv: number | null;
}

// Determine badge color based on stress level
const getStressColor = (level: StaffData['stress_level']) => {
  switch (level) {
    case 'Critical': return 'red';
    case 'High': return 'orange';
    default: return 'emerald'; // Use emerald for Normal for better visibility
  }
};

// Define stress level sort order
const stressLevelOrder: { [key in StaffData['stress_level']]: number } = {
    'Critical': 1,
    'High': 2,
    'Normal': 3
};

// Use environment variable for backend URL, fallback for local dev
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
const SOCKET_URL = BACKEND_URL.replace(/^http/, 'ws'); // Convert http to ws for socket

console.log(`Connecting to Backend API at: ${BACKEND_URL}`);
console.log(`Connecting to Socket at: ${SOCKET_URL}`);

type SortOrder = 'status' | 'name'; // Added sort order type
type TimeRange = '1m' | '5m' | '10m' | '30m' | '1h'; // Added time range type

// --- Main App Component (Handles Routing and Shared State) ---
function App() {
  const [staffList, setStaffList] = useState<StaffData[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [socket, setSocket] = useState<Socket | null>(null);

  // --- New State Variables ---
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [filterRole, setFilterRole] = useState<string>('All'); // 'All' or specific role
  const [sortOrder, setSortOrder] = useState<SortOrder>('status'); // 'status' or 'name'
  const [timeRange, setTimeRange] = useState<TimeRange>('5m'); // Default time range
  const [historicalData, setHistoricalData] = useState<WearablePoint[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  // --- End New State Variables ---

  // Effect for initial data fetch and WebSocket connection
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/staff`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: StaffData[] = await response.json();
        setStaffList(data);
        console.log("Initial staff data fetched:", data);
        // Select the first staff member by default if list is not empty
        if (data.length > 0 && selectedStaffId === null) {
             // setSelectedStaffId(data[0].id); // Temporarily disable auto-select
        }
      } catch (error) {
        console.error("Failed to fetch initial staff data:", error);
      }
    };

    fetchInitialData();

    const newSocket = io(SOCKET_URL, { transports: ['websocket'] });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('staff_update', (updatedStaff: StaffData) => {
      // No console log here to avoid flooding for potentially frequent updates
      setStaffList((prevList) =>
        prevList.map((staff) =>
          staff.id === updatedStaff.id ? updatedStaff : staff
        )
      );
    });

    newSocket.on('connect_error', (err: Error) => {
      console.error('Socket connection error:', err);
    });

    // Cleanup
    return () => {
      console.log("Disconnecting socket...");
      if (newSocket.connected) {
        newSocket.disconnect();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- New useEffect for fetching historical data ---
  useEffect(() => {
    if (selectedStaffId === null) {
      setHistoricalData([]); // Clear data if no staff is selected
      return;
    }

    const fetchHistoricalData = async () => {
      setIsLoadingHistory(true);
      let minutes: number;
      switch (timeRange) {
          case '1m': minutes = 1; break;
          case '5m': minutes = 5; break;
          case '10m': minutes = 10; break;
          case '30m': minutes = 30; break;
          case '1h': minutes = 60; break;
          default: minutes = 5; // Default to 5 minutes
      }

      console.log(`Fetching historical data for Staff ID ${selectedStaffId}, time range ${timeRange} (${minutes}m)...`);
      try {
          const response = await fetch(`${BACKEND_URL}/api/staff/${selectedStaffId}/data?minutes=${minutes}`);
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: WearablePoint[] = await response.json();
          console.log(`Historical data received for Staff ID ${selectedStaffId}:`, data);
          setHistoricalData(data);
      } catch (error) {
          console.error(`Failed to fetch historical data for Staff ID ${selectedStaffId}:`, error);
          setHistoricalData([]); // Clear data on error
      } finally {
          setIsLoadingHistory(false);
      }
    };

    fetchHistoricalData();
  }, [selectedStaffId, timeRange]); // Re-run when selected staff or time range changes
  // --- End New useEffect ---

  // --- Compute Display List (Filtering & Sorting) ---
  const uniqueRoles = ['All', ...new Set(staffList.map(staff => staff.role))]; // Get unique roles for filter

  const displayList = staffList
    .filter(staff => filterRole === 'All' || staff.role === filterRole)
    .sort((a, b) => {
      if (sortOrder === 'status') {
        return stressLevelOrder[a.stress_level] - stressLevelOrder[b.stress_level] || a.name.localeCompare(b.name);
      } else { // sortOrder === 'name'
        return a.name.localeCompare(b.name);
      }
    });
  // --- End Compute Display List ---

  const selectedStaff = staffList.find(staff => staff.id === selectedStaffId);

  // --- Chart Data Formatting ---
  const chartFormatter = (value: number | null) => (value !== null ? `${value}` : 'N/A');

  const heartRateData = historicalData.map(d => ({
      time: new Date(d.timestamp).toLocaleTimeString(),
      'Heart Rate (bpm)': d.heart_rate,
  }));

  const hrvData = historicalData.map(d => ({
      time: new Date(d.timestamp).toLocaleTimeString(),
      'HRV (ms)': d.hrv,
  }));
  // --- End Chart Data Formatting ---

  return (
    <Router>
      <main className="p-6 sm:p-10 bg-ai-bg min-h-screen text-tremor-content-strong">
        <Flex flexDirection="col" alignItems='start' className="gap-6">
          {/* Header with NavigationBar */}
          <Flex justifyContent="between" alignItems="start" className="w-full">
            <Title className="text-ai-primary text-2xl">St. Samoht's Hospital Wellness Hub</Title>
            <Badge color={isConnected ? 'emerald' : 'red'} size="sm">
              {isConnected ? 'Live Connection' : 'Disconnected'}
            </Badge>
          </Flex>

          {/* Navigation Bar */}
          <NavigationBar />

          {/* Page Content Area - Routes */}
          <div className="w-full">
            <Routes>
              <Route
                path="/"
                element={(
                  <DashboardPage
                    staffList={staffList}
                    selectedStaffId={selectedStaffId}
                    setSelectedStaffId={setSelectedStaffId}
                  />
                )}
              />
              <Route
                path="/classic"
                element={(
                  <ClassicCardsPage
                    staffList={staffList}
                    setSelectedStaffId={setSelectedStaffId}
                  />
                )}
              />
            </Routes>
          </div>
        </Flex>
      </main>
    </Router>
  );
}

export default App; 