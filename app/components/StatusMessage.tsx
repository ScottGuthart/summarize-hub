'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type StatusMessageProps = {
    message: string;
    isError?: boolean;
    persistent?: boolean;
}

export function StatusMessage({ message, isError = false, persistent = false }: StatusMessageProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (persistent) return;

        const timer = setTimeout(() => {
            setVisible(false);
        }, isError ? 8000 : 5000);

        return () => clearTimeout(timer);
    }, [isError, message, persistent]);

    if (!visible) return null;

    return (
        <div
            className={cn(
                "fixed top-4 right-4 p-4 rounded-lg shadow-lg transition-all",
                isError ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
            )}
            dangerouslySetInnerHTML={{ __html: message }}
        />
    );
} 