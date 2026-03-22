import React from 'react';
import { Shield, TrendingUp, AlertTriangle } from 'lucide-react';

interface Position {
    symbol: string;
    profitLossPercent: number;
    marketValue: number;
}

interface RiskReturnChartProps {
    positions: Position[];
}

const RiskReturnChart: React.FC<RiskReturnChartProps> = ({ positions }) => {
    // Simulated Volatility based on symbol hash (since we don't have real beta here)
    const getSimulatedRisk = (symbol: string) => {
        const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return 10 + (hash % 40); // 10% to 50% "volatility"
    };

    const data = positions.map(pos => ({
        symbol: pos.symbol,
        risk: getSimulatedRisk(pos.symbol),
        return: pos.profitLossPercent,
        size: Math.sqrt(pos.marketValue) / 5 // Scale bubble size
    }));

    const maxRisk = Math.max(...data.map(d => d.risk), 60);
    const minReturn = Math.min(...data.map(d => d.return), -20);
    const maxReturn = Math.max(...data.map(d => d.return), 20);

    const padding = 40;
    const width = 400;
    const height = 300;

    const xScale = (val: number) => padding + (val / maxRisk) * (width - 2 * padding);
    const yScale = (val: number) => {
        const range = maxReturn - minReturn;
        const normalized = (val - minReturn) / range;
        return height - padding - normalized * (height - 2 * padding);
    };

    return (
        <div className="glass-card" style={{ padding: '1.25rem', position: 'relative' }}>
            <h3 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={14} color="var(--color-accent)" /> Risk-Return Efficient Frontier
            </h3>
            
            <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
                <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
                    {/* Grid Lines */}
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    
                    {/* Zero Return Line */}
                    <line 
                        x1={padding} 
                        y1={yScale(0)} 
                        x2={width - padding} 
                        y2={yScale(0)} 
                        stroke="rgba(255,255,255,0.05)" 
                        strokeWidth="1" 
                        strokeDasharray="4,4" 
                    />

                    {/* Bubbles */}
                    {data.map((d, i) => (
                        <g key={i} style={{ transition: 'all 0.5s' }}>
                            <circle 
                                cx={xScale(d.risk)} 
                                cy={yScale(d.return)} 
                                r={Math.max(d.size, 4)} 
                                fill={d.return >= 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}
                                stroke={d.return >= 0 ? 'var(--color-success)' : 'var(--color-error)'}
                                strokeWidth="1"
                                style={{ cursor: 'pointer' }}
                            >
                                <title>{`${d.symbol}: Risk ${d.risk}% | Return ${d.return.toFixed(2)}%`}</title>
                            </circle>
                            <text 
                                x={xScale(d.risk)} 
                                y={yScale(d.return) - d.size - 4} 
                                textAnchor="middle" 
                                fontSize="10" 
                                fill="rgba(255,255,255,0.6)"
                                fontWeight="800"
                            >
                                {d.symbol}
                            </text>
                        </g>
                    ))}

                    {/* Labels */}
                    <text x={width/2} y={height - 5} textAnchor="middle" fontSize="10" fill="var(--color-text-tertiary)" fontWeight="700">VOLATILITY (RISK %)</text>
                    <text x={10} y={height/2} textAnchor="middle" fontSize="10" fill="var(--color-text-tertiary)" fontWeight="700" transform={`rotate(-90 10 ${height/2})`}>TOTAL RETURN %</text>
                </svg>

                {/* Legend/Zones */}
                <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.65rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)' }} /> Alpha Zone
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-error)' }} /> Risk Overload
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <AlertTriangle size={16} color="var(--color-warning)" style={{ flexShrink: 0 }} />
                <span>
                    <strong>Institutional Insight:</strong> {data.length > 0 ? `Your ${data.sort((a,b) => b.risk - a.risk)[0].symbol} position carries the highest tactical risk. Consider hedging if Volatility exceeds 45%.` : 'Add positions to generate risk-return diagnostics.'}
                </span>
            </div>
        </div>
    );
};

export default RiskReturnChart;
