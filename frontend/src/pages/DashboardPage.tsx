import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Grid, Title, Text, Badge, Select, SelectItem, Button, Flex } from "@tremor/react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { HeartIcon, ArrowTrendingUpIcon, FunnelIcon, ArrowsUpDownIcon, BeakerIcon, MoonIcon, ScaleIcon } from '@heroicons/react/24/solid';
import ReusableLineChart from '../components/ReusableLineChart';

// --- Type Definitions (Copied from App.tsx) ---
interface StaffData {
    id: number;
    name: string;
    role: string;
    stress_level: 'Normal' | 'High' | 'Critical';
    current_heart_rate: number;
    current_hrv: number;
    sleep_hours_last_night?: number | null;
    current_steadiness?: number | null;
    current_sleep_index?: number | null;
    mental_wellness_index?: number | null;
    last_update: string | null;
}

interface WearablePoint {
    timestamp: string;
    heart_rate: number | null;
    hrv: number | null;
    steadiness?: number | null;
    sleep_index?: number | null;
    mwi?: number | null;
}

// Expanded SortOrder type
type SortOrder = 'status' | 'name' | 'mwi' | 'hr' | 'hrv' | 'sleep_index' | 'steadiness';

type TimeRange = '1m' | '5m' | '10m' | '30m' | '1h' | '6h' | '1d' | '2d' | 'All';

// Display names for sort options
const sortOptions: { [key in SortOrder]: string } = {
    status: "Status",
    name: "Name (A-Z)",
    mwi: "MW Index (High-Low)",
    hr: "Heart Rate (Low-High)",
    hrv: "HRV (High-Low)",
    sleep_index: "Sleep Index (High-Low)",
    steadiness: "Steadiness (High-Low)"
};

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

// Define the keys for sorting
type SortKey = 'status' | 'name' | 'mwi' | 'hr' | 'hrv' | 'sleep_index' | 'steadiness';
type SortDirection = 'asc' | 'desc';

// Define base labels and default directions
const SORT_BASE_LABELS: { [key in SortKey]: string } = {
    status: "Status",
    name: "Name",
    mwi: "MW Index",
    hr: "Heart Rate",
    hrv: "HRV",
    sleep_index: "Sleep Index",
    steadiness: "Steadiness"
};

const DEFAULT_SORT_DIRECTIONS: { [key in SortKey]: SortDirection } = {
    status: 'asc', // Critical first
    name: 'asc',   // A-Z
    mwi: 'desc',  // High first
    hr: 'asc',    // Low first (more concerning?)
    hrv: 'desc',  // High first
    sleep_index: 'desc', // High first
    steadiness: 'desc' // High first
};

// Helper to generate the full label with direction
const getSortLabel = (key: SortKey, direction: SortDirection): string => {
    const baseLabel = SORT_BASE_LABELS[key];
    if (key === 'status') return `${baseLabel}`;
    if (key === 'name') return `${baseLabel} (${direction === 'asc' ? 'A-Z' : 'Z-A'})`;
    // For numerical fields
    const suffix = direction === 'desc' ? '(High-Low)' : '(Low-High)';
    return `${baseLabel} ${suffix}`;
};

