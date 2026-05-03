import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Plus, Receipt } from 'lucide-react';
import { SkeletonClientDetail } from '../components/Skeleton';
import { supabase } from '../lib/supabase';
import { type Client, type Program } from '../types';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { EmailComposer } from '../components/EmailComposer';
import { SendQuoteModal } from '../components/SendQuoteModal';
import { PageHeader } from '../components/PageHeader';
import { ClientHero } from '../components/client/ClientHero';
import { StickyNote } from '../components/client/StickyNote';
import { ProgramTabs, type TabId } from '../components/client/ProgramTabs';
import { ProgramWorkspace } from '../components/client/ProgramWorkspace';
import { AttachmentsList } from '../components/client/AttachmentsList';

export function ClientDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [client, setClient] = useState<Client | null>(null);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [isQuoteOpen, setIsQuoteOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Tab & program selection
    const [activeTab, setActiveTab] = useState<TabId>('active');
    const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

    const [quotes, setQuotes] = useState<{ id: string; sumit_document_number: number | null; total_amount: number | null; currency: string | null; status: string; sent_at: string | null }[]>([]);

    const fetchClientData = useCallback(async () => {
        if (!id) return;
        setLoading(true);

        const [clientRes, programsRes, quotesRes] = await Promise.all([
            supabase.from('clients').select('*').eq('id', id).single(),
            supabase.from('programs').select('*').eq('client_id', id).order('created_at', { ascending: false }),
            supabase.from('quotes').select('id, sumit_document_number, total_amount, currency, status, sent_at').eq('client_id', id).order('sent_at', { ascending: false })
        ]);

        if (quotesRes.data) setQuotes(quotesRes.data);

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
    }, [id, searchParams]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch + searchParam-derived state
        fetchClientData();
        if (searchParams.get('action') === 'email') setIsEmailOpen(true);

        // Pre-select a program if coming from /programs/:id redirect
        const programParam = searchParams.get('program');
        if (programParam) {
            setSelectedProgramId(programParam);
            setActiveTab('active');
        }
    }, [searchParams, fetchClientData]);

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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsQuoteOpen(true)}
                            className="btn btn-secondary text-sm py-2 px-4 flex items-center gap-1"
                            title="שליחת הצעת מחיר ללקוח"
                        >
                            <Receipt size={16} />
                            הצעת מחיר
                        </button>
                        <Link
                            to={`/programs/new?client_id=${id}`}
                            className="btn btn-primary text-sm py-2 px-4"
                        >
                            <Plus size={16} className="ms-1" />
                            תוכנית חדשה
                        </Link>
                    </div>
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
                            <p className="text-sm mt-1">התחלת חבילת אילוף חדשה עבור הכלב</p>
                            <Link
                                to={`/programs/new?client_id=${id}`}
                                className="btn btn-primary mt-4 inline-flex"
                            >
                                <Plus size={16} className="ms-1" />
                                הוספת תוכנית
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

            {activeTab === 'files' && (
                <AttachmentsList clientId={client.id} />
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
                                        <p className="text-sm text-text-muted">
                                            <span className="ltr-nums">{program.sessions_completed} / {program.sessions_included || '∞'}</span> מפגשים
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

                    {/* Quote history (G8 native via Sumit) */}
                    {quotes.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">הצעות מחיר</h3>
                            {quotes.map((q) => (
                                <div key={q.id} className="flat-card p-4 flex justify-between items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-text-primary">
                                            הצעת מחיר {q.sumit_document_number ? `#${q.sumit_document_number}` : ''}
                                        </p>
                                        <p className="text-xs text-text-muted">
                                            {q.sent_at ? new Date(q.sent_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                                            {q.total_amount && ` · ₪${Number(q.total_amount).toLocaleString()}`}
                                        </p>
                                    </div>
                                    <select
                                        className={`text-xs font-medium px-2 py-1 rounded-lg border bg-surface ${
                                            q.status === 'accepted' ? 'text-success border-success/30' :
                                            q.status === 'declined' || q.status === 'expired' ? 'text-text-muted border-border' :
                                            'text-primary border-primary/30'
                                        }`}
                                        value={q.status}
                                        onChange={async (e) => {
                                            const newStatus = e.target.value;
                                            const { error } = await supabase
                                                .from('quotes')
                                                .update({ status: newStatus })
                                                .eq('id', q.id);
                                            if (!error) {
                                                setQuotes(prev => prev.map(x => x.id === q.id ? { ...x, status: newStatus } : x));
                                            }
                                        }}
                                    >
                                        <option value="sent">נשלחה</option>
                                        <option value="viewed">נצפתה</option>
                                        <option value="accepted">אושרה ✓</option>
                                        <option value="declined">נדחתה</option>
                                        <option value="expired">פגה</option>
                                        <option value="draft">טיוטה</option>
                                    </select>
                                </div>
                            ))}
                        </div>
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

            {/* Send Quote Modal */}
            {client && (
                <SendQuoteModal
                    isOpen={isQuoteOpen}
                    onClose={() => setIsQuoteOpen(false)}
                    onSent={() => setRefreshKey(prev => prev + 1)}
                    clientId={client.id}
                    clientName={client.full_name}
                    clientEmail={client.email || ''}
                    clientPhone={client.phone || undefined}
                />
            )}

            {/* Email Composer */}
            {client && (
                <EmailComposer
                    isOpen={isEmailOpen}
                    onClose={() => {
                        setIsEmailOpen(false);
                        setSearchParams({}, { replace: true });
                    }}
                    onSuccess={() => {
                        setRefreshKey(prev => prev + 1);
                        setIsEmailOpen(false);
                        setSearchParams({}, { replace: true });
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
