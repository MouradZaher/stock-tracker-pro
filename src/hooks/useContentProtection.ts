import { useEffect } from 'react';

export const useContentProtection = () => {
    useEffect(() => {
        const handleContext = (e: MouseEvent) => {
            e.preventDefault();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent Ctrl+C, Ctrl+U, Ctrl+Shift+I (DevTools), F12
            if (
                (e.ctrlKey && (e.key === 'c' || e.key === 'C')) ||
                (e.ctrlKey && (e.key === 'u' || e.key === 'U')) ||
                (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I')) ||
                (e.key === 'F12')
            ) {
                e.preventDefault();
                return false;
            }
        };

        const handleSelectStart = (e: Event) => {
            e.preventDefault();
        };

        document.addEventListener('contextmenu', handleContext);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('selectstart', handleSelectStart);
        document.addEventListener('copy', (e) => e.preventDefault());
        document.addEventListener('cut', (e) => e.preventDefault());
        document.addEventListener('paste', (e) => e.preventDefault());

        return () => {
            document.removeEventListener('contextmenu', handleContext);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('selectstart', handleSelectStart);
            document.removeEventListener('copy', (e) => e.preventDefault());
            document.removeEventListener('cut', (e) => e.preventDefault());
            document.removeEventListener('paste', (e) => e.preventDefault());
        };
    }, []);
};
