import { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { Save, Building2, Calendar, Clock, Check, Tag, Plus, Trash2, Globe, Lock, CheckCircle2 } from 'lucide-react';
import { useServices } from '../hooks/useServices';
import { useIntegrations } from '../hooks/useIntegrations';

export function SettingsPage() {
    const { settings, updateSettings, loading } = useSettings();
    const { services, addService, deleteService, loading: servicesLoading } = useServices();
    const { isConnected, vaultData, saveKeys, testConnection, loading: integrationsLoading } = useIntegrations();

    const [activeTab, setActiveTab] = useState<'profile' | 'schedule' | 'services' | 'integrations'>('profile');
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // New Service State (Inline Form)
    const [isAddingService, setIsAddingService] = useState(false);
    const [newService, setNewService] = useState({ name: '', price: '', duration: '60' });

    // Integration State
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [testCheckResult, setTestCheckResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleAddService = async () => {
        if (!newService.name || !newService.price) return;
        try {
            await addService({
                name: newService.name,
                price: parseFloat(newService.price),
                duration_minutes: parseInt(newService.duration),
                currency: 'ILS'
            });
            setIsAddingService(false);
            setNewService({ name: '', price: '', duration: '60' }); // Reset
        } catch (e) {
            console.error(e);
        }
    };



    const handleSaveKeys = async () => {
        if (!apiKey || !apiSecret) return;
        await saveKeys(apiKey, apiSecret);
        setApiKey(''); // Clear input for security
        setApiSecret('');

        // Auto test after save
        const result = await testConnection();
        setTestCheckResult(result);
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            await updateSettings(settings);
            setSuccessMessage("ההגדרות נשמרו בהצלחה");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            // Error handled in hook
        } finally {
            setSaving(false);
        }
    };

    const toggleDay = (dayIndex: number) => {
        if (!settings) return;
        const currentDays = settings.work_days || [];
        const newDays = currentDays.includes(dayIndex)
            ? currentDays.filter(d => d !== dayIndex)
            : [...currentDays, dayIndex].sort();

        updateSettings({ work_days: newDays });
    };

    if (loading) return <div className="p-8 text-center text-[var(--color-text-muted)]">טוען הגדרות...</div>;

    const days = [
        { id: 0, label: 'א׳' },
        { id: 1, label: 'ב׳' },
        { id: 2, label: 'ג׳' },
        { id: 3, label: 'ד׳' },
        { id: 4, label: 'ה׳' },
        { id: 5, label: 'ו׳' },
        { id: 6, label: 'ש׳' },
    ];

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-12">
            <h1 className="text-3xl font-black text-[var(--color-text-main)] mb-8">הגדרות מערכת</h1>

            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
                {/* Sidebar Navigation */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`text-right px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3
                            ${activeTab === 'profile'
                                ? 'bg-white shadow-sm text-[var(--color-primary)] ring-1 ring-black/5'
                                : 'text-[var(--color-text-muted)] hover:bg-white/50'
                            }`}
                    >
                        <Building2 size={20} />
                        פרופיל עסק
                    </button>
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`text-right px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3
                            ${activeTab === 'schedule'
                                ? 'bg-white shadow-sm text-[var(--color-primary)] ring-1 ring-black/5'
                                : 'text-[var(--color-text-muted)] hover:bg-white/50'
                            }`}
                    >
                        <Calendar size={20} />
                        שעות פעילות
                    </button>
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`text-right px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3
                            ${activeTab === 'services'
                                ? 'bg-white shadow-sm text-[var(--color-primary)] ring-1 ring-black/5'
                                : 'text-[var(--color-text-muted)] hover:bg-white/50'
                            }`}
                    >
                        <Tag size={20} />
                        שירותים ומחירים
                        שירותים ומחירים
                    </button>
                    <button
                        onClick={() => setActiveTab('integrations')}
                        className={`text-right px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3
                            ${activeTab === 'integrations'
                                ? 'bg-white shadow-sm text-[var(--color-primary)] ring-1 ring-black/5'
                                : 'text-[var(--color-text-muted)] hover:bg-white/50'
                            }`}
                    >
                        <Globe size={20} />
                        חיבורים
                    </button>
                </div>

                {/* Content Area */}
                <div className="space-y-6">

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="flat-card p-6 md:p-8 animate-slide-up">
                            <h2 className="text-xl font-black mb-6">פרטי העסק</h2>

                            <div className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-text-muted)] mb-1">שם העסק</label>
                                    <input
                                        type="text"
                                        value={settings?.business_name || ''}
                                        onChange={(e) => updateSettings({ business_name: e.target.value })}
                                        placeholder="למשל: דוגו אימון כלבים"
                                        className="w-full p-3 rounded-lg border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all"
                                    />
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">שם זה יופיע בחשבוניות ובמיילים ללקוחות</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SCHEDULE TAB */}
                    {activeTab === 'schedule' && (
                        <div className="flat-card p-6 md:p-8 animate-slide-up">
                            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                                <Clock className="text-[var(--color-primary)]" />
                                שעות פעילות
                            </h2>

                            <div className="space-y-8">
                                {/* Working Days */}
                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-text-muted)] mb-3">ימי עבודה</label>
                                    <div className="flex flex-wrap gap-2">
                                        {days.map(day => {
                                            const isSelected = settings?.work_days.includes(day.id);
                                            return (
                                                <button
                                                    key={day.id}
                                                    onClick={() => toggleDay(day.id)}
                                                    className={`w-10 h-10 rounded-full font-bold text-sm transition-all flex items-center justify-center
                                                        ${isSelected
                                                            ? 'bg-[var(--color-primary)] text-white shadow-md scale-105'
                                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {day.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Working Hours */}
                                <div className="grid grid-cols-2 gap-4 max-w-xs">
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-text-muted)] mb-1">שעת התחלה</label>
                                        <input
                                            type="time"
                                            value={settings?.work_hours_start}
                                            onChange={(e) => updateSettings({ work_hours_start: e.target.value })}
                                            className="w-full p-2.5 rounded-lg border border-[var(--color-border)] font-mono text-center"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-text-muted)] mb-1">שעת סיום</label>
                                        <input
                                            type="time"
                                            value={settings?.work_hours_end}
                                            onChange={(e) => updateSettings({ work_hours_end: e.target.value })}
                                            className="w-full p-2.5 rounded-lg border border-[var(--color-border)] font-mono text-center"
                                        />
                                    </div>
                                </div>

                                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm flex items-start gap-3">
                                    {/* Info Icon */}
                                    <div className="mt-0.5">ℹ️</div>
                                    <p>שעות אלו ישפיעו על תצוגת היומן שלך. שעות מחוץ לטווח זה יוצגו באפור כדי לעזור לך להתמקד בזמן העבודה.</p>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* SERVICES TAB */}
                    {activeTab === 'services' && (
                        <div className="flat-card p-6 md:p-8 animate-slide-up">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black flex items-center gap-2">
                                    <Tag className="text-[var(--color-primary)]" />
                                    שירותים ומחיר
                                </h2>
                                {!isAddingService && (
                                    <button
                                        onClick={() => setIsAddingService(true)}
                                        className="btn btn-primary text-sm flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        הוסף שירות
                                    </button>
                                )}
                            </div>

                            {/* Service List */}
                            <div className="space-y-3">
                                {servicesLoading ? (
                                    <p className="text-sm text-[var(--color-text-muted)]">טוען שירותים...</p>
                                ) : services.length === 0 && !isAddingService ? (
                                    <p className="text-sm text-[var(--color-text-muted)] italic">אין שירותים מוגדרים עדיין. הוסף את השירות הראשון שלך!</p>
                                ) : (
                                    services.map(service => (
                                        <div key={service.id} className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all bg-white group">
                                            <div>
                                                <h3 className="font-bold text-[var(--color-text-main)]">{service.name}</h3>
                                                <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {service.duration_minutes} דק׳
                                                    </span>
                                                    <span>•</span>
                                                    <span className="font-mono">
                                                        ₪{service.price}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteService(service.id)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                title="מחק שירות"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))
                                )}

                                {/* Add Form */}
                                {isAddingService && (
                                    <div className="p-4 rounded-xl border-2 border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 animate-fade-in">
                                        <h3 className="font-bold text-sm mb-3 text-[var(--color-primary)]">הוספת שירות חדש</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                            <input
                                                type="text" placeholder="שם השירות (למשל: אימון אישי)"
                                                className="input-field text-sm"
                                                value={newService.name}
                                                autoFocus
                                                onChange={e => setNewService({ ...newService, name: e.target.value })}
                                            />
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-gray-400 text-xs">₪</span>
                                                <input
                                                    type="number" placeholder="מחיר"
                                                    className="input-field text-sm pl-8"
                                                    value={newService.price}
                                                    onChange={e => setNewService({ ...newService, price: e.target.value })}
                                                />
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-gray-400 text-xs">דק׳</span>
                                                <input
                                                    type="number" placeholder="משך"
                                                    className="input-field text-sm pl-8"
                                                    value={newService.duration}
                                                    onChange={e => setNewService({ ...newService, duration: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setIsAddingService(false)}
                                                className="btn btn-secondary text-xs"
                                            >
                                                ביטול
                                            </button>
                                            <button
                                                onClick={handleAddService}
                                                disabled={!newService.name || !newService.price}
                                                className="btn btn-primary text-xs"
                                            >
                                                שמור שירות
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    )}

                    {/* INTEGRATIONS TAB */}
                    {activeTab === 'integrations' && (
                        <div className="flat-card p-6 md:p-8 animate-slide-up space-y-8">
                            <div>
                                <h2 className="text-xl font-black flex items-center gap-2 mb-2">
                                    <Globe className="text-[var(--color-primary)]" />
                                    חיבור חשבונית ירוקה (Morning)
                                </h2>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    חבר את החשבון שלך כדי לשלוח דרישות תשלום באשראי, ביט, ו-Paybox ישירות מהמערכת.
                                </p>
                            </div>

                            <div className={`p-4 rounded-xl border flex items-center justify-between ${isConnected ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                    <div>
                                        <p className={`font-bold ${isConnected ? 'text-emerald-800' : 'text-gray-600'}`}>
                                            {isConnected ? 'מחובר למערכת Morning' : 'לא מחובר'}
                                        </p>
                                        {vaultData?.access_key_id && (
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">Key ID: ...{vaultData.access_key_id.slice(-4)}</p>
                                        )}
                                    </div>
                                </div>
                                {isConnected && <CheckCircle2 className="text-emerald-600 mb-1" />}
                            </div>

                            {!isConnected && (
                                <div className="space-y-4 max-w-lg p-6 bg-white border border-[var(--color-border)] rounded-xl shadow-sm">
                                    <h3 className="font-bold text-sm text-[var(--color-text-main)]">הגדרת מפתחות API</h3>

                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm mb-6 shadow-indo">
                                        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                            <Globe size={16} />
                                            איך משיגים מפתחות API?
                                        </h4>
                                        <ol className="list-decimal list-inside text-blue-800 space-y-1 mb-3 marker:font-bold">
                                            <li>היכנס למערכת <a href="https://www.greeninvoice.co.il/login" target="_blank" rel="noreferrer" className="underline font-bold hover:text-blue-600">Morning (חשבונית ירוקה)</a>.</li>
                                            <li>בתפריט הצד, לחץ על <b>הגדרות</b> (Settings).</li>
                                            <li>בחר באפשרות <b>API & Webhooks</b> או <b>כלים למפתחים</b>.</li>
                                            <li>לחץ על <b>הוספת מפתח</b> (Add Key) והעתק את הנתונים.</li>
                                        </ol>
                                        <p className="text-[11px] text-blue-600/80 mt-2 border-t border-blue-100 pt-2">
                                            * המיקום המדויק בתפריט עשוי להשתנות, אך תמיד יימצא תחת "הגדרות".
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1">מזהה מפתח (API Key ID)</label>
                                        <input
                                            type="text"
                                            className="input-field dir-ltr font-mono text-sm"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder="הדבק כאן את Key ID"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1">מפתח סודי (Secret Key)</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 text-gray-400" size={14} />
                                            <input
                                                type="password"
                                                className="input-field dir-ltr font-mono text-sm pl-9"
                                                value={apiSecret}
                                                onChange={(e) => setApiSecret(e.target.value)}
                                                placeholder="הדבק כאן את Secret Key"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSaveKeys}
                                        disabled={integrationsLoading || !apiKey || !apiSecret}
                                        className="btn btn-primary w-full flex justify-center items-center gap-2"
                                    >
                                        {integrationsLoading ? 'מתחבר...' : 'שמור ובדוק חיבור'}
                                    </button>

                                    {testCheckResult && (
                                        <div className={`text-xs p-3 rounded-lg ${testCheckResult.success ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                            {testCheckResult.message}
                                        </div>
                                    )}

                                    <div className="text-[10px] text-gray-400 leading-relaxed bg-gray-50 p-3 rounded">
                                        ℹ️ המפתחות נשמרים בצורה מאובטחת. המערכת משתמשת בהם רק לצורך הפקת מסמכים וקישורי תשלום.
                                        המפתחות הסודיים אינם מוצגים שוב לאחר השמירה.
                                    </div>
                                </div>
                            )}

                            {isConnected && (
                                <div className="mt-4">
                                    <button
                                        onClick={async () => {
                                            const res = await testConnection();
                                            setTestCheckResult(res);
                                        }}
                                        disabled={integrationsLoading}
                                        className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
                                    >
                                        🔄 בדוק חיבור מחדש
                                    </button>
                                    {testCheckResult && (
                                        <div className={`mt-2 text-xs p-2 rounded w-fit ${testCheckResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                            {testCheckResult.message}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex items-center gap-4 pt-4 border-t border-[var(--color-border)]">
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
                            <div className="text-emerald-600 font-bold text-sm flex items-center gap-1 animate-fade-in">
                                <Check size={16} />
                                {successMessage}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
}
