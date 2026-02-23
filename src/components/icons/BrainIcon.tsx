import React from 'react';

const BrainIcon: React.FC<{ size?: number; className?: string; strokeWidth?: number }> = ({ size = 24, className = "", strokeWidth = 1.5 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M9.5 2C7.5 2 6 3.5 6 5.5c0 1.5.5 2.5 1.5 3s1 1.5 1 2.5c0 1.5-1 2.5-2.5 2.5S3.5 12 3.5 10.5M14.5 2c2 0 3.5 1.5 3.5 3.5 0 1.5-.5 2.5-1.5 3s-1 1.5-1 2.5c0 1.5 1 2.5 2.5 2.5S20.5 12 20.5 10.5" />
        <path d="M12 22v-4m-3 4h6m-3-11c-2.5 0-4.5 2-4.5 4.5S6.5 20 9 20h6c2.5 0 4.5-2 4.5-4.5S17.5 11 15 11h-3z" />
        <path d="M9 11c0-4 1.5-6 3-6s3 2 3 6M10 14h4" />
    </svg>
);

export default BrainIcon;
