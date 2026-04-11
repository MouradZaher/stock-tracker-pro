import React, { useEffect, useState } from 'react';
import { useWindowStore, type WindowId } from '../hooks/useWindowStore';
import TerminalWindow from './TerminalWindow';
import StockHeatmap from './StockHeatmap';
import InstitutionalScreener from './InstitutionalScreener';
import Portfolio from './Portfolio';
import WatchlistPage from './WatchlistPage';
import LiveIntelligenceStreams from './LiveIntelligenceStreams';
import CorporateActionsCalendar from './CorporateActionsCalendar';
import MarketPulsePage from './MarketPulsePage';
import { LayoutGrid, Activity, PieChart, Eye, Tv, Calendar, Search } from 'lucide-react';

const ModularWorkspace: React.FC = () => {
    const { windows, openWindow, bringToFront, toggleMinimize } = useWindowStore();
    const [isInitialized, setIsInitialized] = useState(false);

    // Initial tool spawn
    useEffect(() => {
        if (!isInitialized) {
            // Check if heatmap is already open
            if (!windows['heatmap']?.isOpen) {
                openWindow('heatmap', 'Institutional Heatmap', 40, 40, 960, 680);
            }
            if (!windows['screener']?.isOpen) {
                openWindow('screener', 'Data Matrix Screener', 320, 120, 1024, 600);
            }
            setIsInitialized(true);
        }
    }, [isInitialized, openWindow, windows]);

    const minimizedWindows = Object.values(windows).filter(w => w.isOpen && w.isMinimized);

    return (
        <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '100%', 
            overflow: 'hidden', 
            background: '#000',
            backgroundImage: 'radial-gradient(circle at 2px 2px, #080808 1px, transparent 0)',
            backgroundSize: '40px 40px'
        }}>
            
            {/* THE WORKSPACE (DESKTOP) */}
            <div style={{ position: 'absolute', inset: 0, padding: '20px' }}>
                
                {/* 1. Heatmap Window */}
                <TerminalWindow id="heatmap" title="Institutional Heatmap" minW={600} minH={500}>
                    <StockHeatmap />
                </TerminalWindow>

                {/* 2. Screener Window */}
                <TerminalWindow id="screener" title="Data Matrix Screener" minW={800} minH={400}>
                    <InstitutionalScreener />
                </TerminalWindow>

                {/* 3. Portfolio Window */}
                <TerminalWindow id="portfolio" title="Active Portfolio" minW={800} minH={500}>
                    <Portfolio />
                </TerminalWindow>

                {/* 4. Watchlist Window */}
                <TerminalWindow id="watchlist" title="Global Watchlist" minW={600} minH={400}>
                    <WatchlistPage />
                </TerminalWindow>

                {/* 5. TV / Streams Window */}
                <TerminalWindow id="tv" title="Intelligence Streams" minW={400} minH={300}>
                    <LiveIntelligenceStreams />
                </TerminalWindow>

                {/* 6. Calendar Window */}
                <TerminalWindow id="calendar" title="Corporate Actions" minW={400} minH={300}>
                    <CorporateActionsCalendar />
                </TerminalWindow>

                {/* 7. Search Window */}
                <TerminalWindow id="pulse" title="Global Asset Identification" minW={600} minH={400}>
                    <MarketPulsePage />
                </TerminalWindow>

            </div>

            {/* THE TASKBAR (BOTTOM) */}
            <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '8px',
                padding: '4px',
                background: 'rgba(5, 5, 5, 0.8)',
                border: '1px solid #111',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
                zIndex: 20000,
                opacity: minimizedWindows.length > 0 ? 1 : 0,
                pointerEvents: minimizedWindows.length > 0 ? 'auto' : 'none',
                transition: 'opacity 0.3s ease'
            }}>
                {minimizedWindows.map(w => (
                    <button
                        key={w.id}
                        onClick={() => toggleMinimize(w.id)}
                        style={{
                            padding: '6px 12px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid #222',
                            borderRadius: '4px',
                            color: 'white',
                            fontSize: '0.5rem',
                            fontWeight: 900,
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-accent)', boxShadow: '0 0 4px var(--color-accent)' }} />
                        {w.title.toUpperCase()}
                    </button>
                ))}
            </div>

        </div>
    );
};

export default ModularWorkspace;
