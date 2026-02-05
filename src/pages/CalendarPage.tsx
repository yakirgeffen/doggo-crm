import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ExternalLink, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, List, Grid } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { listUpcomingEvents } from '../lib/calendar';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { CalendarGrid } from '../components/CalendarGrid';

// Reusing the type structure compatible with both views
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
    const [viewMode, setViewMode] = useState<'week' | 'list'>('week');
    const [currentDate, setCurrentDate] = useState(new Date()); // Represents the focused date (or start of week)
    const [showInternal, setShowInternal] = useState(true);
    const [showExternal, setShowExternal] = useState(true);

    // Data state
    const [items, setItems] = useState<AgendaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAgenda();
    }, [providerToken, currentDate, viewMode]);

    const fetchAgenda = async () => {
        setLoading(true);
        setError(null);
        try {
            const allItems: AgendaItem[] = [];

            // Calculate start of the currently viewed week for fetch range
            const d = new Date(currentDate);
            const day = d.getDay();
            const diff = d.getDate() - day;
            d.setDate(diff);
            d.setHours(0, 0, 0, 0);
            const startRange = d.toISOString();

            console.log('Fetching agenda from:', startRange);

            // 1. Fetch Internal Sessions (Supabase)
            const { data: sessions, error: dbError } = await supabase
                .from('sessions')
                .select(`
                    id, 
                    session_date, 
                    programs:program_id (
                        program_name,
                        clients (full_name, primary_dog_name)
                    )
                `)
                .gte('session_date', startRange) // Fetch from start of view, not "now"
                .order('session_date', { ascending: true })
                .limit(100); // Increased limit

            console.log('Fetched sessions:', sessions);

            if (dbError) throw dbError;

            if (sessions) {
                sessions.forEach((s: any) => {
                    const start = new Date(s.session_date);
                    const end = new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour duration

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

            // 2. Fetch External Events (Google Calendar)
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

            // 3. Sort
            allItems.sort((a, b) => a.start.getTime() - b.start.getTime());
            setItems(allItems);

        } catch (err: any) {
            console.error(err);
            setError("Failed to load schedule");
        } finally {
            setLoading(false);
        }
    };

    // Helper to change weeks
    const navigateWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentDate(newDate);
    };

    const jumpToday = () => setCurrentDate(new Date());

    // Calculate Grid Start Date (Last Sunday)
    const getGridStartDate = () => {
        const d = new Date(currentDate);
        const day = d.getDay(); // 0 is Sunday
        const diff = d.getDate() - day; // adjust when day is sunday
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    // Filter items based on toggles
    const filteredItems = items.filter(item => {
        if (item.type === 'internal' && !showInternal) return false;
        if (item.type === 'external' && !showExternal) return false;
        return true;
    });

    const sortAndGroupItems = (items: AgendaItem[]) => {
        // Sort by start time
        const sorted = [...items].sort((a, b) => a.start.getTime() - b.start.getTime());

        // Group
        const grouped: Record<string, AgendaItem[]> = {};
        sorted.forEach(item => {
            // Use stripped date string for grouping key to safely compare days
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
                    <h1 className="text-3xl font-black text-[var(--color-text-main)] mb-1">לוח זמנים</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <button onClick={jumpToday} className="text-sm font-bold text-[var(--color-primary)] hover:underline">
                            היום
                        </button>
                        <div className="flex items-center bg-white rounded-lg shadow-sm border border-[var(--color-border)] p-1">
                            <button onClick={() => navigateWeek('prev')} className="p-1 hover:bg-gray-100 rounded-md text-[var(--color-text-muted)]">
                                <ChevronRight size={20} />
                            </button>
                            <span className="px-3 text-sm font-bold min-w-[100px] text-center">
                                {getGridStartDate().toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })} - {' '}
                                {new Date(new Date(getGridStartDate()).setDate(getGridStartDate().getDate() + 6)).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                            </span>
                            <button onClick={() => navigateWeek('next')} className="p-1 hover:bg-gray-100 rounded-md text-[var(--color-text-muted)]">
                                <ChevronLeft size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Smart Filters */}
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-[var(--color-border)] shadow-sm">
                        <button
                            onClick={() => setShowInternal(!showInternal)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2
                                ${showInternal
                                    ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200'
                                    : 'text-[var(--color-text-muted)] hover:bg-gray-50 opacity-60'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${showInternal ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                            אימונים
                        </button>
                        <div className="w-px h-4 bg-gray-200"></div>
                        <button
                            onClick={() => setShowExternal(!showExternal)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2
                                ${showExternal
                                    ? 'bg-gray-100 text-gray-700 shadow-sm ring-1 ring-gray-200'
                                    : 'text-[var(--color-text-muted)] hover:bg-gray-50 opacity-60'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${showExternal ? 'bg-gray-500' : 'bg-gray-300'}`}></span>
                            אישי
                        </button>
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-2"></div>

                    <div className="bg-[var(--color-bg-app)] p-1 rounded-lg border border-[var(--color-border)] flex">
                        <button
                            onClick={() => setViewMode('week')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'week' ? 'bg-white shadow text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:bg-white/50'}`}
                            title="Week View"
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:bg-white/50'}`}
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
                        <RefreshCw size={16} className={`ml-2 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {!providerToken && (
                <div className="flat-card bg-yellow-50 border-yellow-100 p-4 mb-8 flex items-start gap-3">
                    <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h3 className="font-bold text-yellow-800">היומן לא מסונכרן</h3>
                        <p className="text-sm text-yellow-700">כדי לראות את האירועים מיומן Google שלך כאן, עליך להתחבר מחדש דרך Google בדף ההתחברות.</p>
                    </div>
                </div>
            )}

            {/* View Rendering */}
            {viewMode === 'week' ? (
                <CalendarGrid
                    startDate={getGridStartDate()}
                    events={filteredItems}
                />
            ) : (
                /* Grouped List View */
                <div className="space-y-8 max-w-4xl mx-auto">
                    {filteredItems.length === 0 && !loading ? (
                        <div className="flat-card p-12 text-center text-[var(--color-text-muted)]">
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
                                <div key={dateKey} className="animate-slide-up">
                                    <h3 className={`text-lg font-black mb-4 flex items-center gap-2 sticky top-0 bg-[var(--color-bg-app)] py-2 z-10 
                                        ${isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-main)]'}`
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
                                                        ? 'bg-white border-[var(--color-border)] hover:border-[var(--color-primary)] shadow-sm hover:shadow-md'
                                                        : 'bg-white/60 border-gray-100 dashed-border hover:border-gray-200'
                                                    }
                                                `}
                                            >
                                                {/* Time Column (Simplified) */}
                                                <div className="w-14 shrink-0 flex flex-col justify-center items-center text-center">
                                                    <span className="text-lg font-black text-[var(--color-text-main)] leading-none">
                                                        {item.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="text-[10px] text-[var(--color-text-muted)] mt-1">
                                                        {item.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                {/* Divider */}
                                                <div className={`w-1 rounded-full my-1 ${item.type === 'internal' ? 'bg-[var(--color-primary)]/20 group-hover:bg-[var(--color-primary)]' : 'bg-gray-200'}`}></div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className={`font-bold text-base truncate ${item.type === 'internal' ? 'text-[var(--color-text-main)]' : 'text-gray-500'}`}>
                                                            {item.title}
                                                        </h3>
                                                        {item.type === 'internal' && (
                                                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                                אימון
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-[var(--color-text-muted)] truncate flex items-center gap-1.5">
                                                        {item.type === 'external' ? <ExternalLink size={12} className="shrink-0 opacity-50" /> : null}
                                                        {item.subtitle}
                                                    </p>
                                                </div>

                                                {/* Action */}
                                                {item.link && (
                                                    <div className="flex items-center pl-2">
                                                        <Link to={item.link} className="btn-icon bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 text-gray-400 hover:text-[var(--color-primary)]">
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
                <div className="mt-8 text-center text-sm text-red-400">
                    {error}
                </div>
            )}
        </div>
    );
}
