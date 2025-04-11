import { useEffect, useState } from 'react';
import { Card, Grid, Title, Text, Metric, Col, Badge } from "@tremor/react";
import { BeakerIcon, HeartIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';

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

// Helper function (Copied from App.tsx)
const getStressColor = (level: StaffData['stress_level']) => {
    switch (level) {
        case 'Critical': return 'red';
        case 'High': return 'orange';
        default: return 'emerald';
    }
};

// --- Component Props ---
interface ClassicCardsPageProps {
    staffList: StaffData[];
    setSelectedStaffId: (id: number | null) => void;
}

// --- ClassicCardsPage Component ---
function ClassicCardsPage({ staffList, setSelectedStaffId }: ClassicCardsPageProps) {
    const navigate = useNavigate();

    const handleCardClick = (staffId: number) => {
        console.log(`Card clicked for staff ID: ${staffId}. Setting selected ID and navigating.`);
        setSelectedStaffId(staffId);
        navigate('/');
    };

    return (
        <Grid numItemsSm={1} numItemsMd={2} numItemsLg={3} className="gap-6">
            {staffList.map((staff) => (
                <Col key={staff.id}>
                    <button
                        onClick={() => handleCardClick(staff.id)}
                        className="text-left w-full h-full focus:outline-none focus:ring-2 focus:ring-tremor-brand focus:ring-offset-2 rounded-lg"
                        aria-label={`View details for ${staff.name}`}
                    >
                        <Card decoration="top" decorationColor={getStressColor(staff.stress_level)} className="h-full hover:shadow-md transition-shadow duration-150">
                            <div className="flex items-start space-x-4">
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
                    </button>
                </Col>
            ))}
            {staffList.length === 0 && <Col numColSpanLg={3}><Text className="text-center py-8">No staff data available.</Text></Col>}
        </Grid>
    );
}

export default ClassicCardsPage; 