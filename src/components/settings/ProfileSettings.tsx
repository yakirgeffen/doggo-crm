import { Building2 } from 'lucide-react';
import { type UserSettings } from '../../types';

interface ProfileSettingsProps {
    settings: UserSettings | null;
    onChange: (updates: Partial<UserSettings>) => void;
}

export function ProfileSettings({ settings, onChange }: ProfileSettingsProps) {
    if (!settings) return null;

    return (
        <div className="flat-card p-6 md:p-8 animate-fade-in">
            <h2 className="text-xl font-bold mb-6 text-text-primary flex items-center gap-2">
                <Building2 className="text-primary" />
                פרטי העסק
            </h2>
            <div className="space-y-4 max-w-md">
                <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">שם העסק</label>
                    <input
                        type="text"
                        value={settings.business_name || ''}
                        onChange={(e) => onChange({ business_name: e.target.value })}
                        placeholder="למשל: דוגו אימון כלבים"
                        className="input-field"
                    />
                    <p className="text-xs text-text-muted mt-1">שם זה יופיע בחשבוניות ובמיילים ללקוחות</p>
                </div>
                {/* Future: Add more fields here like Logo, Address, etc. */}
            </div>
        </div>
    );
}
