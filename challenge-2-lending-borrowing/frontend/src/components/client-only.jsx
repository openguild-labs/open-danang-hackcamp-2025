'use client';

import { useEffect, useState } from 'react';

export default function ClientOnly({ children }) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-lg">Loading...</div>
            </div>
        );
    }

    return children;
}
