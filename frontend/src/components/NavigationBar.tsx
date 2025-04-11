import { NavLink } from 'react-router-dom';
import { Flex } from "@tremor/react";

function NavigationBar() {
    const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
        `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out ${
            isActive
                ? 'bg-tremor-brand text-tremor-brand-inverted'
                : 'text-tremor-content hover:bg-tremor-background-muted hover:text-tremor-content-strong'
        }`;

    return (
        <nav className="p-2 bg-tremor-background-muted rounded-lg shadow-sm">
            <Flex justifyContent="start" className="gap-2">
                 <NavLink to="/" className={navLinkClass}>
                    Dashboard View
                 </NavLink>
                 <NavLink to="/classic" className={navLinkClass}>
                    Classic Card View
                 </NavLink>
                 {/* Add more links here if needed */}
            </Flex>
        </nav>
    );
}

export default NavigationBar; 