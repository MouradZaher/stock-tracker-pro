import React from 'react';

const BrainIconV2: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = "" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M9.5 2a.5.5 0 0 1 .5.5.5.5 0 0 1-.5.5.5.5 0 0 1-.5-.5.5.5 0 0 1 .5-.5zM14.5 2a.5.5 0 0 1 .5.5.5.5 0 0 1-.5.5.5.5 0 0 1-.5-.5.5.5 0 0 1 .5-.5zM12 5C8.13 5 5 7.69 5 11c0 2.21 1.41 4.09 3.4 5.16l-.4 1.84c-.06.28.16.5.43.5h7.14c.27 0 .49-.22.43-.5l-.4-1.84C17.59 15.09 19 13.21 19 11c0-3.31-3.13-6-7-6z"></path>
        <path d="M9 11h6M12 8v6"></path>
    </svg>
);

export default BrainIconV2;
