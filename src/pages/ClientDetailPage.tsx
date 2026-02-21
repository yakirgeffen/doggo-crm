import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { SkeletonClientDetail } from '../components/Skeleton';
import { supabase } from '../lib/supabase';
import { type Client, type Program } from '../types';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { EmailComposer } from '../components/EmailComposer';
import { PageHeader } from '../components/PageHeader';
import { ClientHero } from '../components/client/ClientHero';
import { StickyNote } from '../components/client/StickyNote';
import { ProgramTabs, type TabId } from '../components/client/ProgramTabs';
import { ProgramWorkspace } from '../components/client/ProgramWorkspace';

export function ClientDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const [client, setClient] = useState<Client | null>(null);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Tab & program selection
    const [activeTab, setActiveTab] = useState<TabId>('active');
    const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

    useEffect(() => {
        if (id) fetchClientData();
        if (searchParams.get('action') === 'email') setIsEmailOpen(true);

        // Pre-select a program if coming from /programs/:id redirect
        const programParam = searchParams.get('program');
        if (programParam) {
            setSelectedProgramId(programParam);
            setActiveTab('active');
        }
    }, [id, searchParams]);

    const fetchClientData = async () => {
        setLoading(true);

        const [clientRes, programsRes] = await Promise.all([
            supabase.from('clients').select('*').eq('id', id!).single(),
            supabase.from('programs').select('*').eq('client_id', id!).order('created_at', { ascending: false })
        ]);

        if (clientRes.error) console.error('Error fetching client:', clientRes.error);
        if (programsRes.error) console.error('Error fetching programs:', programsRes.error);

        if (clientRes.data) setClient(clientRes.data);
        if (programsRes.data) {
            setPrograms(programsRes.data);
            // Auto-select the first active program if none is pre-selected
            const programParam = searchParams.get('program');
            const activeProgs = programsRes.data.filter((p: Program) => p.status === 'active');
            if (!programParam && activeProgs.length > 0) {
                setSelectedProgramId(activeProgs[0].id);
            }
        }

        setLoading(false);
    };

    if (loading) return <SkeletonClientDetail />;
    if (!client) return <div className="p-8 text-center text-text-muted">הלקוח לא נמצא.</div>;

    const activePrograms = programs.filter(p => p.status === 'active');
    const historyPrograms = programs.filter(p => p.status !== 'active');
    const selectedProgram = programs.find(p => p.id === selectedProgramId) || null;
    const clientFirstName = client.full_name.split(' ')[0];

    return (
        <div className="animate-fade-in max-w-5xl mx-auto pb-12">
            <PageHeader
                title={client.full_name}
                subtitle={client.primary_dog_name || undefined}
                backUrl="/clients"
                actions={
                    <Link
                        to={`/programs/new?client_id=${id}`}
                        className="btn btn-primary text-sm py-2 px-4"
                    >
                        <Plus size={16} className="ms-1" />
                        תוכנית חדשה
                    </Link>
                }
            />

            {/* Dog-centric Hero */}
            <ClientHero client={client} />

            {/* Sticky Note */}
            <StickyNote clientId={client.id} initialNote={client.notes} />

            {/* Tabs */}
            <ProgramTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                programs={programs}
                selectedProgramId={selectedProgramId}
                onSelectProgram={setSelectedProgramId}
            />

            {/* Tab Content */}
            {activeTab === 'active' && (
                <>
                    {activePrograms.length === 0 ? (
                        <div className="flat-card p-12 text-center border-dashed border-2 bg-transparent text-text-muted">
                            <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center mx-auto mb-3 text-text-muted">
                                <Plus size={24} />
                            </div>
                            <p className="font-medium">אין תוכניות פעילות</p>
                            <p className="text-sm mt-1">התחל חבילת אילוף חדשה עבור הכלב</p>
                            <Link
                                to={`/programs/new?client_id=${id}`}
                                className="btn btn-primary mt-4 inline-flex"
                            >
                                <Plus size={16} className="ms-1" />
                                הוסף תוכנית
                            </Link>
                        </div>
                    ) : selectedProgram ? (
                        <ProgramWorkspace
                            program={selectedProgram}
                            clientName={client.full_name}
                            clientFirstName={clientFirstName}
                            clientEmail={client.email || ''}
                            clientPhone={client.phone}
                        />
                    ) : null}
                </>
            )}

            {activeTab === 'intake' && (
                <div className="flat-card p-8 text-center text-text-muted">
                    <div className="text-4xl mb-3">📋</div>
                    <p className="font-medium">אזור הקבלה</p>
                    <p className="text-sm mt-1">נתוני קבלה ואבחון יופיעו כאן בקרוב (Phase 3)</p>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-6">
                    {/* Completed programs */}
                    {historyPrograms.length > 0 ? (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">תוכניות שהסתיימו</h3>
                            {historyPrograms.map((program) => (
                                <div
                                    key={program.id}
                                    className="flat-card p-4 flex justify-between items-center cursor-pointer hover:border-primary transition-colors"
                                    onClick={() => {
                                        setSelectedProgramId(program.id);
                                        setActiveTab('active');
                                    }}
                                >
                                    <div>
                                        <p className="font-bold text-text-primary">{program.program_name}</p>
                                        <p className="text-sm text-text-muted ltr-nums" dir="ltr">
                                            {program.sessions_completed} / {program.sessions_included || '∞'} sessions
                                        </p>
                                    </div>
                                    <span className={`badge ${program.status === 'completed' ? 'badge-completed' : 'badge-pending'}`}>
                                        {program.status === 'completed' ? 'הושלם' : 'מבוטל'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-text-muted text-sm py-6">אין היסטוריית תוכניות</div>
                    )}

                    {/* Activity Timeline */}
                    <div>
                        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">פעילות אחרונה</h3>
                        <div className="flat-card p-0 overflow-hidden">
                            <ActivityTimeline
                                key={refreshKey}
                                entityType="client"
                                entityId={id}
                                programIds={programs.map(p => p.id)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Email Composer */}
            {client && (
                <EmailComposer
                    isOpen={isEmailOpen}
                    onClose={() => {
                        setIsEmailOpen(false);
                        const newUrl = window.location.pathname;
                        window.history.replaceState({}, '', newUrl);
                    }}
                    onSuccess={() => {
                        setRefreshKey(prev => prev + 1);
                        setIsEmailOpen(false);
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
