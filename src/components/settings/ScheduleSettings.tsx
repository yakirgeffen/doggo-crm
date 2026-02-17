import { Clock } from 'lucide-react';
import { type UserSettings } from '../../types';

interface ScheduleSettingsProps {
    settings: UserSettings | null;
    onChange: (updates: Partial<UserSettings>) => void;
}

export function ScheduleSettings({ settings, onChange }: ScheduleSettingsProps) {
    if (!settings) return null;

    const days = [
        { id: 0, label: 'א׳' },
        { id: 1, label: 'ב׳' },
        { id: 2, label: 'ג׳' },
        { id: 3, label: 'ד׳' },
        { id: 4, label: 'ה׳' },
        { id: 5, label: 'ו׳' },
        { id: 6, label: 'ש׳' },
    ];

    const toggleDay = (dayIndex: number) => {
        const currentDays = settings.work_days || [];
        const newDays = currentDays.includes(dayIndex)
            ? currentDays.filter(d => d !== dayIndex)
            : [...currentDays, dayIndex].sort();
        onChange({ work_days: newDays });
    };

    return (
        <div className="flat-card p-6 md:p-8 animate-fade-in">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-text-primary">
                <Clock className="text-primary" />
                שעות פעילות
            </h2>

            <div className="space-y-8">
                <div>
                    <label className="block text-sm font-medium text-text-muted mb-3">ימי עבודה</label>
                    <div className="flex flex-wrap gap-2">
                        {days.map(day => {
                            const isSelected = settings.work_days.includes(day.id);
                            return (
                                <button
                                    key={day.id}
                                    onClick={() => toggleDay(day.id)}
                                    className={`w-10 h-10 rounded-lg font-medium text-sm transition-all flex items-center justify-center
                                        ${isSelected
                                            ? 'bg-primary text-white shadow-soft'
                                            : 'bg-background text-text-muted hover:bg-surface-warm'
                                        }`}
                                >
                                    {day.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-xs">
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">שעת התחלה</label>
                        <input
                            type="time"
                            value={settings.work_hours_start}
                            onChange={(e) => onChange({ work_hours_start: e.target.value })}
                            className="input-field font-mono text-center"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">שעת סיום</label>
                        <input
                            type="time"
                            value={settings.work_hours_end}
                            onChange={(e) => onChange({ work_hours_end: e.target.value })}
                            className="input-field font-mono text-center"
                        />
                    </div>
                </div>

                <div className="bg-primary/5 text-text-secondary p-4 rounded-xl text-sm flex items-start gap-3 border border-primary/10">
                    <div className="mt-0.5">ℹ️</div>
                    <p>שעות אלו ישפיעו על תצוגת היומן שלך. שעות מחוץ לטווח זה יוצגו באפור כדי לעזור לך להתמקד בזמן העבודה.</p>
                </div>
            </div>
        </div>
    );
}
