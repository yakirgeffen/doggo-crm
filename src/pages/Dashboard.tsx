import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { type Program } from '../types';
import { Link } from 'react-router-dom';
import { Users, Calendar, AlertCircle, DollarSign, CheckCircle, Plus, ChevronLeft } from 'lucide-react';

interface DashboardStats {
    activeClients: number;
    activePrograms: number;
    sessionsThisMonth: number;
    pendingPayment: number;
}

interface ProgramWithClient extends Program {
    clients: {
        full_name: string;
        primary_dog_name: string;
    };
}

export function Dashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        activeClients: 0,
        activePrograms: 0,
        sessionsThisMonth: 0,
        pendingPayment: 0
    });

    const [nearingCompletion, setNearingCompletion] = useState<ProgramWithClient[]>([]);
    const [unpaidPrograms, setUnpaidPrograms] = useState<ProgramWithClient[]>([]);
    const [todaysSessions, setTodaysSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Fetch Stats & Today's Sessions Parallel
        const [
            { count: clientCount },
            { count: programCount },
            { count: sessionCount },
            { count: paymentCount },
            { data: todayData }
        ] = await Promise.all([
            supabase.from('clients').select('*', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('sessions').select('*', { count: 'exact', head: true }).gte('session_date', startOfMonth.toISOString()),
            supabase.from('programs').select('*', { count: 'exact', head: true }).eq('payment_status', 'pending'),
            supabase.from('sessions')
                .select('*, programs(id, program_name, clients(full_name, primary_dog_name))')
                .gte('session_date', startOfDay.toISOString())
                .lt('session_date', endOfDay.toISOString())
                .order('session_date', { ascending: true })
        ]);

        setStats({
            activeClients: clientCount || 0,
            activePrograms: programCount || 0,
            sessionsThisMonth: sessionCount || 0,
            pendingPayment: paymentCount || 0
        });

        if (todayData) setTodaysSessions(todayData);

        // 2. Programs Nearing Completion logic
        const { data: activeProgs } = await supabase
            .from('programs')
            .select('*, clients(full_name, primary_dog_name)')
            .eq('status', 'active')
            .eq('program_type', 'fixed_sessions');

        if (activeProgs) {
            const nearing = (activeProgs as any[]).filter(p => {
                if (!p.sessions_included) return false;
                return (p.sessions_completed / p.sessions_included) >= 0.8;
            });
            setNearingCompletion(nearing);
        }

        // 3. Unpaid Programs
        const { data: unpaid } = await supabase
            .from('programs')
            .select('*, clients(full_name, primary_dog_name)')
            .eq('payment_status', 'pending')
            .limit(10);

        if (unpaid) setUnpaidPrograms(unpaid as any[]);

        setLoading(false);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64 text-[var(--color-text-muted)]">
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                <span>טוען לוח בקרה...</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-24 md:pb-12">
            <div>
                <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-[var(--color-text-main)] mb-1">לוח בקרה</h1>
                        <p className="text-[var(--color-text-muted)] text-sm">ברוך הבא! הנה מה שקורה היום.</p>
                    </div>
                    {/* Dark Mode Toggle or Profile could go here */}
                </header>

                {/* QUICK ACTIONS ROW */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <Link to="/clients/new" className="flex flex-col items-center justify-center p-4 bg-white border border-[var(--color-border)] rounded-xl shadow-sm hover:border-[var(--color-primary)] hover:shadow-md transition-all group">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Users size={20} />
                        </div>
                        <span className="text-xs font-bold text-[var(--color-text-main)]">לקוח חדש</span>
                    </Link>
                    <Link to="/programs/new" className="flex flex-col items-center justify-center p-4 bg-white border border-[var(--color-border)] rounded-xl shadow-sm hover:border-[var(--color-primary)] hover:shadow-md transition-all group">
                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <CheckCircle size={20} />
                        </div>
                        <span className="text-xs font-bold text-[var(--color-text-main)]">תוכנית חדשה</span>
                    </Link>
                    {/* Primary Action */}
                    <Link to="/calendar" className="flex flex-col items-center justify-center p-4 bg-[var(--color-primary)] text-white rounded-xl shadow-lg shadow-green-900/20 hover:bg-[var(--color-primary-dark)] hover:-translate-y-0.5 transition-all">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-2">
                            <Plus size={24} />
                        </div>
                        <span className="text-xs font-bold">תיעוד מפגש</span>
                    </Link>
                </div>

                {/* TODAY'S MISSION */}
                <div className="mb-8">
                    <div className="mb-4 flex items-center gap-2">
                        <div className="p-1.5 bg-green-50 rounded-md text-green-700 border border-green-100">
                            <Calendar size={16} />
                        </div>
                        <h2 className="text-lg font-bold text-[var(--color-text-main)]">משימות להיום</h2>
                    </div>

                    {todaysSessions.length === 0 ? (
                        <div className="flat-card p-6 flex flex-col items-center text-center border-dashed">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-2 text-gray-400">
                                <Calendar size={20} />
                            </div>
                            <p className="text-sm text-[var(--color-text-muted)] font-medium">אין מפגשים מתוכננים להיום.</p>
                            <Link to="/calendar" className="text-xs text-[var(--color-primary)] font-bold mt-2 hover:underline">
                                קבע מפגש חדש &larr;
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {todaysSessions.map((session) => (
                                <Link
                                    key={session.id}
                                    to={`/programs/${session.programs.id}`}
                                    className="flat-card p-4 flex items-center justify-between hover:border-[var(--color-primary)] transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[var(--color-accent)] text-[var(--color-primary)] flex items-center justify-center font-bold text-sm">
                                            {new Date(session.session_date).getHours()}:{new Date(session.session_date).getMinutes().toString().padStart(2, '0')}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[var(--color-text-main)] group-hover:text-[var(--color-primary)] transition-colors">
                                                {session.programs.clients.full_name}
                                            </h3>
                                            <p className="text-xs text-[var(--color-text-muted)]">
                                                {session.programs.clients.primary_dog_name} • {session.programs.program_name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-[var(--color-text-muted)]">
                                        <ChevronLeft size={18} className="rtl:rotate-180" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* KPI Section - Condensed */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
                    <div className="flat-card p-3 flex flex-col items-center text-center">
                        <span className="text-2xl font-black text-[var(--color-text-main)]">{stats.activeClients}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">לקוחות</span>
                    </div>
                    <div className="flat-card p-3 flex flex-col items-center text-center">
                        <span className="text-2xl font-black text-[var(--color-text-main)]">{stats.activePrograms}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">תוכניות</span>
                    </div>
                    <div className="flat-card p-3 flex flex-col items-center text-center">
                        <span className="text-2xl font-black text-[var(--color-text-main)]">{stats.sessionsThisMonth}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase">מפגשי חודש</span>
                    </div>
                    <div className="flat-card p-3 flex flex-col items-center text-center border-red-100 bg-red-50/10">
                        <span className="text-2xl font-black text-red-600">{stats.pendingPayment}</span>
                        <span className="text-[10px] text-red-600/80 font-bold uppercase">גבייה</span>
                    </div>
                </div>
            </div>

            {/* Reports Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Report: Nearing Completion */}
                <div>
                    <div className="mb-4 flex items-center gap-2">
                        <div className="p-1.5 bg-orange-50 rounded-md text-orange-700 border border-orange-100">
                            <AlertCircle size={16} />
                        </div>
                        <h2 className="text-lg font-bold text-[var(--color-text-main)]">דורש תשומת לב</h2>
                    </div>

                    <div className="flat-card p-0 overflow-hidden bg-white">
                        {nearingCompletion.length === 0 ? (
                            <div className="p-8 text-center text-[var(--color-text-muted)] text-sm">אין תוכניות קרובות לסיום.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead className="bg-[var(--color-bg-app)] border-b border-[var(--color-border)]">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">תוכנית</th>
                                            <th className="px-6 py-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider w-1/3">התקדמות</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]">
                                        {nearingCompletion.map(p => (
                                            <tr key={p.id} className="hover:bg-[var(--color-bg-app)]/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <Link to={`/programs/${p.id}`} className="block font-bold text-[var(--color-text-main)] hover:text-[var(--color-primary)] transition-colors mb-0.5">
                                                        {p.program_name}
                                                    </Link>
                                                    <div className="text-xs text-[var(--color-text-muted)] font-medium flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 bg-stone-300 rounded-full"></span>
                                                        {p.clients.full_name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex justify-between items-center text-[10px] font-bold text-[var(--color-text-muted)]">
                                                            <span dir="ltr">{p.sessions_completed}/{p.sessions_included}</span>
                                                            <span>{Math.round((p.sessions_completed / (p.sessions_included || 1)) * 100)}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-[var(--color-bg-app)] rounded-full overflow-hidden">
                                                            <div className="h-full bg-orange-400 rounded-full" style={{ width: `${(p.sessions_completed / (p.sessions_included || 1)) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Report: Unpaid Categories */}
                <div>
                    <div className="mb-4 flex items-center gap-2">
                        <div className="p-1.5 bg-red-50 rounded-md text-red-700 border border-red-100">
                            <DollarSign size={16} />
                        </div>
                        <h2 className="text-lg font-bold text-[var(--color-text-main)]">תשלומים חסרים</h2>
                    </div>

                    <div className="flat-card p-0 overflow-hidden bg-white">
                        {unpaidPrograms.length === 0 ? (
                            <div className="p-8 text-center text-[var(--color-text-muted)] text-sm">אין תשלומים ממתינים.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead className="bg-[var(--color-bg-app)] border-b border-[var(--color-border)]">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">תוכנית</th>
                                            <th className="px-6 py-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">סטטוס</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]">
                                        {unpaidPrograms.map(p => (
                                            <tr key={p.id} className="hover:bg-[var(--color-bg-app)]/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <Link to={`/programs/${p.id}`} className="block font-bold text-[var(--color-text-main)] hover:text-[var(--color-primary)] transition-colors mb-0.5">
                                                        {p.program_name}
                                                    </Link>
                                                    <div className="text-xs text-[var(--color-text-muted)] font-medium flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 bg-stone-300 rounded-full"></span>
                                                        {p.clients.full_name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <span className="bg-red-50 text-red-700 border border-red-100 px-2.5 py-1 rounded-md text-xs font-black inline-flex items-center gap-1">
                                                            <DollarSign size={10} />
                                                            {p.greeninvoice_invoice_number ? `חשבונית #${p.greeninvoice_invoice_number}` : 'לא שולם'}
                                                        </span>
                                                        <ChevronLeft size={16} className="text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
