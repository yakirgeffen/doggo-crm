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
    startDate: Date;
    events: CalendarGridEvent[];
}

export function CalendarGrid({ startDate, events }: CalendarGridProps) {
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

    const startHour = 0;
    const endHour = 24;
    const totalHours = endHour - startHour;
    const rowHeight = 60;

    const getEventStyle = (event: CalendarGridEvent) => {
        const start = event.start.getHours() + event.start.getMinutes() / 60;
        const end = event.end.getHours() + event.end.getMinutes() / 60;

        const top = (start - startHour) * rowHeight;
        const height = Math.max((end - start) * rowHeight, 20);

        return {
            top: `${top}px`,
            height: `${height}px`,
        };
    };

    const getEventsForDay = (date: Date) => {
        return events.filter(event =>
            event.start.getDate() === date.getDate() &&
            event.start.getMonth() === date.getMonth() &&
            event.start.getFullYear() === date.getFullYear()
        );
    };

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getCurrentTimeTop = () => {
        const hours = currentTime.getHours() + currentTime.getMinutes() / 60;
        return (hours - startHour) * rowHeight;
    };

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollContainerRef.current) {
            const currentTop = getCurrentTimeTop();
            const scrollTo = Math.max(0, currentTop - 300);
            scrollContainerRef.current.scrollTop = scrollTo;
        }
    }, []);

    const { settings } = useSettings();

    const isWorkingTime = (dayIndex: number, hour: number) => {
        if (!settings) return true;
        if (!settings.work_days.includes(dayIndex)) return false;
        const startH = parseInt(settings.work_hours_start.split(':')[0]);
        const endH = parseInt(settings.work_hours_end.split(':')[0]);
        return hour >= startH && hour < endH;
    };

    return (
        <div className="bg-surface rounded-xl shadow-soft border border-border overflow-hidden flex flex-col h-[600px]">
            {/* Header Row (Days) */}
            <div className="flex border-b border-border bg-surface-warm">
                <div className="w-16 shrink-0 border-s border-border bg-surface z-10 sticky start-0"></div>
                {weekDates.map((date, i) => {
                    const isToday = new Date().toDateString() === date.toDateString();
                    return (
                        <div key={i} className="flex-1 text-center py-3 border-s border-border last:border-s-0" aria-label={date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}>
                            <div className={`text-xs font-medium uppercase mb-1 ${isToday ? 'text-primary' : 'text-text-muted'}`}>
                                {date.toLocaleDateString('he-IL', { weekday: 'short' })}
                            </div>
                            <div className={`text-xl font-bold inline-flex items-center justify-center w-8 h-8 rounded-lg ${isToday ? 'bg-primary text-white' : 'text-text-primary'}`}>
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
                    <div className="w-16 shrink-0 border-s border-border bg-surface sticky start-0 z-10 flex flex-col">
                        {Array.from({ length: totalHours + 1 }).map((_, i) => (
                            <div key={i} className="flex-1 text-xs font-medium text-text-muted -mt-2.5 pe-2 text-end absolute w-full ltr-nums" style={{ top: `${i * rowHeight}px` }}>
                                {(startHour + i).toString().padStart(2, '0')}:00
                            </div>
                        ))}
                    </div>

                    {/* Day Columns */}
                    {weekDates.map((date, i) => {
                        const isToday = new Date().toDateString() === date.toDateString();
                        const dayIndex = date.getDay();

                        return (
                            <div key={i} className="flex-1 border-s border-border last:border-s-0 relative group">
                                {/* Hour Lines & Availability Background */}
                                {Array.from({ length: totalHours }).map((_, h) => {
                                    const isAvailable = isWorkingTime(dayIndex, startHour + h);
                                    return (
                                        <div
                                            key={h}
                                            className={`border-b border-border/30 w-full absolute ${isAvailable ? 'bg-surface' : 'bg-surface-warm diagonal-stripes'}`}
                                            style={{ top: `${h * rowHeight}px`, height: `${rowHeight}px` }}
                                        ></div>
                                    );
                                })}

                                {/* Current Time Line (Only on Today) */}
                                {isToday && (
                                    <div
                                        className="absolute w-full border-t-2 border-primary z-30 flex items-center shadow-sm"
                                        style={{ top: `${getCurrentTimeTop()}px` }}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-primary -ms-1"></div>
                                    </div>
                                )}

                                {/* Events */}
                                {getEventsForDay(date).map(event => (
                                    <div
                                        key={event.id}
                                        className={`absolute start-0.5 end-0.5 rounded-lg p-1.5 text-xs overflow-hidden transition-all shadow-sm border
                                        ${event.type === 'internal'
                                                ? 'bg-primary/10 border-primary/20 text-primary font-medium hover:brightness-95 hover:z-20 cursor-pointer'
                                                : 'bg-surface-warm border-border text-text-muted opacity-90'
                                            }
                                    `}
                                        style={getEventStyle(event)}
                                    >
                                        {event.link ? (
                                            <Link to={event.link} className="absolute inset-0 z-10" title={event.title} />
                                        ) : null}

                                        <div className="flex gap-1 items-start">
                                            {event.type === 'external' && <ExternalLink size={10} className="shrink-0 mt-0.5" />}
                                            <span className="truncate font-medium">{event.title}</span>
                                        </div>
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
