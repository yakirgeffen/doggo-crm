import { useEffect, useState } from 'react';
import { Plus, Layers, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type Program } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

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
                    <Link to="/programs/new" className="btn btn-primary">
                        <Plus size={20} className="ms-2" />
                        תוכנית חדשה
                    </Link>
                }
            />

            {/* Filter Pills */}
            <div className="flex gap-1 p-1 bg-background rounded-lg border border-border w-fit">
                {(['active', 'completed', 'all'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${filter === f
                            ? 'bg-surface text-primary shadow-soft'
                            : 'text-text-muted hover:text-text-primary hover:bg-surface-warm'
                            }`}
                    >
                        {f === 'all' ? 'הכל' : f === 'active' ? 'פעיל' : 'הושלם'}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-24 text-text-muted">
                    <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4 opacity-50"></div>
                    <p className="font-medium">טוען תוכניות...</p>
                </div>
            ) : filteredPrograms.length === 0 ? (
                <EmptyState
                    icon={Layers}
                    title="לא נמצאו תוכניות"
                    description={filter === 'all' ? "התחל את המסע על ידי יצירת תוכנית אילוף ראשונה." : `לא נמצאו תוכניות בסטטוס '${filter === 'active' ? 'פעיל' : 'הושלם'}'.`}
                    actionLabel={filter === 'all' ? "צור תוכנית ראשונה" : undefined}
                    onAction={filter === 'all' ? () => navigate('/programs/new') : undefined}
                    color="primary"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPrograms.map((program) => (
                        <Link
                            key={program.id}
                            to={`/programs/${program.id}`}
                            className={`flat-card p-6 transition-all group flex flex-col justify-between ${program.payment_status === 'unpaid'
                                ? 'border-error/40 bg-error/5'
                                : 'hover:border-primary'
                                }`}
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`badge ${program.status === 'active' ? 'badge-active' :
                                            program.status === 'completed' ? 'badge-muted' :
                                                'badge-pending'
                                        }`}>
                                        {program.status === 'active' ? 'פעיל' : program.status === 'completed' ? 'הושלם' : program.status}
                                    </span>
                                    <ChevronLeft size={18} className="text-text-muted group-hover:text-primary transition-colors" />
                                </div>

                                <h3 className="text-xl font-bold text-text-primary mb-1 group-hover:text-primary transition-colors">
                                    {program.program_name}
                                </h3>
                                <div className="text-sm font-medium text-text-muted mb-6 flex items-center gap-2">
                                    <span className="text-base">🐕</span>
                                    {program.clients?.full_name}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-end text-xs font-medium text-text-muted uppercase tracking-wide">
                                    <span>התקדמות</span>
                                    <span dir="ltr" className="text-sm text-text-primary ltr-nums">
                                        {program.sessions_completed} <span className="text-text-muted">/ {program.sessions_included || '∞'}</span>
                                    </span>
                                </div>
                                <div className="w-full bg-background rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${program.status === 'completed' ? 'bg-success' :
                                                program.status === 'paused' ? 'bg-text-muted' :
                                                    'bg-primary'
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
