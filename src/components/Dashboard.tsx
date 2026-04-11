import React from 'react';
import ModularWorkspace from './ModularWorkspace';

interface DashboardProps {
    onSelectSymbol: (symbol: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectSymbol }) => {
    return (
        <div style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
            <ModularWorkspace onSelectSymbol={onSelectSymbol} />
        </div>
    );
};

export default Dashboard;
