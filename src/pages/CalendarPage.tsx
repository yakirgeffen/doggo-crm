import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ExternalLink, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, List, Grid, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { listUpcomingEvents } from '../lib/calendar';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { CalendarGrid } from '../components/CalendarGrid';
import { BookSessionModal } from '../components/BookSessionModal';

interface AgendaItem {
    id: string;
    type: 'internal' | 'external';
    title: string;
    subtitle?: string;
    start: Date;
    end: Date;
    link?: string;
}

export function CalendarPage() {
    const { providerToken } = useAuth();
    // Default to list view on mobile for better usability
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const [viewMode, setViewMode] = useState<'week' | 'list'>(isMobile ? 'list' : 'week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showInternal, setShowInternal] = useState(true);
    const [showExternal, setShowExternal] = useState(true);

    const [items, setItems] = useState<AgendaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Book Session Modal
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [bookPrefillDate, setBookPrefillDate] = useState<string>();
    const [bookPrefillTime, setBookPrefillTime] = useState<string>();

    useEffect(() => {
        fetchAgenda();
    }, [providerToken, currentDate, viewMode]);

    const fetchAgenda = async () => {
        setLoading(true);
        setError(null);
        try {
            const allItems: AgendaItem[] = [];

            const d = new Date(currentDate);
            const day = d.getDay();
            const diff = d.getDate() - day;
            d.setDate(diff);
            d.setHours(0, 0, 0, 0);
            const startRange = d.toISOString();

            const { data: sessions, error: dbError } = await supabase
                .from('sessions')
                .select(`
                    id, 
                    session_date, 
                    programs:program_id (
                        id,
                        program_name,
                        clients (full_name, primary_dog_name)
                    )
                `)
                .gte('session_date', startRange)
                .order('session_date', { ascending: true })
                .limit(100);

            if (dbError) throw dbError;

            if (sessions) {
                type SessionQuery = {
                    id: string;
                    session_date: string;
                    programs: {
                        id: string; // Added id to selection
                        program_name: string;
                        clients: {
                            full_name: string;
                            primary_dog_name: string;
                        }
                    }
                };

                (sessions as unknown as SessionQuery[]).forEach((s) => {
                    const start = new Date(s.session_date);
                    const end = new Date(start.getTime() + 60 * 60 * 1000);

                    allItems.push({
                        id: s.id,
                        type: 'internal',
                        title: `${s.programs.clients.full_name}`,
                        subtitle: `${s.programs.clients.primary_dog_name} • ${s.programs.program_name}`,
                        start: start,
                        end: end,
                        link: `/programs/${s.programs.id}`
                    });
                });
            }

            if (providerToken) {
                try {
                    const googleEvents = await listUpcomingEvents(providerToken);
                    googleEvents.forEach(e => {
                        const startStr = e.start.dateTime || e.start.date;
                        const endStr = e.end.dateTime || e.end.date;
                        if (startStr && endStr) {
                            allItems.push({
                                id: e.id,
                                type: 'external',
                                title: e.summary || 'Google Event',
                                subtitle: 'External Calendar',
                                start: new Date(startStr),
                                end: new Date(endStr),
                            });
                        }
                    });
                } catch (gError) {
                    console.error("Google Calendar Error:", gError);
                    setError("Could not sync Google Calendar. Please re-login.");
                }
            }

            allItems.sort((a, b) => a.start.getTime() - b.start.getTime());
            setItems(allItems);

        } catch (err: any) {
            console.error(err);
            setError("Failed to load schedule");
        } finally {
            setLoading(false);
        }
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentDate(newDate);
    };

    const jumpToday = () => setCurrentDate(new Date());

    const getGridStartDate = () => {
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = d.getDate() - day;
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const filteredItems = items.filter(item => {
        if (item.type === 'internal' && !showInternal) return false;
        if (item.type === 'external' && !showExternal) return false;
        return true;
    });

    const sortAndGroupItems = (items: AgendaItem[]) => {
        const sorted = [...items].sort((a, b) => a.start.getTime() - b.start.getTime());
        const grouped: Record<string, AgendaItem[]> = {};
        sorted.forEach(item => {
            const dateKey = new Date(item.start.getFullYear(), item.start.getMonth(), item.start.getDate()).toISOString();
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(item);
        });
        return grouped;
    };

    const groupedItems = sortAndGroupItems(filteredItems);

    return (
        <div className="animate-fade-in max-w-6xl mx-auto pb-12">

            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-[28px] font-bold text-text-primary mb-1">לוח זמנים</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <button onClick={jumpToday} className="text-sm font-medium text-primary hover:underline">
                            היום
                        </button>
                        <div className="flex items-center bg-surface rounded-lg shadow-soft border border-border p-1">
                            <button onClick={() => navigateWeek('prev')} className="p-1 hover:bg-background rounded-md text-text-muted">
                                <ChevronRight size={20} />
                            </button>
                            <span className="px-3 text-sm font-medium min-w-[100px] text-center text-text-primary">
                                {getGridStartDate().toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })} - {' '}
                                {new Date(new Date(getGridStartDate()).setDate(getGridStartDate().getDate() + 6)).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                            </span>
                            <button onClick={() => navigateWeek('next')} className="p-1 hover:bg-background rounded-md text-text-muted">
                                <ChevronLeft size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Smart Filters */}
                    <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-border shadow-soft">
                        <button
                            onClick={() => setShowInternal(!showInternal)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2
                                ${showInternal
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-text-muted hover:bg-background opacity-60'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${showInternal ? 'bg-primary' : 'bg-text-muted'}`}></span>
                            אימונים
                        </button>
                        <div className="w-px h-4 bg-border"></div>
                        <button
                            onClick={() => setShowExternal(!showExternal)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2
                                ${showExternal
                                    ? 'bg-background text-text-secondary'
                                    : 'text-text-muted hover:bg-background opacity-60'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${showExternal ? 'bg-text-secondary' : 'bg-text-muted'}`}></span>
                            אישי
                        </button>
                    </div>

                    <div className="h-6 w-px bg-border mx-2"></div>

                    <div className="bg-background p-1 rounded-lg border border-border flex">
                        <button
                            onClick={() => setViewMode('week')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'week' ? 'bg-surface shadow-soft text-primary' : 'text-text-muted hover:bg-surface-warm'}`}
                            title="Week View"
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-surface shadow-soft text-primary' : 'text-text-muted hover:bg-surface-warm'}`}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                    </div>

                    <button
                        onClick={fetchAgenda}
                        className="btn btn-secondary text-sm"
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={`ms-2 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {!providerToken && (
                <div className="flat-card bg-warning/10 border-warning/20 p-4 mb-8 flex items-start gap-3">
                    <AlertCircle className="text-warning shrink-0 mt-0.5" size={20} />
                    <div>
                        <h3 className="font-bold text-text-primary">היומן לא מסונכרן</h3>
                        <p className="text-sm text-text-secondary">כדי לראות את האירועים מיומן Google שלך כאן, עליך להתחבר מחדש דרך Google בדף ההתחברות.</p>
                    </div>
                </div>
            )}

            {/* View Rendering */}
            {viewMode === 'week' ? (
                <CalendarGrid
                    startDate={getGridStartDate()}
                    events={filteredItems}
                    onSlotClick={(date, hour) => {
                        const yyyy = date.getFullYear();
                        const mm = String(date.getMonth() + 1).padStart(2, '0');
                        const dd = String(date.getDate()).padStart(2, '0');
                        setBookPrefillDate(`${yyyy}-${mm}-${dd}`);
                        setBookPrefillTime(`${String(hour).padStart(2, '0')}:00`);
                        setIsBookModalOpen(true);
                    }}
                />
            ) : (
                /* Grouped List View */
                <div className="space-y-8 max-w-4xl mx-auto">
                    {filteredItems.length === 0 && !loading ? (
                        <div className="flat-card p-12 text-center text-text-muted">
                            <CalendarIcon size={32} className="mx-auto mb-4 opacity-50" />
                            <p>אין אירועים בטווח המוצג</p>
                        </div>
                    ) : (
                        Object.keys(groupedItems).map(dateKey => {
                            const date = new Date(dateKey);
                            const today = new Date();
                            const tomorrow = new Date(today);
                            tomorrow.setDate(today.getDate() + 1);

                            const isToday = date.toDateString() === today.toDateString();
                            const isTomorrow = date.toDateString() === tomorrow.toDateString();

                            let label = date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
                            if (isToday) label = `היום • ${label}`;
                            else if (isTomorrow) label = `מחר • ${label}`;

                            return (
                                <div key={dateKey}>
                                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 sticky top-0 bg-background py-2 z-10 
                                        ${isToday ? 'text-primary' : 'text-text-primary'}`
                                    }>
                                        {label}
                                    </h3>
                                    <div className="space-y-3">
                                        {groupedItems[dateKey].map(item => (
                                            <div
                                                key={item.id + item.type}
                                                className={`
                                                    relative flex items-stretch gap-4 p-4 rounded-xl border transition-all group
                                                    ${item.type === 'internal'
                                                        ? 'bg-surface border-border hover:border-primary shadow-soft hover:shadow-card'
                                                        : 'bg-surface/60 border-border-light border-dashed hover:border-border'
                                                    }
                                                `}
                                            >
                                                {/* Time Column */}
                                                <div className="w-14 shrink-0 flex flex-col justify-center items-center text-center">
                                                    <span className="text-lg font-bold text-text-primary leading-none ltr-nums">
                                                        {item.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="text-[10px] text-text-muted mt-1 ltr-nums">
                                                        {item.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                {/* Divider */}
                                                <div className={`w-1 rounded-full my-1 ${item.type === 'internal' ? 'bg-primary/20 group-hover:bg-primary' : 'bg-border'}`}></div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className={`font-bold text-base truncate ${item.type === 'internal' ? 'text-text-primary' : 'text-text-muted'}`}>
                                                            {item.title}
                                                        </h3>
                                                        {item.type === 'internal' && (
                                                            <span className="badge badge-active text-[10px]">
                                                                אימון
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-text-muted truncate flex items-center gap-1.5">
                                                        {item.type === 'external' ? <ExternalLink size={12} className="shrink-0 opacity-50" /> : null}
                                                        {item.subtitle}
                                                    </p>
                                                </div>

                                                {/* Action */}
                                                {item.link && (
                                                    <div className="flex items-center ps-2">
                                                        <Link to={item.link} className="p-2 bg-background hover:bg-surface border border-transparent hover:border-border text-text-muted hover:text-primary rounded-lg transition-all">
                                                            <ChevronLeft size={18} />
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {error && (
                <div className="mt-8 text-center text-sm text-error">
                    {error}
                </div>
            )}

            <BookSessionModal
                isOpen={isBookModalOpen}
                onClose={() => setIsBookModalOpen(false)}
                onBooked={fetchAgenda}
                prefillDate={bookPrefillDate}
                prefillTime={bookPrefillTime}
            />

            {/* Mobile FAB — quick book button */}
            <button
                onClick={() => {
                    const now = new Date();
                    const yyyy = now.getFullYear();
                    const mm = String(now.getMonth() + 1).padStart(2, '0');
                    const dd = String(now.getDate()).padStart(2, '0');
                    setBookPrefillDate(`${yyyy}-${mm}-${dd}`);
                    setBookPrefillTime(`${String(now.getHours() + 1).padStart(2, '0')}:00`);
                    setIsBookModalOpen(true);
                }}
                className="md:hidden fixed bottom-24 end-5 z-40 w-14 h-14 rounded-2xl bg-primary text-white shadow-card flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
                title="קבע מפגש חדש"
            >
                <Plus size={24} />
            </button>
        </div>
    );
}
