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

    const { generatePaymentLink, loading: generatingLink } = useIntegrations();
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);

    const handleExtendProgram = async (additionalSessions: number, additionalPrice: number) => {
        if (!program) return;

        const newSessionsIncluded = (program.sessions_included || 0) + additionalSessions;
        const newPrice = (program.price || 0) + additionalPrice;

        const updates: any = {
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
            .eq('id', program.id);

        if (error) {
            console.error('Error extending program:', error);
        } else {
            window.location.reload();
        }
    };

    useEffect(() => {
        if (id) fetchProgramData();
    }, [id]);

    const fetchProgramData = async () => {
        setLoading(true);
        const [progRes, sessRes] = await Promise.all([
            supabase.from('programs').select('*, clients(id, full_name, primary_dog_name, email, phone, notes)').eq('id', id!).single(),
            supabase.from('sessions').select('*').eq('program_id', id!).order('session_date', { ascending: false })
        ]);

        if (progRes.data) {
            setProgram(progRes.data as any);
        }
        if (sessRes.data) setSessions(sessRes.data);
        setLoading(false);
    };

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

    if (loading) return <div className="p-8 text-center text-text-muted">טוען תוכנית...</div>;
    if (!program) return <div className="p-8 text-center text-text-muted">התוכנית לא נמצאה.</div>;

    const progressPercentage = program.program_type === 'fixed_sessions' && program.sessions_included
        ? Math.min(100, (program.sessions_completed / program.sessions_included) * 100)
        : 0;

    return (
        <div className="animate-fade-in max-w-5xl mx-auto pb-12">
            {/* Header Section */}
            <PageHeader
                title={program.program_name}
                subtitle={
                    <Link to={`/clients/${program.clients.id}`} className="text-text-muted hover:text-primary transition-colors flex items-center gap-1.5 text-sm font-medium">
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
                                className="btn bg-surface border border-success/30 text-success hover:bg-success/5 text-sm py-2"
                            >
                                <CheckCircle size={16} className="ms-2" />
                                סיום תוכנית
                            </button>
                            <button
                                onClick={async () => {
                                    if (confirm('האם אתה בטוח שברצונך לבטל את התוכנית?')) {
                                        await updateProgramStatus(id!, 'cancelled');
                                        window.location.reload();
                                    }
                                }}
                                className="btn bg-surface border border-error/30 text-error hover:bg-error/5 text-sm py-2"
                            >
                                ביטול
                            </button>
                        </>
                    )
                }
            />

            {/* Sticky Note (Client Context) */}
            <div className="mb-8">
                <div className="bg-warning/5 border border-warning/15 rounded-xl p-4 shadow-soft relative group transition-all focus-within:ring-2 focus-within:ring-warning/20">
                    <div className="flex justify-between items-start mb-2">
                        <label className="text-xs font-bold text-warning uppercase tracking-widest flex items-center gap-1.5">
                            📌 פתק לקוח (משותף לכל התוכניות)
                        </label>
                        {isNoteDirty && (
                            <button
                                onClick={handleSaveNote}
                                disabled={savingNote}
                                className="text-xs bg-warning/10 text-warning px-3 py-1 rounded-lg font-medium hover:bg-warning/20 transition-colors animate-fade-in"
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
                        className="w-full bg-transparent border-none p-0 text-text-primary placeholder-warning/30 resize-none focus:ring-0 min-h-[60px] text-sm leading-relaxed"
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="flat-card p-4">
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1">סטטוס</span>
                    <span className={`badge ${program.status === 'active' ? 'badge-active' :
                        program.status === 'completed' ? 'badge-completed' :
                            'badge-pending'
                        }`}>
                        {program.status === 'active' ? 'פעיל' : program.status === 'completed' ? 'הושלם' : 'מבוטל'}
                    </span>
                </div>
                <div className="flat-card p-4">
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1">סוג תוכנית</span>
                    <span className="font-bold text-text-primary">
                        {program.program_type === 'fixed_sessions' ? 'חבילה קבועה' : 'מתמשך'}
                    </span>
                </div>
                <div className="flat-card p-4">
                    <span className="text-xs font-medium text-text-muted uppercase tracking-wide block mb-1">התקדמות</span>
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-text-primary text-lg min-w-[3ch] text-right ltr-nums">{Math.round(progressPercentage)}%</span>
                        <div className="flex-1 bg-background rounded-lg h-3 overflow-hidden">
                            <div
                                className={`h-full rounded-lg transition-all duration-1000 ease-out ${program.status === 'completed' ? 'bg-success' :
                                    program.status === 'paused' ? 'bg-text-muted' :
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
                        {program.sessions_completed} <span className="text-text-muted text-sm font-normal">/ {program.sessions_included || '∞'}</span>
                    </span>
                    {program.program_type === 'fixed_sessions' && (
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
                currentSessions={program.sessions_included}
                programName={program.program_name}
            />

            {/* Payment & Actions Section */}
            <div className="mb-8">
                <div className={`flat-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-s-4 ${program.payment_status === 'paid' ? 'border-s-success bg-success/5' :
                    program.payment_status === 'pending' ? 'border-s-warning bg-warning/5' :
                        'border-s-error bg-error/5'
                    }`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${program.payment_status === 'paid' ? 'bg-success/10 text-success' :
                            program.payment_status === 'pending' ? 'bg-warning/10 text-warning' :
                                'bg-error/10 text-error animate-pulse'
                            }`}>
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                                סטטוס תשלום: {program.payment_status === 'paid' ? 'שולם ✅' : program.payment_status === 'pending' ? 'ממתין לתשלום ⏳' : 'לא שולם'}
                            </h3>
                            {program.price && (
                                <p className="text-text-muted font-mono text-lg font-bold ltr-nums">
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
                                className="btn bg-surface border border-border text-text-primary flex items-center gap-2"
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
                                    className="btn bg-success/10 text-success border border-success/20 hover:bg-success/15 flex items-center gap-2"
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
                                        className="btn btn-primary shadow-md bg-accent hover:bg-accent/90 border-accent text-white"
                                    >
                                        {generatingLink ? 'המערכת מייצרת קישור...' : '💳 צור קישור לתשלום'}
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 animate-fade-in">
                                        <a
                                            href={`https://wa.me/?text=${encodeURIComponent(`היי ${program.clients.full_name.split(' ')[0]}, הנה הקישור לתשלום עבור ${program.program_name}: ${paymentUrl}`)}`}
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Content: Sessions History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <History size={20} className="text-text-muted" />
                            היסטוריית מפגשים
                        </h2>
                        <Link to={`/programs/${id}/sessions/new`} className="btn btn-primary text-sm py-2 px-4">
                            <Plus size={16} className="ms-2" />
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
                            color="warning"
                        />
                    ) : (
                        <div className="space-y-4">
                            {sessions.map((session) => (
                                <div key={session.id} className="flat-card p-5 hover:border-primary transition-colors group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center w-12 shrink-0">
                                                <div className="text-xs font-medium text-text-muted uppercase leading-none mb-1">
                                                    {new Date(session.session_date).toLocaleDateString('en-US', { month: 'short' })}
                                                </div>
                                                <div className="text-xl font-bold text-text-primary leading-none ltr-nums">
                                                    {new Date(session.session_date).getDate()}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="font-bold text-text-primary">מפגש אילוף</div>
                                                <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                                                    <Clock size={12} />
                                                    {new Date(session.session_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>

                                        {session.next_session_date && (
                                            <div className="text-xs font-medium bg-accent/10 text-accent px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                                                <Calendar size={12} />
                                                <span>הבא: {new Date(session.next_session_date).toLocaleDateString('he-IL')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {session.session_notes && (
                                        <div className="text-sm text-text-primary whitespace-pre-line leading-relaxed mb-3 ps-16">
                                            {session.session_notes}
                                        </div>
                                    )}

                                    {session.homework && (
                                        <div className="ms-16 bg-accent/5 p-3 rounded-lg border border-accent/10 flex gap-3">
                                            <CheckCircle size={16} className="text-accent/60 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="text-xs font-bold text-accent uppercase block mb-0.5">שיעורי בית</span>
                                                <span className="text-sm text-text-secondary">{session.homework}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Footer */}
                                    <div className="mt-4 pt-4 border-t border-border flex justify-end">
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
                                            className="text-xs font-medium text-success hover:text-success flex items-center gap-1.5 bg-success/10 hover:bg-success/15 px-3 py-1.5 rounded-lg transition-colors"
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
                            <Mail size={16} className="ms-3 text-text-muted" />
                            שלח סיכום במייל
                        </button>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-text-muted uppercase tracking-wide mb-3">פעילות אחרונה</h3>
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
