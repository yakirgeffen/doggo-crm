import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { seedHebrewData } from '../utils/seedHebrew';

/**
 * Dev-only data seeder. Defense in depth:
 *   1. The /seed route in App.tsx is wrapped in `import.meta.env.DEV`.
 *   2. This component additionally redirects to / in production builds,
 *      so even a stale build/manual nav can't run the seeder.
 */
export function SeedPage() {
    const [status, setStatus] = useState('Idle');

    if (!import.meta.env.DEV) {
        return <Navigate to="/" replace />;
    }

    const handleSeed = async () => {
        setStatus('Seeding...');
        await seedHebrewData();
        setStatus('Done! Check Clients page.');
    };

    return (
        <div className="p-10 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold mb-4 text-text-primary">Database Seeder (Hebrew) — DEV ONLY</h1>
            <p className="text-xs text-text-muted mb-4 max-w-md text-center">
                This route is automatically blocked outside dev builds (App.tsx route gate + in-component
                redirect). Safe to keep in the repo.
            </p>
            <button
                onClick={handleSeed}
                className="btn btn-primary px-6 py-3"
            >
                Generate 10 Clients
            </button>
            <p className="mt-4 text-text-muted">{status}</p>
        </div>
    );
}
