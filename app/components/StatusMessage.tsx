'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface StatusMessageProps {
    message: string;
    isError: boolean;
    persistent?: boolean;
}

export function StatusMessage({ message, isError, persistent }: StatusMessageProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        setIsVisible(true);
    }, [message]);

    if (!isVisible) return null;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-md mx-auto">
            <div
                className={`
                    ${isError ? 'bg-red-50 text-red-800 border-red-200' : 'bg-blue-50 text-blue-800 border-blue-200'}
                    px-4 py-3 rounded-lg shadow-lg border
                    animate-fade-in
                    flex items-center
                    backdrop-blur-sm bg-opacity-95
                `}
                role="alert"
            >
                <div className="flex items-center gap-2 flex-1 mr-2">
                    <span className="text-xl">
                        {isError ? '⚠️' : '🔄'}
                    </span>
                    <p className="text-sm font-medium">
                        {message}
                    </p>
                </div>
                {!persistent && (
                    <button
                        onClick={() => setIsVisible(false)}
                        className="flex-shrink-0 text-xl leading-none w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-all duration-150"
                        aria-label="Dismiss"
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
}

// Add this to your globals.css or create a new style block in your layout
const styles = `
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translate(-50%, -20px);
    }
    to {
        opacity: 1;
        transform: translate(-50%, 0);
    }
}

.animate-fade-in {
    animation: fadeIn 0.2s ease-out forwards;
}
`; 