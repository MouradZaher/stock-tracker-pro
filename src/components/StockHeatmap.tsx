import { STOCKS_BY_SECTOR } from '../data/sectors';
import { soundService } from '../services/soundService';

interface StockHeatmapProps {
    onSelectStock?: (symbol: string) => void;
}

const StockHeatmap: React.FC<StockHeatmapProps> = ({ onSelectStock }) => {
    // Generate mock performance data for the heatmap
    const getPerformanceColor = (change: number) => {
        if (change > 2) return '#059669'; // vivid green
        if (change > 0) return '#10b981'; // emerald
        if (change > -2) return '#ef4444'; // red
        return '#dc2626'; // dark red
    };

    const heatmapData = Object.entries(STOCKS_BY_SECTOR).map(([sector, stocks]) => ({
        sector,
        stocks: stocks.slice(0, 6).map(s => ({
            ...s,
            change: (Math.random() * 8 - 4).toFixed(2), // Random change between -4% and +4%
        }))
    }));

    return (
        <div className="heatmap-container glass-card" style={{
            width: '100%',
            padding: '1.5rem',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Market Performance Treemap
                </h3>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.7rem' }}>
                    <span style={{ color: '#059669' }}>▲ Gainers</span>
                    <span style={{ color: '#dc2626' }}>▼ Losers</span>
                </div>
            </div>

            <div className="heatmap-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                flex: 1
            }}>
                {heatmapData.map((section) => (
                    <div key={section.sector} className="sector-block" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>{section.sector}</div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gridTemplateRows: 'repeat(2, 60px)',
                            gap: '4px'
                        }}>
                            {section.stocks.map((stock) => {
                                const changeVal = parseFloat(stock.change);
                                return (
                                    <div
                                        key={stock.symbol}
                                        onClick={() => {
                                            soundService.playTap();
                                            onSelectStock?.(stock.symbol);
                                        }}
                                        style={{
                                            background: getPerformanceColor(changeVal),
                                            borderRadius: '4px',
                                            padding: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            transition: 'transform 0.2s, filter 0.2s',
                                            position: 'relative'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                            e.currentTarget.style.zIndex = '10';
                                            e.currentTarget.style.filter = 'brightness(1.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.zIndex = '1';
                                            e.currentTarget.style.filter = 'brightness(1)';
                                        }}
                                    >
                                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>{stock.symbol}</div>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                                            {changeVal > 0 ? '+' : ''}{stock.change}%
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StockHeatmap;
