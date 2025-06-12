'use client';

import { useEffect, useState } from 'react';

export default function ClientOnly({ children }) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-pulse">
                        <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
                        <div className="h-4 bg-blue-200 rounded w-48 mx-auto mb-2"></div>
                        <div className="h-4 bg-blue-200 rounded w-32 mx-auto"></div>
                    </div>
                    <p className="text-gray-600 mt-4">Initializing...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
