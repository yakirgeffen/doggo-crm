import { useEffect, useState } from 'react';
import { Plus, Layers } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type Program } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

// Extended type for joining
interface ProgramWithClient extends Program {
    clients: {
        full_name: string;
        primary_dog_name: string;
    };
}

export function ProgramsPage() {
    const navigate = useNavigate();
    const [programs, setPrograms] = useState<ProgramWithClient[]>([]);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        setLoading(true);
        // Join with clients table
        const { data, error } = await supabase
            .from('programs')
            .select('*, clients(full_name, primary_dog_name)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching programs:', error);
        } else {
            setPrograms(data as any || []);
        }
        setLoading(false);
    };

    const filteredPrograms = programs.filter((p) => {
        if (filter === 'all') return true;
        if (filter === 'active') return p.status === 'active' || p.status === 'paused';
        if (filter === 'completed') return p.status === 'completed';
        return true;
    });

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
            <PageHeader
                title="תוכניות"
                subtitle="ניהול חבילות אילוף ומעקב אחר התקדמות"
                actions={
                    <Link to="/programs/new" className="btn btn-primary shadow-lg shadow-green-900/10 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                        <Plus size={20} className="ml-2" />
                        תוכנית חדשה
                    </Link>
                }
            />

            {/* Filter Pills */}
            <div className="flex gap-1 p-1 bg-[var(--color-bg-app)] rounded-[var(--radius-md)] border border-[var(--color-border)] w-fit">
                {(['active', 'completed', 'all'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${filter === f
                            ? 'bg-[var(--color-primary)] text-white shadow-sm'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-white/50'
                            }`}
                    >
                        {f === 'all' ? 'הכל' : f === 'active' ? 'פעיל' : 'הושלם'}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="text-center py-24 text-[var(--color-text-muted)]">
                    <div className="animate-spin w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-4 opacity-70"></div>
                    <p className="font-medium animate-pulse">טוען תוכניות...</p>
                </div>
            ) : filteredPrograms.length === 0 ? (
                <EmptyState
                    icon={Layers}
                    title="לא נמצאו תוכניות"
                    description={filter === 'all' ? "התחל את המסע על ידי יצירת תוכנית אילוף ראשונה." : `לא נמצאו תוכניות בסטטוס '${filter === 'active' ? 'פעיל' : 'הושלם'}'.`}
                    actionLabel={filter === 'all' ? "צור תוכנית ראשונה" : undefined}
                    onAction={filter === 'all' ? () => navigate('/programs/new') : undefined}
                    color="blue"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPrograms.map((program) => (
                        <Link
                            key={program.id}
                            to={`/programs/${program.id}`}
                            className={`flat-card p-6 transition-all group flex flex-col justify-between ${program.payment_status === 'unpaid'
                                ? 'border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.15)] bg-red-50/10'
                                : 'hover:border-[var(--color-primary)]'
                                }`}
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-2.5 py-0.5 rounded-md text-xs font-bold leading-relaxed ${program.status === 'active' ? 'bg-[var(--color-accent)] text-[var(--color-accent-text)]' : 'bg-[var(--color-bg-app)] text-[var(--color-text-muted)]'}`}>
                                        {program.status === 'active' ? 'פעיל' : program.status === 'completed' ? 'הושלם' : program.status}
                                    </div>
                                    <div className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors">
                                        →
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-[var(--color-text-main)] mb-1 group-hover:text-[var(--color-primary)] transition-colors">
                                    {program.program_name}
                                </h3>
                                <div className="text-sm font-medium text-[var(--color-text-muted)] mb-6 flex items-center gap-2">
                                    <span className="text-base">🐕</span>
                                    {program.clients?.full_name}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide">
                                    <span>התקדמות</span>
                                    <span dir="ltr" className="text-sm text-[var(--color-text-main)]">
                                        {program.sessions_completed} <span className="text-[var(--color-text-muted)]">/ {program.sessions_included || '∞'}</span>
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${program.status === 'completed' ? 'bg-gradient-to-r from-green-400 to-emerald-600' :
                                            program.status === 'paused' ? 'bg-gray-400' :
                                                'bg-gradient-to-r from-blue-500 to-indigo-600'
                                            }`}
                                        style={{
                                            width: `${Math.min(100, (program.sessions_completed / (program.sessions_included || 1)) * 100)}%`
                                        }}
                                    />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
