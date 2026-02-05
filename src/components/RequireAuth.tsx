import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuth({ children }: { children: React.ReactNode }) {
    const { session, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // Determine loading state UI.
        return (
            <div className="flex h-screen items-center justify-center bg-bg-app">
                <div className="text-primary">Loading...</div>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
