import { useMemo, useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

export interface CalendarGridEvent {
    id: string;
    type: 'internal' | 'external';
    title: string;
    subtitle?: string;
    start: Date;
    end: Date;
    link?: string;
}

interface CalendarGridProps {
    startDate: Date; // Should be the Sunday of the week to display
    events: CalendarGridEvent[];
}

export function CalendarGrid({ startDate, events }: CalendarGridProps) {
    // Generate dates for the week (Sun-Sat)
    const weekDates = useMemo(() => {
        const dates = [];
        const start = new Date(startDate);
        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            dates.push(date);
        }
        return dates;
    }, [startDate]);

    // Calendar settings
    // Calendar settings
    const startHour = 0;
    const endHour = 24;
    const totalHours = endHour - startHour;
    const rowHeight = 60; // px per hour

    // Helper to calculate position style
    const getEventStyle = (event: CalendarGridEvent) => {
        const start = event.start.getHours() + event.start.getMinutes() / 60;
        const end = event.end.getHours() + event.end.getMinutes() / 60;

        const top = (start - startHour) * rowHeight;
        const height = Math.max((end - start) * rowHeight, 20); // Minimum 20px height

        return {
            top: `${top}px`,
            height: `${height}px`,
        };
    };

    // Filter events for specific day
    const getEventsForDay = (date: Date) => {
        return events.filter(event =>
            event.start.getDate() === date.getDate() &&
            event.start.getMonth() === date.getMonth() &&
            event.start.getFullYear() === date.getFullYear()
        );
    };

    // Current time line
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    // Calculate position for current time
    const getCurrentTimeTop = () => {
        const hours = currentTime.getHours() + currentTime.getMinutes() / 60;
        return (hours - startHour) * rowHeight;
    };

    // Auto-scroll to Current Time on mount
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollContainerRef.current) {
            const currentTop = getCurrentTimeTop();
            // Center it: subtract half container height (approx 300px)
            const scrollTo = Math.max(0, currentTop - 300);
            scrollContainerRef.current.scrollTop = scrollTo;
        }
    }, []);

    // Availability (Settings)
    const { settings } = useSettings();

    // Helper to check if a specific hour is within working hours
    const isWorkingTime = (dayIndex: number, hour: number) => {
        if (!settings) return true; // Default to available if loading

        // Check Day
        if (!settings.work_days.includes(dayIndex)) return false;

        // Check Hours
        const startH = parseInt(settings.work_hours_start.split(':')[0]);
        const endH = parseInt(settings.work_hours_end.split(':')[0]);

        return hour >= startH && hour < endH;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden flex flex-col h-[600px]">
            {/* Header Row (Days) */}
            <div className="flex border-b border-[var(--color-border)] bg-gray-50/50">
                <div className="w-16 shrink-0 border-l border-[var(--color-border)] bg-white z-10 sticky left-0"></div>
                {weekDates.map((date, i) => {
                    const isToday = new Date().toDateString() === date.toDateString();
                    return (
                        <div key={i} className="flex-1 text-center py-3 border-l border-[var(--color-border)] last:border-l-0">
                            <div className={`text-xs font-bold uppercase mb-1 ${isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                                {date.toLocaleDateString('he-IL', { weekday: 'short' })}
                            </div>
                            <div className={`text-xl font-black inline-flex items-center justify-center w-8 h-8 rounded-full ${isToday ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-main)]'}`}>
                                {date.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Grid Body */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative no-scrollbar">
                <div className="flex h-full min-h-[960px] pb-8 pt-2" style={{ height: `${totalHours * rowHeight + 40}px` }}>
                    {/* Time Column */}
                    <div className="w-16 shrink-0 border-l border-[var(--color-border)] bg-white sticky left-0 z-10 flex flex-col">
                        {Array.from({ length: totalHours + 1 }).map((_, i) => (
                            <div key={i} className="flex-1 text-xs font-medium text-[var(--color-text-muted)] -mt-2.5 pr-2 text-right absolute w-full" style={{ top: `${i * rowHeight}px` }}>
                                {(startHour + i).toString().padStart(2, '0')}:00
                            </div>
                        ))}
                    </div>

                    {/* Day Columns */}
                    {weekDates.map((date, i) => {
                        const isToday = new Date().toDateString() === date.toDateString();
                        const dayIndex = date.getDay(); // 0-6

                        return (
                            <div key={i} className="flex-1 border-l border-[var(--color-border)] last:border-l-0 relative group">
                                {/* Hour Lines & Availability Background */}
                                {Array.from({ length: totalHours }).map((_, h) => {
                                    const isAvailable = isWorkingTime(dayIndex, startHour + h);
                                    return (
                                        <div
                                            key={h}
                                            className={`border-b border-[var(--color-border)]/30 w-full absolute ${isAvailable ? 'bg-white' : 'bg-gray-50/70 diagonal-stripes'}`}
                                            style={{ top: `${h * rowHeight}px`, height: `${rowHeight}px` }}
                                        ></div>
                                    );
                                })}

                                {/* Current Time Line (Only on Today) */}
                                {isToday && (
                                    <div
                                        className="absolute w-full border-t-2 border-[var(--color-primary)] z-30 flex items-center shadow-sm"
                                        style={{ top: `${getCurrentTimeTop()}px` }}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] -ml-1"></div>
                                    </div>
                                )}

                                {/* Events */}
                                {getEventsForDay(date).map(event => (
                                    <div
                                        key={event.id}
                                        className={`absolute left-0.5 right-0.5 rounded-lg p-1.5 text-xs overflow-hidden transition-all shadow-sm border
                                        ${event.type === 'internal'
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium hover:brightness-95 hover:z-20 cursor-pointer'
                                                : 'bg-gray-100 border-gray-200 text-gray-500 opacity-90'
                                            }
                                    `}
                                        style={getEventStyle(event)}
                                    >
                                        {event.link ? (
                                            <Link to={event.link} className="absolute inset-0 z-10" title={event.title} />
                                        ) : null}

                                        <div className="flex gap-1 items-start">
                                            {event.type === 'external' && <ExternalLink size={10} className="shrink-0 mt-0.5" />}
                                            <span className="truncate font-bold">{event.title}</span>
                                        </div>
                                        {/* Only show time/subtitle if height permits */}
                                        {parseInt(getEventStyle(event).height) > 35 && (
                                            <div className="opacity-80 truncate text-[10px] mt-0.5">
                                                {event.start.getHours()}:{event.start.getMinutes().toString().padStart(2, '0')} - {event.subtitle}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
