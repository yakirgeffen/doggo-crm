import { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { Save, Building2, Calendar, Tag, Globe, Check, MessageCircle } from 'lucide-react';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { ScheduleSettings } from '../components/settings/ScheduleSettings';
import { ServicesSettings } from '../components/settings/ServicesSettings';
import { IntegrationsSettings } from '../components/settings/IntegrationsSettings';
import { CommunicationSettings } from '../components/settings/CommunicationSettings';
import { SkeletonCard } from '../components/Skeleton';
import { Spinner } from '../components/Spinner';

export function SettingsPage() {
    const { settings, updateLocalSettings, saveSettings, loading } = useSettings();
    const [activeTab, setActiveTab] = useState<'profile' | 'schedule' | 'services' | 'communication' | 'integrations'>('profile');
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            await saveSettings();
            setSuccessMessage("ההגדרות נשמרו בהצלחה");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch {
            // Error managed by hook
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-12" role="status" aria-label="טוען הגדרות">
            <div className="h-9 w-48 bg-border/40 rounded-md skeleton-shimmer mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
                <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible -mx-1 px-1">
                    {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className="h-12 w-32 md:w-full shrink-0 bg-border/30 rounded-lg skeleton-shimmer" />
                    ))}
                </div>
                <div className="space-y-6">
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-12">
            <h1 className="text-2xl md:text-[28px] font-bold text-text-primary mb-6 md:mb-8">הגדרות מערכת</h1>

            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 md:gap-8">
                {/* Sidebar Navigation — horizontal scroll on mobile, vertical column on md+ */}
                <div
                    className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 pb-1 md:pb-0 no-scrollbar"
                    role="tablist"
                    aria-label="ניווט הגדרות"
                >
                    {([
                        { key: 'profile', icon: Building2, label: 'פרופיל עסק' },
                        { key: 'schedule', icon: Calendar, label: 'שעות פעילות' },
                        { key: 'services', icon: Tag, label: 'שירותים ומחירים' },
                        { key: 'communication', icon: MessageCircle, label: 'תקשורת' },
                        { key: 'integrations', icon: Globe, label: 'חיבורים' },
                    ] as const).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            role="tab"
                            aria-selected={activeTab === tab.key}
                            className={`shrink-0 md:shrink whitespace-nowrap text-right px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-3
                                ${activeTab === tab.key
                                    ? 'bg-surface shadow-soft text-primary border border-primary/20 md:border-transparent'
                                    : 'text-text-muted hover:bg-surface-warm border border-transparent'
                                }`}
                        >
                            <tab.icon size={20} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="space-y-6">
                    {activeTab === 'profile' && (
                        <ProfileSettings settings={settings} onChange={updateLocalSettings} />
                    )}

                    {activeTab === 'schedule' && (
                        <ScheduleSettings settings={settings} onChange={updateLocalSettings} />
                    )}

                    {activeTab === 'services' && (
                        <ServicesSettings />
                    )}

                    {activeTab === 'communication' && (
                        <CommunicationSettings settings={settings} onChange={updateLocalSettings} />
                    )}

                    {activeTab === 'integrations' && (
                        <IntegrationsSettings />
                    )}

                    {/* Save Button (Only for Profile, Schedule, & Communication) */}
                    {(activeTab === 'profile' || activeTab === 'schedule' || activeTab === 'communication') && (
                        <div className="flex items-center gap-4 pt-4 border-t border-border">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn btn-primary flex items-center gap-2 px-8"
                            >
                                {saving ? (
                                    <Spinner size="lg" />
                                ) : (
                                    <Save size={18} />
                                )}
                                {saving ? 'שומרים...' : 'שמירת שינויים'}
                            </button>

                            {successMessage && (
                                <div className="text-success font-medium text-sm flex items-center gap-1 animate-fade-in">
                                    <Check size={16} />
                                    {successMessage}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
