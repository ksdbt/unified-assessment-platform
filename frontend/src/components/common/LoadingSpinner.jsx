import React from 'react';

const LoadingSpinner = ({ size = 'default', fullScreen = false, text = 'Loading...' }) => {
    const sizeClasses = {
        small: 'w-6 h-6 border-2',
        default: 'w-10 h-10 border-3',
        large: 'w-16 h-16 border-4'
    };

    const spinnerContent = (
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`${sizeClasses[size]} border-gray-200 border-t-blue-600 rounded-full animate-spin`}></div>
            {text && <span className="text-gray-500 font-medium dark:text-gray-400">{text}</span>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-all duration-300">
                {spinnerContent}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center w-full h-full p-4">
            {spinnerContent}
        </div>
    );
};

export default LoadingSpinner;
