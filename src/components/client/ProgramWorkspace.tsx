import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plus, CreditCard, ExternalLink, Share2, FileText, MessageCircle, Calendar, Banknote } from 'lucide-react';
import { supabase, updateProgramStatus, logActivity } from '../../lib/supabase';
import { useIntegrations } from '../../hooks/useIntegrations';
import type { Program, Session } from '../../types';
import { SessionCard } from './SessionCard';
import { EmptyState } from '../EmptyState';
import { SkeletonSessionList } from '../Skeleton';
import { Spinner } from '../Spinner';
import { useToast } from '../../context/toast-context';
import { ExtendProgramModal } from '../ExtendProgramModal';
import { SessionCheckoutModal } from '../SessionCheckoutModal';
import { SendInvoiceButton } from './SendInvoiceButton';
import { RecurringScheduleModal } from '../RecurringScheduleModal';
import { ProgramNote } from './ProgramNote';

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
    const [isRecurringOpen, setIsRecurringOpen] = useState(false);
    const [programState, setProgramState] = useState(program);

    // Session checkout modal
    const [checkoutSession, setCheckoutSession] = useState<Session | null>(null);
    const [markingPaid, setMarkingPaid] = useState(false);

    // Inline confirmation state for program-status actions (replaces native confirm())
    const [pendingAction, setPendingAction] = useState<'complete' | 'cancel' | null>(null);
    const [actionInFlight, setActionInFlight] = useState(false);

    useEffect(() => {
        setProgramState(program);
    }, [program]);

    const fetchSessions = useCallback(async () => {
        setLoadingSessions(true);
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('program_id', program.id)
            .order('session_date', { ascending: false });

        if (error) console.error('Error fetching sessions:', error);
        if (data) setSessions(data);
        setLoadingSessions(false);
    }, [program.id]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    // Auto-open checkout modal if we came from NewSessionPage with a freshly created session
    useEffect(() => {
        const state = location.state as { newSession?: Session } | null;
        if (state?.newSession && state.newSession.program_id === program.id) {
            setCheckoutSession(state.newSession);
            fetchSessions(); // refresh to include the new session
            // Clear the state to prevent re-opening on re-render
            window.history.replaceState({}, '');
        }
    }, [location.state, program.id, fetchSessions]);

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
            await logActivity(
                'program',
                programState.id,
                'extended',
                `הוספו ${additionalSessions} מפגשים${additionalPrice > 0 ? ` (תוספת תשלום: ${additionalPrice})` : ''}`
            );
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
                            title="הוספת מפגשים"
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
                            rel="noopener noreferrer"
                            className="btn bg-surface border border-border text-text-primary flex items-center gap-2"
                        >
                            <FileText size={18} />
                            צפה בחשבונית
                        </a>
                    )}

                    <SendInvoiceButton
                        programId={programState.id}
                        programName={programState.program_name}
                        price={programState.price}
                        currency={programState.currency || 'ILS'}
                        clientName={clientName}
                        clientEmail={clientEmail || null}
                        clientPhone={clientPhone}
                        sumitInvoiceDocumentId={programState.sumit_invoice_document_id}
                        onInvoiceSent={() => setProgramState(prev => ({ ...prev }))}
                    />

                    {programState.payment_status !== 'paid' && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <a
                                href={(() => {
                                    const invoiceRef = programState.sumit_invoice_document_number
                                        ? ` (חשבונית #${programState.sumit_invoice_document_number})`
                                        : programState.legacy_morning_invoice_number
                                            ? ` (חשבונית #${programState.legacy_morning_invoice_number})`
                                            : '';
                                    const text = `היי ${clientFirstName}, תזכורת ידידותית לגבי הסדרת התשלום בסך ₪${programState.price} עבור ${programState.program_name}${invoiceRef}. תודה! 🙏`;
                                    return `https://wa.me/?text=${encodeURIComponent(text)}`;
                                })()}
                                target="_blank"
                                rel="noopener noreferrer"
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
                                        await logActivity('program', programState.id, 'payment_marked_paid', 'התוכנית סומנה כשולמה');
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
                                        <Spinner size="sm" />
                                        <span>שומרים...</span>
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
                                            await logActivity(
                                                'program',
                                                programState.id,
                                                'payment_link_generated',
                                                `נוצר קישור לתשלום (סכום: ${programState.price} ${programState.currency || 'ILS'})`
                                            );

                                            setProgramState(prev => ({ ...prev, payment_status: 'pending' as const }));
                                        } else {
                                            showToast(res.error || 'שגיאה ביצירת קישור', 'error');
                                        }
                                    }}
                                    disabled={generatingLink || !programState.price}
                                    className="btn btn-primary shadow-md bg-accent hover:bg-accent/90 border-accent text-white"
                                >
                                    {generatingLink ? 'המערכת מייצרת קישור...' : '💳 יצירת קישור לתשלום'}
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 animate-fade-in">
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(`היי ${clientFirstName}, הנה הקישור לתשלום עבור ${programState.program_name}: ${paymentUrl}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn bg-[#25D366] text-white hover:bg-[#128C7E] border-none shadow-soft flex items-center gap-2"
                                    >
                                        <Share2 size={18} />
                                        שלח בוואטסאפ
                                    </a>
                                    <a
                                        href={paymentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
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
                    {pendingAction === null ? (
                        <>
                            <Link
                                to={`/programs/${programState.id}/sessions/new`}
                                state={{ openCheckout: true, clientFirstName, dogName: clientName.split(' ')[0], programName: programState.program_name }}
                                className="btn btn-primary text-sm py-2 px-4"
                            >
                                <Plus size={16} className="ms-2" />
                                תיעוד מפגש חדש
                            </Link>
                            <button
                                onClick={() => setPendingAction('complete')}
                                className="btn bg-surface border border-success/30 text-success hover:bg-success/5 text-sm py-2"
                            >
                                סיום תוכנית
                            </button>
                            <button
                                onClick={() => setPendingAction('cancel')}
                                className="btn bg-surface border border-error/30 text-error hover:bg-error/5 text-sm py-2"
                            >
                                ביטול
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-3 w-full bg-surface border border-border rounded-lg px-4 py-3">
                            <span className="text-sm text-text-primary">
                                {pendingAction === 'complete'
                                    ? 'האם לסמן את התוכנית כהושלמה?'
                                    : 'לבטל את התוכנית? פעולה זו לא ניתנת לביטול.'}
                            </span>
                            <div className="flex items-center gap-2 ms-auto">
                                <button
                                    disabled={actionInFlight}
                                    onClick={async () => {
                                        setActionInFlight(true);
                                        try {
                                            if (pendingAction === 'complete') {
                                                const { error } = await updateProgramStatus(programState.id, 'completed');
                                                if (error) throw error;
                                                setProgramState(prev => ({ ...prev, status: 'completed' as const }));
                                                showToast('התוכנית סומנה כהושלמה', 'success');
                                            } else {
                                                const { error } = await updateProgramStatus(programState.id, 'paused');
                                                if (error) throw error;
                                                setProgramState(prev => ({ ...prev, status: 'paused' as const }));
                                                showToast('התוכנית בוטלה', 'success');
                                            }
                                            setPendingAction(null);
                                        } catch {
                                            showToast('שגיאה בעדכון התוכנית', 'error');
                                        } finally {
                                            setActionInFlight(false);
                                        }
                                    }}
                                    className={`btn text-sm py-1.5 px-3 ${pendingAction === 'complete' ? 'bg-success/10 border border-success/30 text-success' : 'bg-error/10 border border-error/30 text-error'}`}
                                >
                                    {actionInFlight ? '...' : 'אישור'}
                                </button>
                                <button
                                    disabled={actionInFlight}
                                    onClick={() => setPendingAction(null)}
                                    className="btn bg-surface border border-border text-text-secondary text-sm py-1.5 px-3"
                                >
                                    ביטול
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Program Notes */}
            <ProgramNote programId={programState.id} initialNote={programState.notes} />

            {/* Sessions List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text-primary">היסטוריית מפגשים</h3>
                    {programState.program_type === 'fixed_sessions' && programState.sessions_included && programState.sessions_included > 0 && (
                        <button
                            onClick={() => setIsRecurringOpen(true)}
                            className="text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                            title="קבע את כל המפגשים בחבילה במכה אחת"
                        >
                            <Calendar size={14} />
                            תזמן את כל החבילה
                        </button>
                    )}
                </div>
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
                                programName={programState.program_name}
                                onChanged={fetchSessions}
                            />
                        ))}
                    </div>
                )}
            </div>

            <RecurringScheduleModal
                isOpen={isRecurringOpen}
                onClose={() => setIsRecurringOpen(false)}
                onScheduled={fetchSessions}
                programId={programState.id}
                programName={programState.program_name}
                suggestedCount={Math.max(1, (programState.sessions_included ?? 8) - programState.sessions_completed)}
            />

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
