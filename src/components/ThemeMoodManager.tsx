import React, { useEffect } from 'react';
import { useMarket } from '../contexts/MarketContext';

/**
 * ThemeMoodManager
 * Dynamically updates global CSS variables based on the market sentiment score.
 * This creates the "Dynamic Mood-Based Themeing" approved in the Mega Deep Dive.
 */
const ThemeMoodManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { sentimentScore } = useMarket();

    useEffect(() => {
        const root = document.documentElement;
        
        // Define theme parameters based on sentiment
        let accent = '#6366f1';
        let accentHover = '#4f46e5';
        let accentLight = 'rgba(99, 102, 241, 0.1)';
        let glow = '0 0 15px rgba(99, 102, 241, 0.3)';

        if (sentimentScore >= 65) {
            // Greed Theme (Emerald/Teal)
            accent = '#10b981';
            accentHover = '#059669';
            accentLight = 'rgba(16, 185, 129, 0.1)';
            glow = '0 0 25px rgba(16, 185, 129, 0.4)';
        } else if (sentimentScore <= 35) {
            // Fear Theme (Crimson/Rose)
            accent = '#f43f5e';
            accentHover = '#e11d48';
            accentLight = 'rgba(244, 63, 94, 0.1)';
            glow = '0 0 25px rgba(244, 63, 94, 0.4)';
        }

        // Apply with a smooth transition (handled by CSS transition property)
        root.style.setProperty('--mood-accent', accent);
        root.style.setProperty('--mood-accent-hover', accentHover);
        root.style.setProperty('--mood-accent-light', accentLight);
        root.style.setProperty('--mood-glow', glow);


    }, [sentimentScore]);

    return <>{children}</>;
};

export default ThemeMoodManager;
