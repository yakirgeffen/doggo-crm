import { useState } from 'react';
import { seedHebrewData } from '../utils/seedHebrew';

export function SeedPage() {
    const [status, setStatus] = useState('Idle');

    const handleSeed = async () => {
        setStatus('Seeding...');
        await seedHebrewData();
        setStatus('Done! Check Clients page.');
    };

    return (
        <div className="p-10 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold mb-4">Database Seeder (Hebrew)</h1>
            <button
                onClick={handleSeed}
                className="btn btn-primary bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
                Generate 10 Clients
            </button>
            <p className="mt-4 text-gray-600">{status}</p>
        </div>
    );
}
