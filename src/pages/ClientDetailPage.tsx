import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Mail, Phone, Dog, Plus, ClipboardList, History } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type Client, type Program } from '../types';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { EmailComposer } from '../components/EmailComposer';
import { PageHeader } from '../components/PageHeader';

export function ClientDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const [client, setClient] = useState<Client | null>(null);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEmailOpen, setIsEmailOpen] = useState(false);

    useEffect(() => {
        if (id) {
            fetchClientData();
        }
        if (searchParams.get('action') === 'email') {
            setIsEmailOpen(true);
        }
    }, [id, searchParams]);

    const fetchClientData = async () => {
        setLoading(true);

        // Parallel fetch
        const [clientRes, programsRes] = await Promise.all([
            supabase.from('clients').select('*').eq('id', id!).single(),
            supabase.from('programs').select('*').eq('client_id', id!).order('created_at', { ascending: false })
        ]);

        if (clientRes.error) console.error('Error fetching client:', clientRes.error);
        if (programsRes.error) console.error('Error fetching programs:', programsRes.error);

        if (clientRes.data) setClient(clientRes.data);
        if (programsRes.data) setPrograms(programsRes.data); // Fixed typo here (programsRes.data instead of programs.data)

        setLoading(false);
    };

    if (loading) return <div className="p-8 text-center text-[var(--color-text-muted)]">Loading profile...</div>;
    if (!client) return <div className="p-8 text-center text-[var(--color-text-muted)]">Client not found.</div>;

    return (
        <div className="animate-fade-in max-w-5xl mx-auto pb-12">
            <PageHeader
                title={client.full_name}
                subtitle={
                    <div className="flex items-center gap-2">
                        <Dog size={16} />
                        <span>{client.primary_dog_name}</span>
                        <span className="mx-1">•</span>
                        <span>הצטרף ב- {new Date(client.created_at).toLocaleDateString('he-IL')}</span>
                    </div>
                }
                backUrl="/clients"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Client Info */}
                <div className="space-y-6">
                    <div className="flat-card p-0 overflow-hidden">
                        <div className="p-6 bg-[var(--color-accent)]/30 border-b border-[var(--color-border)]">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-[var(--color-border)]">
                                <Dog size={32} className="text-[var(--color-primary)] opacity-90" />
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3 text-sm text-[var(--color-text-main)] group">
                                <Mail size={16} className="text-[var(--color-text-muted)]" />
                                <a href={`mailto:${client.email}`} className="font-medium hover:text-[var(--color-primary)] transition-colors">{client.email}</a>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-[var(--color-text-main)] group">
                                <Phone size={16} className="text-[var(--color-text-muted)]" />
                                <a href={`tel:${client.phone}`} className="font-medium hover:text-[var(--color-primary)] transition-colors">{client.phone}</a>
                            </div>
                        </div>
                    </div>

                    <div className="flat-card p-5">
                        <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full"></span>
                            הערות
                        </h3>
                        <p className="text-sm text-[var(--color-text-main)] leading-relaxed whitespace-pre-line">
                            {client.notes || 'אין הערות.'}
                        </p>
                    </div>
                </div>

                {/* Right Column: Programs & Activity */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Active Programs Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-black text-[var(--color-text-main)] flex items-center gap-2">
                                <ClipboardList size={24} className="text-[var(--color-primary)]" /> תוכניות אילוף
                            </h2>
                            <Link
                                to={`/programs/new?client_id=${id}`}
                                className="btn btn-primary text-sm py-2 px-4 shadow-lg shadow-green-900/10"
                            >
                                <Plus size={16} className="ml-1" /> הוסף תוכנית
                            </Link>
                        </div>

                        {programs.length === 0 ? (
                            <div className="flat-card p-12 text-center border-dashed border-2 bg-transparent text-[var(--color-text-muted)]">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                                    <Plus size={24} />
                                </div>
                                <p className="font-medium">לא נמצאו תוכניות</p>
                                <p className="text-sm mt-1">התחל חבילת אילוף חדשה עבור הכלב</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {programs.map((program) => (
                                    <Link
                                        to={`/programs/${program.id}`}
                                        key={program.id}
                                        className="flat-card p-5 flex flex-col md:flex-row justify-between gap-6 hover:border-[var(--color-primary)] transition-all group cursor-pointer"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-[var(--color-text-main)] group-hover:text-[var(--color-primary)] transition-colors">
                                                    {program.program_name}
                                                </h3>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${program.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    program.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {program.status === 'active' ? 'פעיל' : program.status === 'completed' ? 'הושלם' : 'מבוטל'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[var(--color-text-muted)] font-medium" dir="ltr">
                                                {/* Logic Fix: Completed / Total */}
                                                {program.program_type === 'fixed_sessions'
                                                    ? `${program.sessions_completed} / ${program.sessions_included} sessions`
                                                    : `${program.sessions_completed} sessions (ongoing)`}
                                            </p>
                                        </div>

                                        <div className="w-full md:w-1/3 flex flex-col justify-center">
                                            {program.program_type === 'fixed_sessions' && program.sessions_included && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs font-bold text-[var(--color-text-muted)]">
                                                        <span>התקדמות</span>
                                                        <span>{Math.round((program.sessions_completed / program.sessions_included) * 100)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-1000"
                                                            style={{ width: `${Math.min(100, (program.sessions_completed / program.sessions_included) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Activity Timeline */}
                    <div>
                        <h2 className="text-xl font-black text-[var(--color-text-main)] mb-4 flex items-center gap-2">
                            <History size={24} className="text-[var(--color-primary)]" /> היסטוריית פעילות
                        </h2>
                        <div className="flat-card p-0 overflow-hidden">
                            <ActivityTimeline
                                entityType="client"
                                entityId={id}
                                programIds={programs.map(p => p.id)}
                            />
                        </div>
                    </div>

                </div>
            </div>
            {client && (
                <EmailComposer
                    isOpen={isEmailOpen}
                    onClose={() => {
                        setIsEmailOpen(false);
                        // Clear the query param
                        const newUrl = window.location.pathname;
                        window.history.replaceState({}, '', newUrl);
                    }}
                    clientEmail={client.email || ''}
                    clientName={client.full_name}
                    dogName={client.primary_dog_name || ''}
                    entityType="client"
                    entityId={client.id}
                />
            )}
        </div>
    );
}
