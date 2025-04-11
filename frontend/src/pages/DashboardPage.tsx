import { useState, useEffect } from 'react';
import { Card, Grid, Title, Text, Badge, Select, SelectItem, Button, Flex, LineChart } from "@tremor/react";
import { HeartIcon, ArrowTrendingUpIcon, FunnelIcon, ArrowsUpDownIcon } from '@heroicons/react/24/solid';

// --- Type Definitions (Copied from App.tsx) ---
interface StaffData {
    id: number;
    name: string;
    role: string;
    stress_level: 'Normal' | 'High' | 'Critical';
    current_heart_rate: number;
    current_hrv: number;
    last_update: string | null;
}

interface WearablePoint {
    timestamp: string;
    heart_rate: number | null;
    hrv: number | null;
}

type SortOrder = 'status' | 'name';
type TimeRange = '1m' | '5m' | '10m' | '30m' | '1h';

// Helper functions (Copied from App.tsx)
const getStressColor = (level: StaffData['stress_level']) => {
    switch (level) {
        case 'Critical': return 'red';
        case 'High': return 'orange';
        default: return 'emerald';
    }
};

const stressLevelOrder: { [key in StaffData['stress_level']]: number } = {
    'Critical': 1,
    'High': 2,
    'Normal': 3
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

// --- Component Props ---
interface DashboardPageProps {
    staffList: StaffData[];
    selectedStaffId: number | null;
    setSelectedStaffId: (id: number | null) => void;
}

// --- DashboardPage Component ---
function DashboardPage({ staffList, selectedStaffId, setSelectedStaffId }: DashboardPageProps) {
    // State specific to this page
    const [filterRole, setFilterRole] = useState<string>('All');
    const [sortOrder, setSortOrder] = useState<SortOrder>('status');
    const [timeRange, setTimeRange] = useState<TimeRange>('5m');
    const [historicalData, setHistoricalData] = useState<WearablePoint[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

    // useEffect for fetching historical data (when selectedId or timeRange changes)
    useEffect(() => {
        if (selectedStaffId === null) {
            setHistoricalData([]);
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
                default: minutes = 5;
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
                setHistoricalData([]);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        fetchHistoricalData();
    }, [selectedStaffId, timeRange]);

    // --- NEW useEffect to append live data ---
    useEffect(() => {
        if (selectedStaffId === null || historicalData.length === 0) {
            return; // Only append if we have a selection and existing history
        }

        const latestStaffData = staffList.find(staff => staff.id === selectedStaffId);
        const latestHistoryTimestamp = new Date(historicalData[historicalData.length - 1].timestamp).getTime();

        if (latestStaffData && latestStaffData.last_update) {
            const latestStaffTimestamp = new Date(latestStaffData.last_update).getTime();

            // Check if the staff list update is newer than the last point in history
            if (latestStaffTimestamp > latestHistoryTimestamp) {
                const newDataPoint: WearablePoint = {
                    timestamp: latestStaffData.last_update,
                    heart_rate: latestStaffData.current_heart_rate,
                    hrv: latestStaffData.current_hrv
                };
                console.log("[DashboardPage] Appending new data point:", newDataPoint);
                setHistoricalData(prevData => [...prevData, newDataPoint]);
                // Optional: Trim old data points if list gets too long
                // setHistoricalData(prevData => [...prevData, newDataPoint].slice(-MAX_POINTS));
            }
        }
    }, [staffList, selectedStaffId, historicalData]); // Re-run when staffList changes
    // --- End NEW useEffect ---

    // Compute Display List (Copied from App.tsx)
    const uniqueRoles = ['All', ...new Set(staffList.map(staff => staff.role))];
    const displayList = staffList
        .filter(staff => filterRole === 'All' || staff.role === filterRole)
        .sort((a, b) => {
            if (sortOrder === 'status') {
                return stressLevelOrder[a.stress_level] - stressLevelOrder[b.stress_level] || a.name.localeCompare(b.name);
            } else {
                return a.name.localeCompare(b.name);
            }
        });

    const selectedStaff = staffList.find(staff => staff.id === selectedStaffId);

    // Chart Data Formatting (Copied from App.tsx)
    const chartFormatter = (value: number | null) => (value !== null ? `${value}` : 'N/A');
    const heartRateData = historicalData.map(d => ({
        time: new Date(d.timestamp).toLocaleTimeString(),
        'Heart Rate (bpm)': d.heart_rate,
    }));
    const hrvData = historicalData.map(d => ({
        time: new Date(d.timestamp).toLocaleTimeString(),
        'HRV (ms)': d.hrv,
    }));

    // JSX structure (Copied and adapted from App.tsx)
    return (
        <div className="flex flex-col md:flex-row w-full gap-6">
            {/* Left Column: Filters & Staff List */}
            <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4">
                <Card>
                    <Flex justifyContent="between" alignItems="center" className="mb-4">
                        <Text className="font-medium">Filters</Text>
                        <FunnelIcon className="h-5 w-5" />
                    </Flex>
                    <div className="flex flex-col gap-3">
                        <Select value={filterRole} onValueChange={setFilterRole} placeholder="Filter by Role...">
                            {uniqueRoles.map(role => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                        </Select>
                        <Flex justifyContent="start" className="gap-2">
                             <Text>Sort by:</Text>
                             <Button
                                  size="xs"
                                  variant={sortOrder === 'status' ? 'primary' : 'secondary'}
                                  onClick={() => setSortOrder('status')}
                                  icon={ArrowsUpDownIcon}
                             >
                                Status
                             </Button>
                             <Button
                                 size="xs"
                                 variant={sortOrder === 'name' ? 'primary' : 'secondary'}
                                 onClick={() => setSortOrder('name')}
                             >
                                 Name
                             </Button>
                        </Flex>
                     </div>
                </Card>

                <Card className="flex-grow overflow-y-auto max-h-[70vh]">
                   <Title className="mb-4">Staff ({displayList.length})</Title>
                    <div className="flex flex-col gap-3">
                        {displayList.map((staff) => (
                            <button
                                key={staff.id}
                                onClick={() => setSelectedStaffId(staff.id)}
                                className={`p-3 rounded-md text-left w-full transition-colors duration-150 ease-in-out ${selectedStaffId === staff.id ? 'bg-tremor-background-muted ring-2 ring-tremor-brand' : 'hover:bg-tremor-background-subtle'}`}
                            >
                               <Flex justifyContent='between' alignItems='start'>
                                    <div>
                                        <Text className="font-medium truncate">{staff.name}</Text>
                                        <Text className="text-sm text-tremor-content">{staff.role}</Text>
                                    </div>
                                    <Badge color={getStressColor(staff.stress_level)} size="xs">
                                        {staff.stress_level}
                                    </Badge>
                                </Flex>
                                <Flex justifyContent='between' className="mt-2 text-xs">
                                    <span className="flex items-center gap-1"><HeartIcon className="h-3 w-3 text-red-500"/> {staff.current_heart_rate} bpm</span>
                                    <span className="flex items-center gap-1"><ArrowTrendingUpIcon className="h-3 w-3 text-blue-500"/> {staff.current_hrv} ms</span>
                                </Flex>
                                <Text className="text-right text-xs text-tremor-content-subtle mt-1">
                                    {staff.last_update ? new Date(staff.last_update).toLocaleTimeString() : 'N/A'}
                                </Text>
                            </button>
                        ))}
                         {displayList.length === 0 && <Text className="text-center py-4">No staff matching filters.</Text>}
                    </div>
                </Card>
            </div>

            {/* Right Column: Graphs */}
            <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col gap-4">
                <Card>
                    <Flex justifyContent="between" alignItems="start" className="mb-4">
                       <Title className="text-left w-full">
                          {selectedStaff ? `Wellness Trends: ${selectedStaff.name}` : 'Select Staff to View Trends'}
                       </Title>
                        {selectedStaff && (
                            <Flex justifyContent="end" className="gap-2">
                                {(['1m', '5m', '10m', '30m', '1h'] as TimeRange[]).map(range => (
                                    <Button
                                        key={range}
                                        size="xs"
                                        variant={timeRange === range ? 'primary' : 'secondary'}
                                        onClick={() => setTimeRange(range)}
                                    >
                                        {range}
                                    </Button>
                                ))}
                            </Flex>
                        )}
                    </Flex>

                    {isLoadingHistory && <Text className="text-center py-8">Loading chart data...</Text>}
                    {!isLoadingHistory && !selectedStaff && <Text className="text-center py-8">Please select a staff member from the list.</Text>}
                    {!isLoadingHistory && selectedStaff && historicalData.length === 0 && <Text className="text-center py-8">No historical data available for the selected period.</Text>}

                    {!isLoadingHistory && selectedStaff && historicalData.length > 0 && (
                        <Grid numItemsSm={1} numItemsLg={1} className="gap-4 mt-4">
                            <LineChart
                                data={heartRateData}
                                index="time"
                                categories={['Heart Rate (bpm)']}
                                colors={['red']}
                                valueFormatter={chartFormatter}
                                yAxisWidth={40}
                                showLegend={false}
                                autoMinValue={true}
                                allowDecimals={false}
                            />
                            <LineChart
                                data={hrvData}
                                index="time"
                                categories={['HRV (ms)']}
                                colors={['blue']}
                                valueFormatter={chartFormatter}
                                yAxisWidth={40}
                                showLegend={false}
                                autoMinValue={true}
                                allowDecimals={false}
                            />
                        </Grid>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default DashboardPage; 