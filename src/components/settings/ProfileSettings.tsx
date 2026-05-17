import { Building2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
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

                {/* PP-17: cross-link to storefront where handle and public profile live */}
                <div className="pt-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-text-muted mb-0.5">כתובת החנות הציבורית</p>
                            {settings.trainer_handle ? (
                                <p className="text-sm text-text-primary font-mono ltr-nums" dir="ltr">
                                    doggocrm.app/t/{settings.trainer_handle}
                                </p>
                            ) : (
                                <p className="text-sm text-text-muted">לא הוגדרה כתובת</p>
                            )}
                        </div>
                        <Link
                            to="/storefront"
                            className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 bg-primary/10 hover:bg-primary/15 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                            <ExternalLink size={12} />
                            ניהול החנות
                        </Link>
                    </div>
                    {/* anti-bot: em dash removed from trainer-facing description */}
                    <p className="text-xs text-text-muted mt-1">ניהול הקישור, הביוגרפיה והשירותים הציבוריים נמצא בדף החנות</p>
                </div>
            </div>
        </div>
    );
}
