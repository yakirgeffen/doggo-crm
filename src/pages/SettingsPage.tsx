import { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { Save, Building2, Calendar, Tag, Globe, Check } from 'lucide-react';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { ScheduleSettings } from '../components/settings/ScheduleSettings';
import { ServicesSettings } from '../components/settings/ServicesSettings';
import { IntegrationsSettings } from '../components/settings/IntegrationsSettings';

export function SettingsPage() {
    const { settings, updateLocalSettings, saveSettings, loading } = useSettings();
    const [activeTab, setActiveTab] = useState<'profile' | 'schedule' | 'services' | 'integrations'>('profile');
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            await saveSettings();
            setSuccessMessage("ההגדרות נשמרו בהצלחה");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            // Error managed by hook
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-text-muted">טוען הגדרות...</div>;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-12">
            <h1 className="text-[28px] font-bold text-text-primary mb-8">הגדרות מערכת</h1>

            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
                {/* Sidebar Navigation */}
                <div className="flex flex-col gap-2">
                    {[
                        { key: 'profile', icon: Building2, label: 'פרופיל עסק' },
                        { key: 'schedule', icon: Calendar, label: 'שעות פעילות' },
                        { key: 'services', icon: Tag, label: 'שירותים ומחירים' },
                        { key: 'integrations', icon: Globe, label: 'חיבורים' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`text-right px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-3
                                ${activeTab === tab.key
                                    ? 'bg-surface shadow-soft text-primary'
                                    : 'text-text-muted hover:bg-surface-warm'
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

                    {activeTab === 'integrations' && (
                        <IntegrationsSettings />
                    )}

                    {/* Save Button (Only for Profile & Schedule) */}
                    {(activeTab === 'profile' || activeTab === 'schedule') && (
                        <div className="flex items-center gap-4 pt-4 border-t border-border">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn btn-primary flex items-center gap-2 px-8"
                            >
                                {saving ? (
                                    <span className="animate-spin text-white">⌛</span>
                                ) : (
                                    <Save size={18} />
                                )}
                                {saving ? 'שומר...' : 'שמור שינויים'}
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
