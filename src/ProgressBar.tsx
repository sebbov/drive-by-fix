import React from 'react';

interface ProgressBarProps {
    percentage: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
    const clampedPercentage = Math.min(100, Math.max(0, percentage));
    return (
        <div className="relative w-full bg-gray-400 rounded-full h-6">
            <div
                className="bg-blue-500 h-6 rounded-full"
                style={{ width: `${percentage}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
                {clampedPercentage}%
            </span>
        </div>
    );
};

export default ProgressBar;
