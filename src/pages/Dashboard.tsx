import { Link } from 'react-router-dom';
import { Users, Calendar, AlertCircle, DollarSign, CheckCircle, Plus, ChevronRight, MessageCircle, PartyPopper } from 'lucide-react';
import { SkeletonKPIGrid } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { IncomingLeads } from '../components/dashboard/IncomingLeads';
import { useDashboard } from '../hooks/useDashboard';

export function Dashboard() {
    const { stats, actionItems, todaysSessions, loading } = useDashboard();

    if (loading) return (
        <div className="space-y-8 animate-fade-in pb-24 lg:pb-12">
            <div>
                <div className="mb-6">
                    <div className="h-7 w-32 bg-border/40 rounded-md skeleton-shimmer mb-2" />
                    <div className="h-4 w-48 bg-border/30 rounded-md skeleton-shimmer" />
                </div>
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="flat-card flex flex-col items-center p-4">
                            <div className="w-10 h-10 bg-border/30 rounded-lg skeleton-shimmer mb-2" />
                            <div className="h-3 w-16 bg-border/30 rounded-md skeleton-shimmer" />
                        </div>
                    ))}
                </div>
                <SkeletonKPIGrid />
            </div>
        </div>
    );

    const isPast = (dateStr: string) => new Date(dateStr) < new Date();

    return (
        <div className="space-y-8 animate-fade-in pb-24 lg:pb-12">
            <div>
                <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[28px] font-bold text-text-primary mb-1">לוח בקרה</h1>
                        <p className="text-text-secondary text-sm">ברוך הבא! הנה מה שקורה היום.</p>
                    </div>
                </header>

                {/* QUICK ACTIONS ROW */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <Link to="/clients/new" className="flat-card flex flex-col items-center justify-center p-4 hover:border-primary transition-all group cursor-pointer">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Users size={20} />
                        </div>
                        <span className="text-xs font-medium text-text-primary">לקוח חדש</span>
                    </Link>
                    <Link to="/programs/new" className="flat-card flex flex-col items-center justify-center p-4 hover:border-primary transition-all group cursor-pointer">
                        <div className="w-10 h-10 bg-accent/10 text-accent rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <CheckCircle size={20} />
                        </div>
                        <span className="text-xs font-medium text-text-primary">תוכנית חדשה</span>
                    </Link>
                    <Link to="/calendar" className="flex flex-col items-center justify-center p-4 bg-primary text-white rounded-xl shadow-card hover:bg-primary-dark transition-all">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                            <Plus size={24} />
                        </div>
                        <span className="text-xs font-medium">תיעוד מפגש</span>
                    </Link>
                </div>

                {/* INCOMING LEADS (only renders if there are new leads) */}
                <IncomingLeads />

                {/* TODAY'S MISSIONS + KPIs side-by-side on desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
                    {/* Today's Missions — takes 3 cols */}
                    <div className="lg:col-span-3">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="p-1.5 bg-success/10 rounded-md text-success border border-success/20">
                                <Calendar size={16} />
                            </div>
                            <h2 className="text-lg font-bold text-text-primary">משימות להיום</h2>
                            {todaysSessions.length > 0 && (
                                <span className="text-xs text-text-muted font-medium">({todaysSessions.length})</span>
                            )}
                        </div>

                        {todaysSessions.length === 0 ? (
                            <div className="flat-card p-6">
                                <EmptyState
                                    icon={Calendar}
                                    title="אין מפגשים מתוכננים להיום"
                                    description="היומן שלך פנוי להיום. תהנה מהחופש או קבע מפגש חדש."
                                    action={
                                        <Link to="/calendar" className="btn btn-sm btn-outline mt-2">
                                            קבע מפגש חדש
                                        </Link>
                                    }
                                />
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {todaysSessions.map((session) => {
                                    const past = isPast(session.session_date);
                                    const clientId = session.programs.clients.id;
                                    const phone = session.programs.clients.phone;
                                    const sessionLabel = session.session_number && session.programs.sessions_included
                                        ? `מפגש ${session.session_number}/${session.programs.sessions_included}`
                                        : null;

                                    return (
                                        <div
                                            key={session.id}
                                            className={`flat-card p-4 flex items-center justify-between group border-r-4 ${past ? 'border-r-border opacity-60' : 'border-r-primary'}`}
                                        >
                                            <Link
                                                to={`/clients/${clientId}?program=${session.programs.id}`}
                                                className="flex items-center gap-3 flex-1 min-w-0"
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium text-sm shrink-0 ${past ? 'bg-border/20 text-text-muted' : 'bg-primary/10 text-primary'}`}>
                                                    {new Date(session.session_date).getHours()}:{new Date(session.session_date).getMinutes().toString().padStart(2, '0')}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                                                        {session.programs.clients.full_name}
                                                    </h3>
                                                    <p className="text-xs text-text-muted truncate">
                                                        {session.programs.clients.primary_dog_name} • {session.programs.program_name}
                                                        {sessionLabel && <span className="text-primary/70 ms-1.5">({sessionLabel})</span>}
                                                    </p>
                                                </div>
                                            </Link>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {phone && !past && (
                                                    <a
                                                        href={`https://wa.me/${phone.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success/20 transition-colors"
                                                        title="שלח הודעת WhatsApp"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <MessageCircle size={14} />
                                                    </a>
                                                )}
                                                <Link to={`/clients/${clientId}?program=${session.programs.id}`} className="text-text-muted">
                                                    <ChevronRight size={18} />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* KPI Grid — takes 2 cols */}
                    <div className="lg:col-span-2">
                        <div className="mb-4 flex items-center gap-2">
                            <h2 className="text-lg font-bold text-text-primary">סיכום</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flat-card p-4 flex flex-col items-center text-center">
                                <span className="text-2xl font-bold text-text-primary">{stats.activeClients}</span>
                                <span className="text-[11px] text-text-muted font-medium uppercase tracking-wide">לקוחות</span>
                            </div>
                            <div className="flat-card p-4 flex flex-col items-center text-center">
                                <span className="text-2xl font-bold text-text-primary">{stats.activePrograms}</span>
                                <span className="text-[11px] text-text-muted font-medium uppercase tracking-wide">תוכניות</span>
                            </div>
                            <div className="flat-card p-4 flex flex-col items-center text-center">
                                <span className="text-2xl font-bold text-text-primary">{stats.sessionsThisMonth}</span>
                                <span className="text-[11px] text-text-muted font-medium uppercase tracking-wide">מפגשי חודש</span>
                            </div>
                            <div className="flat-card p-4 flex flex-col items-center text-center border-error/30">
                                <span className="text-2xl font-bold text-error">{stats.pendingPayment}</span>
                                <span className="text-[11px] text-error/80 font-medium uppercase tracking-wide">גבייה</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* UNIFIED ACTION FEED */}
            <div>
                <div className="mb-4 flex items-center gap-2">
                    <div className="p-1.5 bg-warning/10 rounded-md text-warning border border-warning/20">
                        <AlertCircle size={16} />
                    </div>
                    <h2 className="text-lg font-bold text-text-primary">דורש תשומת לב</h2>
                    {actionItems.length > 0 && (
                        <span className="text-xs text-text-muted font-medium">({actionItems.length})</span>
                    )}
                </div>

                {actionItems.length === 0 ? (
                    <div className="flat-card p-8">
                        <EmptyState
                            icon={PartyPopper}
                            title="הכל מסודר!"
                            description="אין תוכניות קרובות לסיום ואין חובות פתוחים."
                            color="success"
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {actionItems.map(({ type, program: p }, idx) => (
                            <Link
                                key={p.id + type}
                                to={`/clients/${p.clients.id}?program=${p.id}`}
                                className="flat-card p-4 flex items-center gap-3 hover:border-primary transition-colors group animate-fade-in"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${type === 'renewal'
                                    ? 'bg-warning/10 text-warning'
                                    : 'bg-error/10 text-error'
                                    }`}>
                                    {type === 'renewal' ? <AlertCircle size={18} /> : <DollarSign size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm text-text-primary group-hover:text-primary transition-colors truncate">
                                        {p.program_name}
                                    </h3>
                                    <p className="text-xs text-text-muted truncate">
                                        {p.clients.full_name}
                                        <span className="mx-1">•</span>
                                        {type === 'renewal'
                                            ? `${p.sessions_completed}/${p.sessions_included} מפגשים`
                                            : 'ממתין לתשלום'
                                        }
                                    </p>
                                </div>
                                <ChevronRight size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
