import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ChevronLeft, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/auth-context';

// G1 — first-run UX. New trainers see a setup checklist on the
// dashboard until they've completed the load-bearing items. The
// checklist is dismissable but auto-hidden once all items are done,
// and re-appears if a previously-completed item is undone.

interface ChecklistItem {
    id: string;
    label: string;
    description: string;
    done: boolean;
    href: string;
    cta: string;
}

const STORAGE_KEY = 'doggo:setup-checklist-dismissed';

export function TrainerSetupChecklist() {
    const { user, providerToken } = useAuth();
    const [items, setItems] = useState<ChecklistItem[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState(() => {
        try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
    });

    const fetchState = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        const [settingsRes, servicesRes, clientsRes, vaultRes] = await Promise.all([
            supabase.from('user_settings').select('trainer_handle, business_name').eq('user_id', user.id).maybeSingle(),
            supabase.from('services').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('sys_integrations_vault').select('service_name, is_connected').eq('user_id', user.id),
        ]);

        const trainerHandle = settingsRes.data?.trainer_handle ?? null;
        const businessName = settingsRes.data?.business_name ?? null;
        const serviceCount = servicesRes.count ?? 0;
        const clientCount = clientsRes.count ?? 0;
        const vaultRows = vaultRes.data ?? [];
        const billingConnected = vaultRows.some(r => r.is_connected);

        const next: ChecklistItem[] = [
            {
                id: 'business',
                label: 'הגדרת שם עסק',
                description: 'השם שיוצג ללקוחות בדף החנות הציבורי.',
                done: Boolean(businessName && businessName.trim().length > 0),
                href: '/settings',
                cta: 'להגדרה',
            },
            {
                id: 'handle',
                label: 'בחירת כתובת חנות',
                description: 'כתובת ייחודית שבה לקוחות פוטנציאליים ימצאו את העסק.',
                done: Boolean(trainerHandle && trainerHandle.length > 0),
                href: '/storefront',
                cta: 'לבחירה',
            },
            {
                id: 'services',
                label: 'הוספת שירות ראשון',
                description: 'הקטלוג מאפשר ללקוחות לראות מה אתם מציעים ובאיזה מחיר.',
                done: serviceCount > 0,
                href: '/settings',
                cta: 'להוספה',
            },
            {
                id: 'billing',
                label: 'חיבור חשבונית (Sumit / Morning)',
                description: 'חיבור לסומיט או חשבונית ירוקה מאפשר הפקת חשבוניות, הצעות מחיר וקבלות.',
                done: billingConnected,
                href: '/settings',
                cta: 'לחיבור',
            },
            {
                id: 'calendar',
                label: 'סנכרון יומן Google',
                description: 'מפגשים שנקבעים במערכת יופיעו אוטומטית ביומן.',
                done: Boolean(providerToken),
                href: '/login',
                cta: providerToken ? 'התחברות מחדש' : 'חיבור ל-Google',
            },
            {
                id: 'first-client',
                label: 'הוספת לקוח ראשון',
                description: 'מתחילים מלקוח אחד ובונים את הפעילות משם.',
                done: clientCount > 0,
                href: '/clients/new',
                cta: 'להוספה',
            },
        ];

        setItems(next);
        setLoading(false);
    }, [user, providerToken]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch, setState resolves after I/O
        fetchState();
    }, [fetchState]);

    if (!user || loading || !items) return null;

    const completed = items.filter(i => i.done).length;
    const total = items.length;
    const allDone = completed === total;

    if (allDone) return null;
    if (dismissed) return null;

    const percent = Math.round((completed / total) * 100);

    const handleDismiss = () => {
        try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
        setDismissed(true);
    };

    return (
        <div className="flat-card p-6 mb-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 animate-fade-in">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">בואו נסיים את ההתקנה</h2>

                        <p className="text-xs text-text-muted">{completed} מתוך {total} הושלמו · {percent}%</p>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    className="text-xs text-text-muted hover:text-text-primary underline"
                    title="הסתר עד הטעינה הבאה"
                >
                    הסתר
                </button>
            </div>

            <div className="w-full h-2 bg-background rounded-full overflow-hidden mb-4">
                <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                    style={{ width: `${percent}%` }}
                />
            </div>

            <ul className="space-y-2">
                {items.map(item => (
                    <li
                        key={item.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${item.done ? 'bg-success/5 border-success/20' : 'bg-surface border-border hover:border-primary/40'}`}
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {item.done ? (
                                <CheckCircle2 size={20} className="text-success shrink-0" />
                            ) : (
                                <Circle size={20} className="text-text-muted shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className={`font-bold text-sm ${item.done ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                                    {item.label}
                                </p>
                                {!item.done && (
                                    <p className="text-xs text-text-muted truncate">{item.description}</p>
                                )}
                            </div>
                        </div>
                        {!item.done && (
                            <Link
                                to={item.href}
                                className="text-xs font-medium text-primary hover:underline flex items-center gap-1 shrink-0"
                            >
                                {item.cta}
                                <ChevronLeft size={14} />
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
