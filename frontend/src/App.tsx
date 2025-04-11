import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card, Grid, Title, Text, Metric, Col, Badge } from "@tremor/react";
import { BeakerIcon, HeartIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/solid'; // Example icons

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

// Determine badge color based on stress level
const getStressColor = (level: StaffData['stress_level']) => {
  switch (level) {
    case 'Critical': return 'red';
    case 'High': return 'orange';
    default: return 'emerald'; // Use emerald for Normal for better visibility
  }
};

// Use environment variable for backend URL, fallback for local dev
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
const SOCKET_URL = BACKEND_URL.replace(/^http/, 'ws'); // Convert http to ws for socket

console.log(`Connecting to Backend API at: ${BACKEND_URL}`);
console.log(`Connecting to Socket at: ${SOCKET_URL}`);

function App() {
  const [staffList, setStaffList] = useState<StaffData[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Fetch initial staff list via HTTP API
    const fetchInitialData = async () => {
      try {
        // Use the BACKEND_URL variable
        const response = await fetch(`${BACKEND_URL}/api/staff`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: StaffData[] = await response.json();
        setStaffList(data);
        console.log("Initial staff data fetched:", data);
      } catch (error) {
        console.error("Failed to fetch initial staff data:", error);
        // Handle error appropriately in UI if needed
      }
    };

    fetchInitialData();

    // Initialize Socket.IO connection
    // Use the SOCKET_URL variable
    const newSocket = io(SOCKET_URL, {
        transports: ['websocket'], // Force websocket connection
    });

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
      console.log('Received staff update:', updatedStaff);
      setStaffList((prevList) =>
        prevList.map((staff) =>
          staff.id === updatedStaff.id ? updatedStaff : staff
        )
      );
    });

    newSocket.on('connect_error', (err: Error) => {
        console.error('Socket connection error:', err);
        // Handle connection errors (e.g., show message to user)
    });

    // Cleanup function to disconnect socket when component unmounts
    return () => {
      console.log("Disconnecting socket...");
      if (newSocket.connected) {
        newSocket.disconnect();
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <main className="p-6 sm:p-10 bg-ai-bg min-h-screen">
      <Title className="text-ai-primary">NHS Wearable Dashboard</Title>
      <Text className="text-ai-text mb-6">Real-time staff wellness monitoring</Text>

      <Grid numItemsSm={1} numItemsMd={2} numItemsLg={3} className="gap-6">
        {staffList.map((staff) => (
          <Col key={staff.id}>
            <Card decoration="top" decorationColor={getStressColor(staff.stress_level)}>
              <div className="flex items-start space-x-4">
                 {/* <div className="flex-shrink-0"> */}
                    {/* Placeholder for an icon or avatar */}
                    {/* <BeakerIcon className="h-8 w-8 text-ai-secondary" aria-hidden="true" /> */}
                 {/* </div> */}
                 <div className="flex-1 min-w-0">
                    <Text className="text-tremor-content">{staff.role}</Text>
                    <Metric className="text-tremor-content-strong truncate">{staff.name}</Metric>
                 </div>
                 <Badge color={getStressColor(staff.stress_level)} size="xs">
                    {staff.stress_level}
                 </Badge>
              </div>
              <div className="mt-4 flex justify-between space-x-4">
                <div className="flex items-center space-x-1">
                   <HeartIcon className="h-5 w-5 text-red-500" />
                   <Text className="text-tremor-content">{staff.current_heart_rate} bpm</Text>
                </div>
                 <div className="flex items-center space-x-1">
                   <ArrowTrendingUpIcon className="h-5 w-5 text-blue-500" />
                   <Text className="text-tremor-content">{staff.current_hrv} ms (HRV)</Text>
                 </div>
              </div>
               <Text className="text-right text-xs text-tremor-content mt-2">
                    Last Update: {staff.last_update ? new Date(staff.last_update).toLocaleTimeString() : 'N/A'}
               </Text>
            </Card>
          </Col>
        ))}
      </Grid>

       <div className="mt-6 text-center">
         <Badge color={isConnected ? 'emerald' : 'red'}>
           {isConnected ? 'Live Connection Active' : 'Disconnected - Attempting to Reconnect...'}
         </Badge>
       </div>
    </main>
  );
}

export default App; 