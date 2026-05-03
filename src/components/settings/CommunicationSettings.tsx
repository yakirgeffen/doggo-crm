import { MessageCircle } from 'lucide-react';
import { type UserSettings } from '../../types';

interface CommunicationSettingsProps {
    settings: UserSettings | null;
    onChange: (updates: Partial<UserSettings>) => void;
}

// Hardcoded fallback templates surfaced as textarea placeholders so trainers
// see the default copy they'd be overriding. These mirror the strings used in
// BookSessionModal / ClientsPage when the corresponding template is unset.
const PLACEHOLDER_GREETING = 'היי {firstName} 🐾';
const PLACEHOLDER_BOOKING =
    'שלום {firstName}!\nמפגש האילוף של {dogName} נקבע ל{date} בשעה {time}.\nנתראה! 🐾';
const PLACEHOLDER_REMINDER =
    'היי {firstName}!\nתזכורת: מפגש האילוף של {dogName} היום בשעה {time}.\nנתראה 🐾';

export function CommunicationSettings({ settings, onChange }: CommunicationSettingsProps) {
    if (!settings) return null;

    return (
        <div className="flat-card p-6 md:p-8 animate-fade-in">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-text-primary">
                <MessageCircle className="text-primary" />
                תקשורת ב-WhatsApp
            </h2>
            <p className="text-sm text-text-muted mb-6">
                התאמה אישית של ההודעות הנשלחות ללקוחות. אם משאירים שדה ריק, נשלחת הודעת ברירת המחדל.
            </p>

            <div className="space-y-6">
                {/* Greeting */}
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                        ברכה מהירה
                    </label>
                    <textarea
                        value={settings.wa_template_greeting || ''}
                        onChange={(e) => onChange({ wa_template_greeting: e.target.value })}
                        className="input-field min-h-[80px] resize-y"
                        placeholder={PLACEHOLDER_GREETING}
                        dir="rtl"
                    />
                    <p className="text-xs text-text-muted mt-1">
                        משתנים זמינים: <code className="text-text-secondary">{'{firstName}'}</code>{' '}
                        · <code className="text-text-secondary">{'{dogName}'}</code>
                    </p>
                </div>

                {/* Booking */}
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                        אישור קביעת מפגש
                    </label>
                    <textarea
                        value={settings.wa_template_booking || ''}
                        onChange={(e) => onChange({ wa_template_booking: e.target.value })}
                        className="input-field min-h-[120px] resize-y"
                        placeholder={PLACEHOLDER_BOOKING}
                        dir="rtl"
                    />
                    <p className="text-xs text-text-muted mt-1">
                        משתנים זמינים: <code className="text-text-secondary">{'{firstName}'}</code>{' '}
                        · <code className="text-text-secondary">{'{dogName}'}</code>{' '}
                        · <code className="text-text-secondary">{'{date}'}</code>{' '}
                        · <code className="text-text-secondary">{'{time}'}</code>
                    </p>
                </div>

                {/* Reminder */}
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                        תזכורת לפני מפגש
                    </label>
                    <textarea
                        value={settings.wa_template_reminder || ''}
                        onChange={(e) => onChange({ wa_template_reminder: e.target.value })}
                        className="input-field min-h-[120px] resize-y"
                        placeholder={PLACEHOLDER_REMINDER}
                        dir="rtl"
                    />
                    <p className="text-xs text-text-muted mt-1">
                        משתנים זמינים: <code className="text-text-secondary">{'{firstName}'}</code>{' '}
                        · <code className="text-text-secondary">{'{dogName}'}</code>{' '}
                        · <code className="text-text-secondary">{'{time}'}</code>
                    </p>
                </div>

                <div className="bg-primary/5 text-text-secondary p-4 rounded-xl text-sm flex items-start gap-3 border border-primary/10">
                    <div className="mt-0.5">ℹ️</div>
                    <p>
                        ההודעות נפתחות ב-WhatsApp עם המלל המוכן. תמיד אפשר לערוך לפני השליחה.
                    </p>
                </div>
            </div>
        </div>
    );
}