// --- DashboardPage Component ---
function DashboardPage({ staffList, selectedStaffId, setSelectedStaffId }: DashboardPageProps) {
    // State specific to this page
    const [filterRole, setFilterRole] = useState<string>('All');
    const [sortKey, setSortKey] = useState<SortKey>('status');
    const [sortDirection, setSortDirection] = useState<SortDirection>(DEFAULT_SORT_DIRECTIONS['status']);
    const [timeRange, setTimeRange] = useState<TimeRange>('5m');
    const [historicalData, setHistoricalData] = useState<WearablePoint[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

    // useEffect for fetching historical data
    useEffect(() => {
        setHistoricalData([]);
        if (selectedStaffId === null) return;

        const fetchHistoricalData = async () => {
            setIsLoadingHistory(true);
            let apiUrl = `${BACKEND_URL}/api/staff/${selectedStaffId}/data`;
            const params = new URLSearchParams();
            let logRange = timeRange;
            let needsSampling = false;

            switch (timeRange) {
                case '1m': params.set('minutes', '1'); break;
                case '5m': params.set('minutes', '5'); break;
                case '10m': params.set('minutes', '10'); break;
                case '30m': params.set('minutes', '30'); break;
                case '1h': params.set('minutes', '60'); break;
                case '6h': 
                    params.set('minutes', '360'); 
                    needsSampling = true;
                    break;
                case '1d':
                    params.set('minutes', '1440');
                    needsSampling = true;
                    break;
                case '2d':
                    params.set('minutes', '2880');
                    needsSampling = true;
                    break;
                case 'All':
                    // No minutes param for all data
                    needsSampling = true; // Sample if fetching all data
                    break;
                default:
                    params.set('minutes', '60'); // Default to 1h if invalid
                    logRange = '1h';
            }

            if (needsSampling) {
                params.set('sample', 'true');
            }

            const queryString = params.toString();
            if (queryString) {
                apiUrl += `?${queryString}`;
            }

            console.log(`Fetching historical data for Staff ID ${selectedStaffId}, range ${logRange}, sampling: ${needsSampling}... URL: ${apiUrl}`);
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: WearablePoint[] = await response.json();
                console.log(`Historical data received for Staff ID ${selectedStaffId}:`, data);
                setHistoricalData(data);
            } catch (error) {
                console.error(`Failed to fetch historical data for Staff ID ${selectedStaffId}:`, error);
                setHistoricalData([]); // Ensure data is clear on error
            } finally {
                setIsLoadingHistory(false);
            }
        };

        fetchHistoricalData();
    }, [selectedStaffId, timeRange]);

    // --- NEW useEffect to append live data ---
    useEffect(() => {
        if (selectedStaffId === null || historicalData.length === 0) {
            return;
        }
        const latestStaffData = staffList.find(staff => staff.id === selectedStaffId);
        if (latestStaffData && latestStaffData.last_update) {
            const latestStaffTimestamp = new Date(latestStaffData.last_update).getTime();
            const latestHistoryTimestamp = new Date(historicalData[historicalData.length - 1].timestamp).getTime();

            if (latestStaffTimestamp > latestHistoryTimestamp) {
                const newDataPoint: WearablePoint = {
                    timestamp: latestStaffData.last_update,
                    heart_rate: latestStaffData.current_heart_rate,
                    hrv: latestStaffData.current_hrv,
                    steadiness: latestStaffData.current_steadiness,
                    sleep_index: latestStaffData.current_sleep_index,
                    mwi: latestStaffData.mental_wellness_index
                };
                console.log("[DashboardPage] Appending new data point:", newDataPoint);
                setHistoricalData(prevData => [...prevData, newDataPoint]);
            }
        }
    }, [staffList, selectedStaffId, historicalData]);
    // --- End NEW useEffect ---

    // Compute Display List using useMemo
    const displayList = useMemo(() => {
        console.log(`[DashboardPage] Recalculating displayList via useMemo (Sort: ${sortKey} ${sortDirection})...`);
        const sorted = [...staffList]
            .filter(staff => filterRole === 'All' || staff.role === filterRole)
            .sort((a, b) => {
                // Handle null/undefined gracefully
                const safeA = {
                    mwi: a.mental_wellness_index ?? -Infinity,
                    hr: a.current_heart_rate ?? Infinity,
                    hrv: a.current_hrv ?? -Infinity,
                    sleep_index: a.current_sleep_index ?? -Infinity,
                    steadiness: a.current_steadiness ?? -Infinity
                };
                const safeB = {
                    mwi: b.mental_wellness_index ?? -Infinity,
                    hr: b.current_heart_rate ?? Infinity,
                    hrv: b.current_hrv ?? -Infinity,
                    sleep_index: b.current_sleep_index ?? -Infinity,
                    steadiness: b.current_steadiness ?? -Infinity
                };

                let comparison = 0;
                switch (sortKey) {
                    case 'status':
                        comparison = stressLevelOrder[a.stress_level] - stressLevelOrder[b.stress_level];
                        break;
                    case 'name':
                        comparison = a.name.localeCompare(b.name);
                        break;
                    case 'mwi':
                        comparison = safeA.mwi - safeB.mwi;
                        break;
                    case 'hr':
                        comparison = safeA.hr - safeB.hr;
                        break;
                    case 'hrv':
                        comparison = safeA.hrv - safeB.hrv;
                        break;
                    case 'sleep_index':
                        comparison = safeA.sleep_index - safeB.sleep_index;
                        break;
                    case 'steadiness':
                        comparison = safeA.steadiness - safeB.steadiness;
                        break;
                }

                // Apply direction (and secondary sort by name)
                const directionMultiplier = sortDirection === 'asc' ? 1 : -1;
                return comparison * directionMultiplier || a.name.localeCompare(b.name);
            });
        console.log("[DashboardPage] Memoized displayList:", sorted);
        return sorted;
    }, [staffList, filterRole, sortKey, sortDirection]); // Added sortDirection dependency

    // This log now shows the memoized value
    // console.log("[DashboardPage] Calculated displayList:", displayList);

    const selectedStaff = staffList.find(staff => staff.id === selectedStaffId);

    // Chart Data Formatting - Adapted for Recharts
    const chartData = useMemo(() => historicalData.map(d => ({
        time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second: '2-digit' }),
        hr: d.heart_rate,
        hrv: d.hrv,
        steadiness: d.steadiness,
        sleep_index: d.sleep_index,
        mwi: d.mwi
    })), [historicalData]);

    // Updated Tooltip Formatter
    const tooltipFormatter = (value: number | string | Array<number | string>, name: string) => {
        let unit = '';
        let displayName = name;
        if (name === 'hr') { unit = ' bpm'; displayName = 'Heart Rate'; }
        else if (name === 'hrv') { unit = ' ms'; displayName = 'HRV'; }
        else if (name === 'steadiness') { unit = ''; displayName = 'Steadiness'; value = (Number(value)*100).toFixed(0) + '%';}
        else if (name === 'sleep_index') { unit = '/10'; displayName = 'Sleep Index'; }
        else if (name === 'mwi') { unit = '/100'; displayName = 'MW Index'; value = Number(value).toFixed(1);}
        return [`${value}${unit}`, displayName];
    };

    // Handler for Sort Select change
    const handleSortChange = (newKey: SortKey) => {
        if (newKey === sortKey) {
            // Toggle direction if same key is selected
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // Change key and reset direction to default for that key
            setSortKey(newKey);
            setSortDirection(DEFAULT_SORT_DIRECTIONS[newKey]);
        }
    };

    // JSX structure
    return (
        <div className="flex flex-col md:flex-row w-full gap-6" style={{ height: 'calc(100vh - 10rem)' }}>
            {/* Left Column: Filters & Staff List */}
            <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4">
                <Card>
                    <Flex justifyContent="between" alignItems="center" className="mb-4">
                        <Text className="font-medium">Filters & Sort</Text>
                        <FunnelIcon className="h-5 w-5" />
                    </Flex>
                    <div className="flex flex-col gap-3">
                        <Select value={filterRole} onValueChange={setFilterRole} placeholder="Filter by Role...">
                            {['All', ...new Set(staffList.map(staff => staff.role))].map(role => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                        </Select>
                        <Select value={sortKey} onValueChange={(value) => handleSortChange(value as SortKey)} placeholder="Sort by...">
                            {Object.keys(SORT_BASE_LABELS).map((key) => (
                                <SelectItem key={key} value={key}>
                                    {getSortLabel(key as SortKey, key === sortKey ? sortDirection : DEFAULT_SORT_DIRECTIONS[key as SortKey])}
                                </SelectItem>
                            ))}
                        </Select>
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
                                    <span>
                                        MWI: {staff.mental_wellness_index?.toFixed(0) ?? 'N/A'}
                                    </span>
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
                <Card className="flex-grow flex flex-col">
                    <Flex justifyContent="between" alignItems="start" className="mb-4 flex-shrink-0">
                            <Title className="text-left w-full">
                            {selectedStaff && (
                                <Badge className="mr-2" color={getStressColor(selectedStaff.stress_level)} size="sm">
                                    {selectedStaff.stress_level}
                                </Badge>
                            )}
                                {selectedStaff ? <><strong>{selectedStaff.name}</strong></> : 'Select Staff to View Trends'}
                                
                            </Title>
                            
                        {selectedStaff && (
                            <Flex justifyContent="end" className="gap-2">
                                {(['1m', '5m', '10m', '30m', '1h', '6h', '1d', '2d', 'All'] as TimeRange[]).map(range => (
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

                    {/* Scrollable Chart Area */}
                    <div className="flex-grow overflow-y-auto pr-2 relative">
                        {isLoadingHistory && <Text className="text-center py-8">Loading chart data...</Text>}
                        {!isLoadingHistory && !selectedStaff && <Text className="text-center py-8">Please select a staff member from the list.</Text>}
                        {!isLoadingHistory && selectedStaff && chartData.length === 0 && <Text className="text-center py-8">No historical data available for the selected period.</Text>}

                        {/* Chart display logic - Using Reusable Component */}
                        {!isLoadingHistory && selectedStaff && chartData.length > 0 && (
                            <div className="space-y-4 absolute inset-0">
                                {/* MWI Chart */}
                                <div className="h-1/5">
                                    <ReusableLineChart
                                        chartData={chartData}
                                        dataKey="mwi"
                                        strokeColor="#10b981" // Emerald
                                        chartTitle="Mental Wellness Index"
                                        tooltipFormatter={tooltipFormatter}
                                        yAxisProps={{ domain: [0, 100], tick: { fill: '#10b981'} }}
                                    />
                                </div>

                                {/* Heart Rate Chart */}
                                <div className="h-1/5 pt-4">
                                    <ReusableLineChart
                                        chartData={chartData}
                                        dataKey="hr"
                                        strokeColor="#ef4444" // Red
                                        chartTitle="Heart Rate (bpm)"
                                        tooltipFormatter={tooltipFormatter}
                                        yAxisProps={{ domain: ['dataMin - 5', 'dataMax + 5'] }}
                                    />
                                </div>

                                {/* HRV Chart */}
                                <div className="h-1/5 pt-4">
                                    <ReusableLineChart
                                        chartData={chartData}
                                        dataKey="hrv"
                                        strokeColor="#3b82f6" // Blue
                                        chartTitle="Heart Rate Variability (ms)"
                                        tooltipFormatter={tooltipFormatter}
                                        yAxisProps={{ domain: ['dataMin - 5', 'dataMax + 5'] }}
                                    />
                                </div>

                                {/* Steadiness Chart */}
                                <div className="h-1/5 pt-4">
                                    <ReusableLineChart
                                        chartData={chartData}
                                        dataKey="steadiness"
                                        strokeColor="#a1a1aa" // Gray
                                        chartTitle="Steadiness"
                                        tooltipFormatter={tooltipFormatter}
                                        yAxisProps={{ domain: [0, 1], tickFormatter: (v)=>`${(v*100).toFixed(0)}%`, tick: { fill: '#a1a1aa'} }}
                                    />
                                </div>

                                {/* Sleep Index Chart */}
                                <div className="h-1/5 pt-4">
                                    <ReusableLineChart
                                        chartData={chartData}
                                        dataKey="sleep_index"
                                        strokeColor="#8b5cf6" // Purple
                                        chartTitle="Sleep Index"
                                        tooltipFormatter={tooltipFormatter}
                                        yAxisProps={{ domain: [0, 10], tick: { fill: '#8b5cf6'} }}
                                        showXAxis={true} // Show X-axis on the last chart
                                        lineType="stepAfter"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default DashboardPage; 