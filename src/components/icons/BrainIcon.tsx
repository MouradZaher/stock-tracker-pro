import React from 'react';

interface BrainIconProps {
    size?: number;
    className?: string;
}

// Simple, clean brain icon matching lucide-react style
const BrainIcon: React.FC<BrainIconProps> = ({ size = 24, className = '' }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {/* Left brain hemisphere */}
            <path d="M9.5 2C8 2 6.5 3 6 4.5C5 4.5 4 5.5 4 7C3 7.5 2 9 2.5 10.5C2 11.5 2 13 3 14C3 15.5 4 17 5.5 17.5L6 22H9L9.5 17" />

            {/* Right brain hemisphere */}
            <path d="M14.5 2C16 2 17.5 3 18 4.5C19 4.5 20 5.5 20 7C21 7.5 22 9 21.5 10.5C22 11.5 22 13 21 14C21 15.5 20 17 18.5 17.5L18 22H15L14.5 17" />

            {/* Center connection */}
            <path d="M12 2V22" opacity="0.5" />

            {/* Neural dots */}
            <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
            <circle cx="16" cy="8" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
    );
};

export default BrainIcon;
