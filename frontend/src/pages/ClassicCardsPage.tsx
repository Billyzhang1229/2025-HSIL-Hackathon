import { Grid, Col, Text } from "@tremor/react";
import { useNavigate } from 'react-router-dom';
import StaffCard, { StaffData as FullStaffData } from '../components/StaffCard';

// --- Component Props ---
interface ClassicCardsPageProps {
    staffList: FullStaffData[];
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
                        aria-label={`View details for staff ID ${staff.id}`}
                    >
                        <StaffCard staff={staff} />
                    </button>
                </Col>
            ))}
            {staffList.length === 0 && <Col numColSpanLg={3}><Text className="text-center py-8">No staff data available.</Text></Col>}
        </Grid>
    );
}

export default ClassicCardsPage;