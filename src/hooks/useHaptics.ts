import { useCallback } from 'react';

/**
 * Haptic Feedback Patterns
 */
export type HapticPattern =
    | 'light'
    | 'medium'
    | 'heavy'
    | 'success'
    | 'warning'
    | 'error'
    | 'selection';

export const HapticPattern = {
    LIGHT: 'light' as const,
    MEDIUM: 'medium' as const,
    HEAVY: 'heavy' as const,
    SUCCESS: 'success' as const,
    WARNING: 'warning' as const,
    ERROR: 'error' as const,
    SELECTION: 'selection' as const,
};

/**
 * Check if device supports haptic feedback
 */
const supportsHaptics = (): boolean => {
    return 'vibrate' in navigator;
};

/**
 * Vibration patterns for different haptic types
 */
const getVibrationPattern = (pattern: HapticPattern): number | number[] => {
    switch (pattern) {
        case HapticPattern.LIGHT:
            return 10;
        case HapticPattern.MEDIUM:
            return 20;
        case HapticPattern.HEAVY:
            return 40;
        case HapticPattern.SUCCESS:
            return [10, 50, 10];
        case HapticPattern.WARNING:
            return [20, 100, 20];
        case HapticPattern.ERROR:
            return [30, 100, 30, 100, 30];
        case HapticPattern.SELECTION:
            return 5;
        default:
            return 10;
    }
};

/**
 * Custom hook for haptic feedback
 * Provides cross-platform haptic feedback with fallback
 */
export const useHaptics = () => {
    const trigger = useCallback((pattern: HapticPattern = HapticPattern.LIGHT) => {
        if (!supportsHaptics()) {
            return;
        }

        try {
            const vibrationPattern = getVibrationPattern(pattern);
            navigator.vibrate(vibrationPattern);
        } catch (error) {
            console.warn('Haptic feedback failed:', error);
        }
    }, []);

    const triggerLight = useCallback(() => trigger(HapticPattern.LIGHT), [trigger]);
    const triggerMedium = useCallback(() => trigger(HapticPattern.MEDIUM), [trigger]);
    const triggerHeavy = useCallback(() => trigger(HapticPattern.HEAVY), [trigger]);
    const triggerSuccess = useCallback(() => trigger(HapticPattern.SUCCESS), [trigger]);
    const triggerWarning = useCallback(() => trigger(HapticPattern.WARNING), [trigger]);
    const triggerError = useCallback(() => trigger(HapticPattern.ERROR), [trigger]);
    const triggerSelection = useCallback(() => trigger(HapticPattern.SELECTION), [trigger]);

    return {
        trigger,
        triggerLight,
        triggerMedium,
        triggerHeavy,
        triggerSuccess,
        triggerWarning,
        triggerError,
        triggerSelection,
        isSupported: supportsHaptics(),
    };
};
