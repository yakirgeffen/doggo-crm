import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plus, CreditCard, ExternalLink, Share2, FileText, MessageCircle, Calendar, Banknote, Loader2 } from 'lucide-react';
import { supabase, updateProgramStatus } from '../../lib/supabase';
import { useIntegrations } from '../../hooks/useIntegrations';
import type { Program, Session } from '../../types';
import { SessionCard } from './SessionCard';
import { EmptyState } from '../EmptyState';
import { SkeletonSessionList } from '../Skeleton';
import { useToast } from '../../context/ToastContext';
import { ExtendProgramModal } from '../ExtendProgramModal';
import { SessionCheckoutModal } from '../SessionCheckoutModal';

interface ProgramWorkspaceProps {
    program: Program;
    clientName: string;
    clientFirstName: string;
    clientEmail: string;
    clientPhone: string | null;
}

export function ProgramWorkspace({ program, clientName, clientFirstName, clientEmail, clientPhone }: ProgramWorkspaceProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const { generatePaymentLink, loading: generatingLink } = useIntegrations();
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [programState, setProgramState] = useState(program);

    // Session checkout modal
    const [checkoutSession, setCheckoutSession] = useState<Session | null>(null);
    const [markingPaid, setMarkingPaid] = useState(false);

    useEffect(() => {
        setProgramState(program);
    }, [program]);

    useEffect(() => {
        fetchSessions();
    }, [program.id]);

    // Auto-open checkout modal if we came from NewSessionPage with a freshly created session
    useEffect(() => {
        const state = location.state as { newSession?: Session } | null;
        if (state?.newSession && state.newSession.program_id === program.id) {
            setCheckoutSession(state.newSession);
            fetchSessions(); // refresh to include the new session
            // Clear the state to prevent re-opening on re-render
            window.history.replaceState({}, '');
        }
    }, [location.state, program.id]);

    const fetchSessions = async () => {
        setLoadingSessions(true);
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('program_id', program.id)
            .order('session_date', { ascending: false });

        if (error) console.error('Error fetching sessions:', error);
        if (data) setSessions(data);
        setLoadingSessions(false);
    };

    const handleExtendProgram = async (additionalSessions: number, additionalPrice: number) => {
        const newSessionsIncluded = (programState.sessions_included || 0) + additionalSessions;
        const newPrice = (programState.price || 0) + additionalPrice;

        const updates: Record<string, unknown> = {
            sessions_included: newSessionsIncluded,
            price: newPrice,
            status: 'active'
        };

        if (additionalPrice > 0) {
            updates.payment_status = 'pending';
        }

        const { error } = await supabase
            .from('programs')
            .update(updates)
            .eq('id', programState.id);

        if (error) {
            console.error('Error extending program:', error);
        } else {
            setProgramState(prev => ({
                ...prev,
                sessions_included: newSessionsIncluded,
                price: newPrice,
                status: 'active',
                ...(additionalPrice > 0 ? { payment_status: 'pending' as const } : {})
            }));
        }
    };

    const progressPercentage = programState.program_type === 'fixed_sessions' && programState.sessions_included
        ? Math.min(100, (programState.sessions_completed / programState.sessions_included) * 100)
        : 0;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flat-card p-4">
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1">סטטוס</span>
                    <span className={`badge ${programState.status === 'active' ? 'badge-active' :
                        programState.status === 'completed' ? 'badge-completed' :
                            'badge-pending'
                        }`}>
                        {programState.status === 'active' ? 'פעיל' : programState.status === 'completed' ? 'הושלם' : 'מבוטל'}
                    </span>
                </div>
                <div className="flat-card p-4">
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1">סוג תוכנית</span>
                    <span className="font-bold text-text-primary">
                        {programState.program_type === 'fixed_sessions' ? 'חבילה קבועה' : 'מתמשך'}
                    </span>
                </div>
                <div className="flat-card p-4">
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1">התקדמות</span>
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-text-primary text-lg min-w-[3ch] text-right ltr-nums">{Math.round(progressPercentage)}%</span>
                        <div className="flex-1 bg-background rounded-lg h-3 overflow-hidden">
                            <div
                                className={`h-full rounded-lg transition-all duration-1000 ease-out ${programState.status === 'completed' ? 'bg-success' :
                                    programState.status === 'paused' ? 'bg-text-muted' :
                                        'bg-primary'
                                    }`}
                                style={{ width: `${Math.min(100, progressPercentage)}%` }}
                            />
                        </div>
                    </div>
                </div>
                <div className="flat-card p-4 relative group">
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1">מפגשים</span>
                    <span className="text-xl font-bold text-text-primary ltr-nums" dir="ltr">
                        {programState.sessions_completed} <span className="text-text-muted text-sm font-normal">/ {programState.sessions_included || '∞'}</span>
                    </span>
                    {programState.program_type === 'fixed_sessions' && (
                        <button
                            onClick={() => setIsExtendModalOpen(true)}
                            className="absolute top-3 start-3 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/20 hover:scale-110 shadow-soft"
                            title="הוסף מפגשים"
                        >
                            <Plus size={16} />
                        </button>
                    )}
                </div>
            </div>

            <ExtendProgramModal
                isOpen={isExtendModalOpen}
                onClose={() => setIsExtendModalOpen(false)}
                onConfirm={handleExtendProgram}
                currentSessions={programState.sessions_included}
                programName={programState.program_name}
            />

            {/* Payment Section */}
            <div className={`flat-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-s-4 ${programState.payment_status === 'paid' ? 'border-s-success bg-success/5' :
                programState.payment_status === 'pending' ? 'border-s-warning bg-warning/5' :
                    'border-s-error bg-error/5'
                }`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${programState.payment_status === 'paid' ? 'bg-success/10 text-success' :
                        programState.payment_status === 'pending' ? 'bg-warning/10 text-warning' :
                            'bg-error/10 text-error animate-pulse'
                        }`}>
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                            סטטוס תשלום: {programState.payment_status === 'paid' ? 'שולם ✅' : programState.payment_status === 'pending' ? 'ממתין לתשלום ⏳' : 'לא שולם'}
                        </h3>
                        {programState.price && (
                            <p className="text-text-muted font-mono text-lg font-bold ltr-nums">
                                ₪{programState.price}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {programState.payment_status === 'paid' && programState.invoice_pdf_url && (
                        <a
                            href={programState.invoice_pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn bg-surface border border-border text-text-primary flex items-center gap-2"
                        >
                            <FileText size={18} />
                            צפה בחשבונית
                        </a>
                    )}

                    {programState.payment_status !== 'paid' && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(
                                    `היי ${clientFirstName}, תזכורת ידידותית לגבי הסדרת התשלום בסך ₪${programState.price} עבור ${programState.program_name}${programState.greeninvoice_invoice_number ? ` (חשבונית #${programState.greeninvoice_invoice_number})` : ''}. תודה! 🙏`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn bg-success/10 text-success border border-success/20 hover:bg-success/15 flex items-center gap-2"
                            >
                                <MessageCircle size={18} />
                                שלח תזכורת
                            </a>
                            <button
                                onClick={async () => {
                                    setMarkingPaid(true);
                                    const { error } = await supabase.from('programs').update({
                                        payment_status: 'paid',
                                    }).eq('id', programState.id);
                                    if (!error) {
                                        setProgramState(prev => ({ ...prev, payment_status: 'paid' as const }));
                                        showToast('סומן כשולם ✅', 'success');
                                    } else {
                                        showToast('שגיאה בעדכון תשלום', 'error');
                                    }
                                    setMarkingPaid(false);
                                }}
                                disabled={markingPaid}
                                className="btn bg-success/10 text-success border border-success/20 hover:bg-success/15 flex items-center gap-2"
                            >
                                <Banknote size={18} />
                                {markingPaid ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>שומר...</span>
                                    </>
                                ) : 'שולם (Bit/מזומן)'}
                            </button>
                            {!paymentUrl ? (
                                <button
                                    onClick={async () => {
                                        if (!programState.price) return showToast('לא נקבע מחיר לתוכנית זו', 'error');

                                        const res = await generatePaymentLink({
                                            description: `תשלום עבור תוכנית: ${programState.program_name}`,
                                            amount: programState.price,
                                            clientName: clientName,
                                            clientEmail: clientEmail,
                                            clientPhone: clientPhone || '',
                                            currency: programState.currency || 'ILS'
                                        });

                                        if (res.success && res.url) {
                                            setPaymentUrl(res.url);
                                            await supabase.from('programs').update({
                                                payment_status: 'pending',
                                                payment_link_id: res.id
                                            }).eq('id', programState.id);

                                            setProgramState(prev => ({ ...prev, payment_status: 'pending' as const }));
                                        } else {
                                            showToast(res.error || 'שגיאה ביצירת קישור', 'error');
                                        }
                                    }}
                                    disabled={generatingLink || !programState.price}
                                    className="btn btn-primary shadow-md bg-accent hover:bg-accent/90 border-accent text-white"
                                >
                                    {generatingLink ? 'המערכת מייצרת קישור...' : '💳 צור קישור לתשלום'}
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 animate-fade-in">
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(`היי ${clientFirstName}, הנה הקישור לתשלום עבור ${programState.program_name}: ${paymentUrl}`)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn bg-[#25D366] text-white hover:bg-[#128C7E] border-none shadow-soft flex items-center gap-2"
                                    >
                                        <Share2 size={18} />
                                        שלח בוואטסאפ
                                    </a>
                                    <a
                                        href={paymentUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-secondary border-accent/30 text-accent hover:bg-accent/5"
                                    >
                                        <ExternalLink size={18} />
                                        פתח קישור
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Program Actions */}
            {programState.status === 'active' && (
                <div className="flex items-center gap-3">
                    <Link
                        to={`/programs/${programState.id}/sessions/new`}
                        state={{ openCheckout: true, clientFirstName, dogName: clientName.split(' ')[0], programName: programState.program_name }}
                        className="btn btn-primary text-sm py-2 px-4"
                    >
                        <Plus size={16} className="ms-2" />
                        תיעוד מפגש חדש
                    </Link>
                    <button
                        onClick={async () => {
                            if (confirm('האם לסמן את התוכנית כהושלמה?')) {
                                await updateProgramStatus(programState.id, 'completed');
                                setProgramState(prev => ({ ...prev, status: 'completed' as const }));
                            }
                        }}
                        className="btn bg-surface border border-success/30 text-success hover:bg-success/5 text-sm py-2"
                    >
                        סיום תוכנית
                    </button>
                    <button
                        onClick={async () => {
                            if (confirm('האם אתה בטוח שברצונך לבטל את התוכנית?')) {
                                await updateProgramStatus(programState.id, 'cancelled');
                                setProgramState(prev => ({ ...prev, status: 'paused' as const }));
                            }
                        }}
                        className="btn bg-surface border border-error/30 text-error hover:bg-error/5 text-sm py-2"
                    >
                        ביטול
                    </button>
                </div>
            )}

            {/* Sessions List */}
            <div>
                <h3 className="text-lg font-bold text-text-primary mb-4">היסטוריית מפגשים</h3>
                {loadingSessions ? (
                    <SkeletonSessionList count={2} />
                ) : sessions.length === 0 ? (
                    <EmptyState
                        icon={Calendar}
                        title="טרם תועדו מפגשים"
                        description="הוסף את המפגש הראשון כדי להתחיל לעקוב אחר ההתקדמות בתוכנית."
                        actionLabel="תיעוד מפגש ראשון"
                        onAction={() => navigate(`/programs/${programState.id}/sessions/new`)}
                        color="warning"
                    />
                ) : (
                    <div className="space-y-4">
                        {sessions.map((session) => (
                            <SessionCard
                                key={session.id}
                                session={session}
                                clientFirstName={clientFirstName}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Session Checkout Modal */}
            {checkoutSession && (
                <SessionCheckoutModal
                    isOpen={!!checkoutSession}
                    onClose={() => setCheckoutSession(null)}
                    session={checkoutSession}
                    clientFirstName={clientFirstName}
                    dogName={clientName.split(' ').pop() || clientFirstName}
                    programName={programState.program_name}
                    sessionNumber={programState.sessions_completed}
                    totalSessions={programState.sessions_included}
                />
            )}
        </div>
    );
}
