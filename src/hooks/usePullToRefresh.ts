import { useEffect, useCallback, useRef, useState } from 'react';

interface PullToRefreshOptions {
    onRefresh: () => Promise<void>;
    threshold?: number;
    resistance?: number;
    enabled?: boolean;
}

/**
 * Pull-to-refresh hook for mobile devices
 * Provides iOS-style pull-to-refresh functionality
 */
export const usePullToRefresh = ({
    onRefresh,
    threshold = 80,
    resistance = 2.5,
    enabled = true,
}: PullToRefreshOptions) => {
    const [isPulling, setIsPulling] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);

    const startY = useRef(0);
    const currentY = useRef(0);
    const containerRef = useRef<HTMLElement | null>(null);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (!enabled || isRefreshing) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Only enable pull-to-refresh when at the top of the page
        if (scrollTop === 0) {
            startY.current = e.touches[0].clientY;
            setIsPulling(true);
        }
    }, [enabled, isRefreshing]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isPulling || !enabled || isRefreshing) return;

        currentY.current = e.touches[0].clientY;
        const distance = currentY.current - startY.current;

        if (distance > 0) {
            // Apply resistance to make it feel more natural
            const resistedDistance = distance / resistance;
            setPullDistance(Math.min(resistedDistance, threshold * 1.5));

            // Prevent default scroll behavior when pulling down
            if (distance > 10) {
                e.preventDefault();
            }
        }
    }, [isPulling, enabled, isRefreshing, resistance, threshold]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling || !enabled) return;

        setIsPulling(false);

        if (pullDistance >= threshold && !isRefreshing) {
            setIsRefreshing(true);

            try {
                await onRefresh();
            } catch (error) {
                console.error('Refresh failed:', error);
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
    }, [isPulling, enabled, pullDistance, threshold, isRefreshing, onRefresh]);

    useEffect(() => {
        if (!enabled) return;

        const element = containerRef.current || document.body;

        element.addEventListener('touchstart', handleTouchStart, { passive: false });
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd);

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

    const progress = Math.min(pullDistance / threshold, 1);

    return {
        containerRef,
        isPulling,
        isRefreshing,
        pullDistance,
        progress,
    };
};
