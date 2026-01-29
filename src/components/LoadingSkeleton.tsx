import React from 'react';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Base Skeleton component for loading states
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = '1rem',
    borderRadius = 'var(--radius-md)',
    className = '',
    style = {},
}) => {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width,
                height,
                borderRadius,
                background: 'linear-gradient(90deg, var(--color-bg-secondary) 25%, var(--color-bg-tertiary) 50%, var(--color-bg-secondary) 75%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-loading 1.5s ease-in-out infinite',
                ...style,
            }}
            aria-label="Loading..."
            role="status"
        />
    );
};

/**
 * Stock Card Skeleton
 */
export const StockCardSkeleton: React.FC = () => {
    return (
        <div
            className="glass-card"
            style={{
                padding: 'var(--spacing-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-md)',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                    <Skeleton width="120px" height="1.5rem" />
                    <Skeleton width="180px" height="0.875rem" style={{ marginTop: '0.5rem' }} />
                </div>
                <Skeleton width="80px" height="2rem" borderRadius="var(--radius-full)" />
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <Skeleton width="60px" height="1rem" />
                <Skeleton width="80px" height="1rem" />
            </div>
        </div>
    );
};

/**
 * Portfolio Table Skeleton
 */
export const PortfolioTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {/* Header */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 80px',
                    gap: 'var(--spacing-md)',
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                }}
            >
                {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} height="0.75rem" />
                ))}
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                    key={rowIndex}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 80px',
                        gap: 'var(--spacing-md)',
                        padding: 'var(--spacing-md)',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                    }}
                >
                    {Array.from({ length: 7 }).map((_, colIndex) => (
                        <Skeleton key={colIndex} height="1rem" />
                    ))}
                </div>
            ))}
        </div>
    );
};

/**
 * Recommendation Card Skeleton
 */
export const RecommendationCardSkeleton: React.FC = () => {
    return (
        <div
            className="glass-card"
            style={{
                padding: 'var(--spacing-xl)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-md)',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                    <Skeleton width="150px" height="1.5rem" />
                    <Skeleton width="100px" height="0.875rem" style={{ marginTop: '0.5rem' }} />
                </div>
                <Skeleton width="100px" height="2.5rem" borderRadius="var(--radius-full)" />
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
                <div style={{ flex: 1 }}>
                    <Skeleton width="60px" height="0.75rem" />
                    <Skeleton width="80px" height="1.25rem" style={{ marginTop: '0.5rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <Skeleton width="80px" height="0.75rem" />
                    <Skeleton width="100px" height="1.25rem" style={{ marginTop: '0.5rem' }} />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                <Skeleton width="100%" height="0.875rem" />
                <Skeleton width="90%" height="0.875rem" />
                <Skeleton width="95%" height="0.875rem" />
            </div>
        </div>
    );
};

/**
 * Chart Skeleton
 */
export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = '400px' }) => {
    return (
        <div
            className="glass-card"
            style={{
                padding: 'var(--spacing-lg)',
                height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <Skeleton width="100%" height="100%" />
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                    }}
                >
                    <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto' }} />
                    <p style={{ marginTop: '1rem', color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>
                        Loading chart...
                    </p>
                </div>
            </div>
        </div>
    );
};

/**
 * Page Skeleton (Full page loading state)
 */
export const PageSkeleton: React.FC = () => {
    return (
        <div style={{ padding: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div>
                <Skeleton width="300px" height="2rem" />
                <Skeleton width="500px" height="1rem" style={{ marginTop: '0.5rem' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
                <StockCardSkeleton />
                <StockCardSkeleton />
                <StockCardSkeleton />
            </div>
        </div>
    );
};

export default Skeleton;
