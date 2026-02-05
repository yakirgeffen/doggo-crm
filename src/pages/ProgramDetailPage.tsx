import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, CheckCircle, Mail, Clock, History, Calendar, CreditCard, ExternalLink, Share2, FileText, MessageCircle } from 'lucide-react';
import { supabase, updateProgramStatus } from '../lib/supabase';
import { useIntegrations } from '../hooks/useIntegrations';
import { type Program, type Session } from '../types';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { EmailComposer } from '../components/EmailComposer';
import { EmptyState } from '../components/EmptyState';
import { ExtendProgramModal } from '../components/ExtendProgramModal';
import { PageHeader } from '../components/PageHeader';

interface ProgramWithClient extends Program {
    clients: {
        id: string;
        full_name: string;
        primary_dog_name: string;
        email: string;
        phone: string | null;
        notes: string | null;
    };
}

export function ProgramDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [program, setProgram] = useState<ProgramWithClient | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEmailOpen, setIsEmailOpen] = useState(false);

    // Payment State
    const { generatePaymentLink, loading: generatingLink } = useIntegrations();
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

    // Extend Modal State
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);

    const handleExtendProgram = async (additionalSessions: number, additionalPrice: number) => {
        if (!program) return;

        const newSessionsIncluded = (program.sessions_included || 0) + additionalSessions;
        const newPrice = (program.price || 0) + additionalPrice;

        // If we add price, we might want to reset payment status to 'pending' if it was 'paid'
        // But simpler logic for now: just update fields. User can manually manage payment status if needed, 
        // OR we set it to 'pending' if price increased significantly?
        // Let's stick to "Grounded" - don't automate too much. Just update numbers.
        // Wait, if I add price, the system needs to know it's unpaid. 
        // Let's set payment_status to 'pending' if additionalPrice > 0.

        const updates: any = {
            sessions_included: newSessionsIncluded,
            price: newPrice,
            status: 'active' // Reactivate if it was completed
        };

        if (additionalPrice > 0) {
            updates.payment_status = 'pending';
        }

        const { error } = await supabase
            .from('programs')
            .update(updates)
            .eq('id', program.id);

        if (error) {
            console.error('Error extending program:', error);
            // alert('Error extending program'); // using toast would be better but simple alert for critical failure is ok for now or we rely on the modal to handle error? 
            // The modal calls this confirm. 
            // We should reload or update local state.
        } else {
            // Optimistic update or reload
            window.location.reload();
        }
    };

    useEffect(() => {
        if (id) fetchProgramData();
    }, [id]);

    const fetchProgramData = async () => {
        setLoading(true);
        const [progRes, sessRes] = await Promise.all([
            // Fetch client notes as well
            supabase.from('programs').select('*, clients(id, full_name, primary_dog_name, email, phone, notes)').eq('id', id!).single(),
            supabase.from('sessions').select('*').eq('program_id', id!).order('session_date', { ascending: false })
        ]);

        if (progRes.data) {
            setProgram(progRes.data as any);
        }
        if (sessRes.data) setSessions(sessRes.data);
        setLoading(false);
    };

    // Sticky Note Logic
    const [stickyNote, setStickyNote] = useState('');
    const [isNoteDirty, setIsNoteDirty] = useState(false);
    const [savingNote, setSavingNote] = useState(false);

    useEffect(() => {
        if (program?.clients?.notes) {
            setStickyNote(program.clients.notes);
        }
    }, [program]);

    const handleSaveNote = async () => {
        if (!program) return;
        setSavingNote(true);
        const { error } = await supabase
            .from('clients')
            .update({ notes: stickyNote })
            .eq('id', program.clients.id);

        setSavingNote(false);
        if (!error) {
            setIsNoteDirty(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-[var(--color-text-muted)]">Loading program...</div>;
    if (!program) return <div className="p-8 text-center text-[var(--color-text-muted)]">Program not found.</div>;

    const progressPercentage = program.program_type === 'fixed_sessions' && program.sessions_included
        ? Math.min(100, (program.sessions_completed / program.sessions_included) * 100)
        : 0;

    return (
        <div className="animate-fade-in max-w-5xl mx-auto pb-12">
            {/* Header Section */}
            <PageHeader
                title={program.program_name}
                subtitle={
                    <Link to={`/clients/${program.clients.id}`} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors flex items-center gap-1.5 text-sm font-medium">
                        {program.clients.full_name} • {program.clients.primary_dog_name}
                    </Link>
                }
                backUrl="/programs"
                actions={
                    program.status === 'active' && (
                        <>
                            <button
                                onClick={async () => {
                                    if (confirm('האם לסמן את התוכנית כהושלמה?')) {
                                        await updateProgramStatus(id!, 'completed');
                                        window.location.reload();
                                    }
                                }}
                                className="btn bg-white border border-green-200 text-green-700 hover:bg-green-50 text-sm py-2"
                            >
                                <CheckCircle size={16} className="ml-2" />
                                סיום תוכנית
                            </button>
                            <button
                                onClick={async () => {
                                    if (confirm('האם אתה בטוח שברצונך לבטל את התוכנית?')) {
                                        await updateProgramStatus(id!, 'cancelled');
                                        window.location.reload();
                                    }
                                }}
                                className="btn bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm py-2"
                            >
                                ביטול
                            </button>
                        </>
                    )
                }
            />

            {/* Sticky Note (Client Context) */}
            <div className="mb-8">
                <div className="bg-yellow-50/50 border border-yellow-100 rounded-xl p-4 shadow-sm relative group transition-all focus-within:ring-2 focus-within:ring-yellow-200/50">
                    <div className="flex justify-between items-start mb-2">
                        <label className="text-xs font-bold text-yellow-800 uppercase tracking-widest flex items-center gap-1.5">
                            📌 פתק לקוח (משותף לכל התוכניות)
                        </label>
                        {isNoteDirty && (
                            <button
                                onClick={handleSaveNote}
                                disabled={savingNote}
                                className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold hover:bg-yellow-200 transition-colors animate-fade-in"
                            >
                                {savingNote ? 'שומר...' : 'שמור שינויים'}
                            </button>
                        )}
                    </div>
                    <textarea
                        value={stickyNote}
                        onChange={(e) => {
                            setStickyNote(e.target.value);
                            setIsNoteDirty(true);
                        }}
                        placeholder="רשום כאן דגשים קבועים ללקוח (למשל: קוד לדלת, רגישויות, שעות מועדפות...)"
                        className="w-full bg-transparent border-none p-0 text-[var(--color-text-main)] placeholder-yellow-800/30 resize-none focus:ring-0 min-h-[60px] text-sm leading-relaxed"
                    />
                </div>
            </div>

            {/* Stats Grid (Flat Cards) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="flat-card p-4">
                    <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1">סטטוס</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${program.status === 'active' ? 'bg-green-100 text-green-800' :
                        program.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        {program.status === 'active' ? 'פעיל' : program.status === 'completed' ? 'הושלם' : 'מבוטל'}
                    </span>
                </div>
                <div className="flat-card p-4">
                    <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1">סוג תוכנית</span>
                    <span className="font-bold text-[var(--color-text-main)]">
                        {program.program_type === 'fixed_sessions' ? 'חבילה קבועה' : 'מתמשך'}
                    </span>
                </div>
                <div className="flat-card p-4">
                    <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1">התקדמות</span>
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-[var(--color-text-main)] text-lg min-w-[3ch] text-right">{Math.round(progressPercentage)}%</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${program.status === 'completed' ? 'bg-gradient-to-r from-green-400 to-emerald-600' :
                                    program.status === 'paused' ? 'bg-gray-400' :
                                        'bg-gradient-to-r from-blue-500 to-indigo-600'
                                    }`}
                                style={{ width: `${Math.min(100, progressPercentage)}%` }}
                            />
                        </div>
                    </div>
                </div>
                <div className="flat-card p-4 relative group">
                    <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide block mb-1">מפגשים</span>
                    <span className="text-xl font-bold text-[var(--color-text-main)]" dir="ltr">
                        {program.sessions_completed} <span className="text-[var(--color-text-muted)] text-sm font-normal">/ {program.sessions_included || '∞'}</span>
                    </span>
                    {program.program_type === 'fixed_sessions' && (
                        <button
                            onClick={() => setIsExtendModalOpen(true)}
                            className="absolute top-3 left-3 w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-100 hover:scale-110 shadow-sm"
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
                currentSessions={program.sessions_included}
                programName={program.program_name}
            />



            {/* Payment & Actions Section */}
            <div className="mb-8">
                <div className={`flat-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 ${program.payment_status === 'paid' ? 'border-l-green-500 bg-green-50/50' :
                    program.payment_status === 'pending' ? 'border-l-orange-400 bg-orange-50/30' :
                        'border-l-red-500 bg-red-50/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                    }`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${program.payment_status === 'paid' ? 'bg-green-100 text-green-600' :
                            program.payment_status === 'pending' ? 'bg-orange-100 text-orange-600' :
                                'bg-red-100 text-red-600 animate-pulse'
                            }`}>
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-[var(--color-text-main)] flex items-center gap-2">
                                סטטוס תשלום: {program.payment_status === 'paid' ? 'שולם ✅' : program.payment_status === 'pending' ? 'ממתין לתשלום ⏳' : 'לא שולם'}
                            </h3>
                            {program.price && (
                                <p className="text-[var(--color-text-muted)] font-mono text-lg font-bold">
                                    ₪{program.price}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {program.payment_status === 'paid' && program.invoice_pdf_url && (
                            <a
                                href={program.invoice_pdf_url}
                                target="_blank"
                                rel="noreferrer"
                                className="btn bg-white border border-[var(--color-border)] text-[var(--color-text-main)] flex items-center gap-2"
                            >
                                <FileText size={18} />
                                צפה בחשבונית
                            </a>
                        )}

                        {program.payment_status !== 'paid' && (
                            <div className="flex items-center gap-2">
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(
                                        `היי ${program.clients.full_name.split(' ')[0]}, תזכורת ידידותית לגבי הסדרת התשלום בסך ₪${program.price} עבור ${program.program_name}${program.greeninvoice_invoice_number ? ` (חשבונית #${program.greeninvoice_invoice_number})` : ''}. תודה! 🙏`
                                    )}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 flex items-center gap-2"
                                >
                                    <MessageCircle size={18} />
                                    <span className="hidden sm:inline">שלח תזכורת</span>
                                </a>
                                {!paymentUrl ? (
                                    <button
                                        onClick={async () => {
                                            if (!program.price) return alert('No price set for this program');

                                            const res = await generatePaymentLink({
                                                description: `תשלום עבור תוכנית: ${program.program_name}`,
                                                amount: program.price,
                                                clientName: program.clients.full_name,
                                                clientEmail: program.clients.email,
                                                clientPhone: program.clients.phone || '',
                                                currency: program.currency || 'ILS'
                                            });

                                            if (res.success && res.url) {
                                                setPaymentUrl(res.url);
                                                // Optimistic update to pending
                                                await supabase.from('programs').update({
                                                    payment_status: 'pending',
                                                    payment_link_id: res.id
                                                }).eq('id', program.id);

                                                setProgram(prev => prev ? ({ ...prev, payment_status: 'pending' }) : null);
                                            } else {
                                                alert(res.error || 'Failed to generate link');
                                            }
                                        }}
                                        disabled={generatingLink || !program.price}
                                        className="btn btn-primary shadow-md shadow-orange-500/20 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-orange-600 text-white"
                                    >
                                        {generatingLink ? 'המערכת מייצרת קישור...' : '💳 צור קישור לתשלום'}
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 animate-fade-in">
                                        <a
                                            href={`https://wa.me/?text=${encodeURIComponent(`היי ${program.clients.full_name.split(' ')[0]}, הנה הקישור לתשלום עבור ${program.program_name}: ${paymentUrl}`)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn bg-[#25D366] text-white hover:bg-[#128C7E] border-none shadow-sm flex items-center gap-2"
                                        >
                                            <Share2 size={18} />
                                            שלח בוואטסאפ
                                        </a>
                                        <a
                                            href={paymentUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn btn-secondary border-orange-200 text-orange-700 hover:bg-orange-50"
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Content: Sessions History (Now 2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-[var(--color-text-main)] flex items-center gap-2">
                            <History size={20} className="text-[var(--color-text-muted)]" />
                            היסטוריית מפגשים
                        </h2>
                        <Link to={`/programs/${id}/sessions/new`} className="btn btn-primary text-sm py-2 px-4">
                            <Plus size={16} className="ml-2" />
                            תיעוד מפגש חדש
                        </Link>
                    </div>

                    {sessions.length === 0 ? (
                        <EmptyState
                            icon={Calendar}
                            title="טרם תועדו מפגשים"
                            description="הוסף את המפגש הראשון כדי להתחיל לעקוב אחר ההתקדמות בתוכנית."
                            actionLabel="תיעוד מפגש ראשון"
                            onAction={() => navigate(`/programs/${program.id}/sessions/new`)}
                            color="orange"
                        />
                    ) : (
                        <div className="space-y-4">
                            {sessions.map((session) => (
                                <div key={session.id} className="flat-card p-5 hover:border-[var(--color-primary)] transition-colors group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center w-12 shrink-0">
                                                <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase leading-none mb-1">
                                                    {new Date(session.session_date).toLocaleDateString('en-US', { month: 'short' })}
                                                </div>
                                                <div className="text-xl font-black text-[var(--color-text-main)] leading-none">
                                                    {new Date(session.session_date).getDate()}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="font-bold text-[var(--color-text-main)]">מפגש אילוף</div>
                                                <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                                                    <Clock size={12} />
                                                    {new Date(session.session_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>

                                        {session.next_session_date && (
                                            <div className="text-xs font-medium bg-[var(--color-accent)] text-[var(--color-accent-text)] px-2.5 py-1 rounded-md flex items-center gap-1.5">
                                                <Calendar size={12} />
                                                <span>הבא: {new Date(session.next_session_date).toLocaleDateString('he-IL')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {session.session_notes && (
                                        <div className="text-sm text-[var(--color-text-main)] whitespace-pre-line leading-relaxed mb-3 pl-16">
                                            {session.session_notes}
                                        </div>
                                    )}

                                    {session.homework && (
                                        <div className="ml-16 bg-orange-50/50 p-3 rounded-lg border border-orange-100 flex gap-3">
                                            <CheckCircle size={16} className="text-orange-400 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="text-xs font-bold text-orange-800 uppercase block mb-0.5">שיעורי בית</span>
                                                <span className="text-sm text-orange-900">{session.homework}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Footer */}
                                    <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex justify-end">
                                        <a
                                            href={`https://wa.me/?text=${encodeURIComponent(
                                                `היי ${program?.clients.full_name.split(' ')[0]}! 👋\n` +
                                                `סיכום מפגש (${new Date(session.session_date).toLocaleDateString('he-IL')}):\n\n` +
                                                `${session.session_notes || ''}\n\n` +
                                                (session.homework ? `📝 *שיעורי בית:*\n${session.homework}\n\n` : '') +
                                                (session.next_session_date ? `נתראה במפגש הבא ב-${new Date(session.next_session_date).toLocaleDateString('he-IL')}! 🐕` : 'נתראה!')
                                            )}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1.5 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            <MessageCircle size={14} />
                                            שתף בוואטסאפ
                                        </a>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar: Activity & Actions */}
                <div className="space-y-6">
                    <div className="flat-card p-5">
                        <button
                            onClick={() => setIsEmailOpen(true)}
                            className="btn btn-secondary w-full justify-start text-sm"
                        >
                            <Mail size={16} className="ml-3 text-[var(--color-text-muted)]" />
                            שלח סיכום במייל
                        </button>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">פעילות אחרונה</h3>
                        <div className="flat-card p-0 overflow-hidden">
                            <ActivityTimeline entityType="program" entityId={id} />
                        </div>
                    </div>
                </div>
            </div>

            <EmailComposer
                isOpen={isEmailOpen}
                onClose={() => setIsEmailOpen(false)}
                clientEmail={program.clients.email}
                clientName={program.clients.full_name}
                dogName={program.clients.primary_dog_name}
                entityType="program"
                entityId={program.id}
            />
        </div >
    );
}
