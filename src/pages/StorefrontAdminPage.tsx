import { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useServices, type Service } from '../hooks/useServices';
import { Save, ExternalLink, Copy, Check, Plus, Edit2, Trash2, X } from 'lucide-react';
import { ServiceModal } from '../components/admin/ServiceModal';
import { useToast } from '../context/ToastContext';

export function StorefrontAdminPage() {
    const { settings, loading: settingsLoading, saveSettings: updateSettings } = useSettings();
    const { services, loading: servicesLoading, addService, updateService, deleteService } = useServices();
    const { showToast } = useToast();

    // Profile State
    const [handle, setHandle] = useState('');
    const [bio, setBio] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [specialties, setSpecialties] = useState<string[]>([]);
    const [savingProfile, setSavingProfile] = useState(false);
    const [copied, setCopied] = useState(false);

    // Service Modal State
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    // Initial Load
    useEffect(() => {
        if (settings) {
            setHandle(settings.trainer_handle || '');
            setBio(settings.bio || '');
            setBusinessName(settings.business_name || '');
            setSpecialties(settings.specialties || []);
        }
    }, [settings]);

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            await updateSettings({
                trainer_handle: handle.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || null,
                bio: bio.trim() || null,
                business_name: businessName.trim() || null,
                specialties,
            });
            showToast('הפרופיל עודכן בהצלחה!', 'success');
        } catch (err) {
            showToast('שגיאה בשמירת הפרופיל', 'error');
        }
        setSavingProfile(false);
    };

    const handleSaveService = async (serviceData: Partial<Service>) => {
        try {
            if (editingService) {
                await updateService(editingService.id, serviceData);
                showToast('השירות עודכן בהצלחה', 'success');
            } else {
                await addService(serviceData);
                showToast('השירות נוצר בהצלחה', 'success');
            }
        } catch (err) {
            showToast('שגיאה בשמירת השירות', 'error');
            throw err; // Re-throw to keep modal open if needed, or handle inside modal
        }
    };

    const handleDeleteService = async (id: string, _name: string) => {
        // if (!window.confirm(`האם למחוק את השירות "${name}"?`)) return; // Removed for automation
        try {
            await deleteService(id);
            showToast('השירות נמחק', 'info');
        } catch (err) {
            showToast('שגיאה במחיקת השירות', 'error');
        }
    };

    const handleAddSpecialty = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.currentTarget.value.trim();
            if (val && !specialties.includes(val)) {
                setSpecialties([...specialties, val]);
                e.currentTarget.value = '';
            }
        }
    };

    const removeSpecialty = (tag: string) => {
        setSpecialties(specialties.filter(s => s !== tag));
    };

    const sanitizedHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const publicUrl = sanitizedHandle && window.location.origin ? `${window.location.origin}/t/${sanitizedHandle}` : null;

    const copyUrl = async () => {
        if (!publicUrl) return;
        await navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        showToast('הקישור הועתק ללוח', 'success');
    };

    if (settingsLoading || servicesLoading) {
        return (
            <div className="space-y-6 max-w-3xl animate-pulse">
                <div className="h-8 w-48 bg-border/40 rounded-md"></div>
                <div className="h-64 w-full bg-border/30 rounded-xl"></div>
                <div className="h-64 w-full bg-border/30 rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in max-w-3xl pb-20">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">החנות שלי</h1>
                <p className="text-text-secondary mt-1">ניהול פרופיל ציבורי וקטלוג שירותים</p>
            </div>

            {/* Public Profile Section */}
            <div className="flat-card p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text-primary">פרופיל ציבורי</h2>
                    <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        {savingProfile ? <span className="animate-spin">⏳</span> : <Save size={16} />}
                        {savingProfile ? 'שומר...' : 'שמור שינויים'}
                    </button>
                </div>

                {/* Handle & URL */}
                <div className="p-4 bg-surface-warm rounded-xl border border-border/50 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">
                            קישור ציבורי (Handle)
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center bg-background rounded-xl border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                                <span className="text-sm text-text-muted ps-3 shrink-0 select-none bg-surface-warm/50 h-full flex items-center border-e border-border px-2" dir="ltr">doggo.crm/t/</span>
                                <input
                                    type="text"
                                    value={handle}
                                    onChange={(e) => setHandle(e.target.value)}
                                    placeholder="your-handle"
                                    className="flex-1 bg-transparent border-none p-2.5 text-sm text-text-primary focus:ring-0 font-mono"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>

                    {publicUrl && settings?.trainer_handle && (
                        <div className="flex items-center gap-2">
                            <a
                                href={publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-mono text-primary hover:underline truncate flex-1"
                                dir="ltr"
                            >
                                {publicUrl}
                            </a>
                            <button onClick={copyUrl} className="text-text-muted hover:text-primary transition-colors" title="העתק">
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                            <a href={publicUrl} target="_blank" rel="noreferrer" className="text-text-muted hover:text-primary transition-colors" title="פתח">
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    )}
                </div>

                {/* Business Info */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">
                            שם העסק / מאלף
                        </label>
                        <input
                            type="text"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="שם מלא או שם העסק"
                            className="w-full rounded-xl border border-border bg-background p-2.5 text-sm text-text-primary focus:ring-2 focus:ring-primary/30 outline-none"
                        />
                    </div>
                </div>

                {/* Specialties */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        תחומי התמחות (לחץ Enter להוספה)
                    </label>
                    <div className="min-h-[42px] flex flex-wrap gap-2 p-2 rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
                        {specialties.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium animate-scale-in">
                                {tag}
                                <button onClick={() => removeSpecialty(tag)} className="hover:text-primary-dark">
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        <input
                            type="text"
                            onKeyDown={handleAddSpecialty}
                            placeholder={specialties.length === 0 ? "לדוגמה: אילוף גורים, משמעת..." : ""}
                            className="flex-1 bg-transparent border-none text-sm text-text-primary focus:ring-0 min-w-[120px] p-0"
                        />
                    </div>
                </div>

                {/* Bio */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        על עצמי
                    </label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="ספרו קצת על הניסיון והגישה שלכם..."
                        className="w-full rounded-xl border border-border bg-background p-3 text-sm text-text-primary focus:ring-2 focus:ring-primary/30 outline-none resize-none min-h-[100px]"
                    />
                </div>
            </div>

            {/* Service Catalog Section */}
            <div className="flat-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-text-primary">קטלוג שירותים</h2>
                        <p className="text-xs text-text-secondary mt-1">שירותים אלו יופיעו בדף החנות שלכם</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingService(null);
                            setIsServiceModalOpen(true);
                        }}
                        className="btn btn-outline flex items-center gap-2 text-xs"
                    >
                        <Plus size={16} />
                        שירות חדש
                    </button>
                </div>

                {services.length === 0 ? (
                    <div className="text-center py-10 bg-surface-warm/30 rounded-xl border border-dashed border-border">
                        <p className="text-text-muted text-sm font-medium">עדיין לא הוגדרו שירותים.</p>
                        <button
                            onClick={() => setIsServiceModalOpen(true)}
                            className="mt-3 text-primary text-sm hover:underline"
                        >
                            + צור את השירות הראשון שלך
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {services.map((service) => (
                            <div key={service.id} className="group flex items-center justify-between p-4 bg-background rounded-xl border border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-sm"
                                        style={{ backgroundColor: service.color || '#15803d' }}
                                    >
                                        {service.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-text-primary">{service.name}</h3>
                                            {!service.is_active && (
                                                <span className="badge bg-text-muted/10 text-text-muted text-[10px]">טיוטה</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                                            <span>₪{service.price}</span>
                                            <span>•</span>
                                            <span>{service.duration_minutes} דק׳</span>
                                            <span>•</span>
                                            <span>{service.type === 'fixed' ? `חבילה (${service.sessions_included} מפגשים)` : 'מפגש בודד'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            setEditingService(service);
                                            setIsServiceModalOpen(true);
                                        }}
                                        className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        title="ערוך"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteService(service.id, service.name)}
                                        className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                                        title="מחק"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ServiceModal
                isOpen={isServiceModalOpen}
                onClose={() => setIsServiceModalOpen(false)}
                onSave={handleSaveService}
                initialData={editingService}
            />
        </div>
    );
}
