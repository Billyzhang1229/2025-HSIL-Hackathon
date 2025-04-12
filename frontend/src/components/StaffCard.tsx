import { Card, Text, Metric, Badge } from "@tremor/react";
import { BeakerIcon, HeartIcon, ArrowTrendingUpIcon, MoonIcon } from '@heroicons/react/24/solid';
import Tilt from 'react-parallax-tilt';

// Type Definition (Export this)
export interface StaffData {
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

// Helper function
const getStressColor = (level: StaffData['stress_level']) => {
    switch (level) {
        case 'Critical': return 'red';
        case 'High': return 'orange';
        default: return 'emerald';
    }
};

// Component props interface (doesn't need export)
interface StaffCardProps {
    staff: StaffData;
}

function StaffCard({ staff }: StaffCardProps) {
    return (
        <Tilt
            className="parallax-effect-glare-scale"
            perspective={500}
            glareEnable={true}
            glareMaxOpacity={0.25}
            glarePosition="all"
            scale={1.01}
            tiltMaxAngleX={2}
            tiltMaxAngleY={2}
            transitionSpeed={1000}
        >
            <Card 
                decoration="top" 
                decorationColor={getStressColor(staff.stress_level)} 
                className="h-full shadow-sm hover:shadow-lg transition-shadow duration-150 ease-in-out hover:ring-1 hover:ring-tremor-brand-faint cursor-pointer inner-tilt-element"
            >
                <div className="flex items-start space-x-4">
                    <div className="flex-1 min-w-0">
                        <Text className="text-tremor-content">{staff.role}</Text>
                        <Metric className="text-tremor-content-strong truncate">{staff.name}</Metric>
                    </div>
                    <Badge color={getStressColor(staff.stress_level)} size="xs">
                        {staff.stress_level}
                    </Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
                    {/* HR */}
                    <div className="flex items-center space-x-1">
                        <HeartIcon className="h-4 w-4 text-red-500" />
                        <Text>{staff.current_heart_rate} bpm</Text>
                    </div>
                    {/* HRV */}
                    <div className="flex items-center space-x-1">
                        <ArrowTrendingUpIcon className="h-4 w-4 text-blue-500" />
                        <Text>{staff.current_hrv} ms</Text>
                    </div>
                    {/* MWI */}
                    <div className="flex items-center space-x-1">
                        <BeakerIcon className="h-4 w-4 text-purple-500" />
                        <Text>{staff.mental_wellness_index?.toFixed(0) ?? 'N/A'} MWI</Text>
                    </div>
                    {/* Sleep Index */}
                    <div className="flex items-center space-x-1">
                        <MoonIcon className="h-4 w-4 text-indigo-500" />
                        <Text>{staff.current_sleep_index?.toFixed(1) ?? 'N/A'} / 10</Text>
                    </div>
                    {/* Steadiness */}
                    <div className="flex items-center space-x-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 text-gray-500">
                          <path fillRule="evenodd" d="M4.5 2A2.5 2.5 0 0 0 2 4.5v2.75a.75.75 0 0 0 1.5 0V4.5a1 1 0 0 1 1-1h2.75a.75.75 0 0 0 0-1.5H4.5Zm7.25 0a.75.75 0 0 0 0 1.5H14.5a1 1 0 0 1 1 1v2.75a.75.75 0 0 0 1.5 0V4.5A2.5 2.5 0 0 0 14.5 2h-2.75ZM2 11.75A2.5 2.5 0 0 0 4.5 14h2.75a.75.75 0 0 0 0-1.5H4.5a1 1 0 0 1-1-1v-2.75a.75.75 0 0 0-1.5 0v2.75Zm13.5 0V14.5a1 1 0 0 1-1 1h-2.75a.75.75 0 0 0 0 1.5h2.75A2.5 2.5 0 0 0 17 14.5v-2.75a.75.75 0 0 0-1.5 0Z" clipRule="evenodd" />
                        </svg>
                        <Text>{staff.current_steadiness ? (staff.current_steadiness * 100).toFixed(0) + '%' : 'N/A'}</Text>
                    </div>
                </div>
                <Text className="text-right text-xs text-tremor-content mt-2">
                    Last Update: {staff.last_update ? new Date(staff.last_update).toLocaleTimeString() : 'N/A'}
                </Text>
            </Card>
        </Tilt>
    );
}

export default StaffCard; 