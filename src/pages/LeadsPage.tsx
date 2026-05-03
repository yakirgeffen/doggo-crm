import { useEffect, useState, useCallback } from 'react';
import { Inbox, Phone, Dog, Clock, MessageCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/auth-context';
import { useToast } from '../context/toast-context';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { SkeletonRow } from '../components/Skeleton';
import type { IntakeSubmission } from '../types';

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'עכשיו';
    if (mins < 60) return `לפני ${mins} דק׳`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `לפני ${hours} שע׳`;
    const days = Math.floor(hours / 24);
    return `לפני ${days} ימים`;
}

const STATUS_FILTERS: { value: 'all' | 'new' | 'approved' | 'archived'; label: string }[] = [
    { value: 'all', label: 'הכל' },
    { value: 'new', label: 'חדשים' },
    { value: 'approved', label: 'אושרו' },
    { value: 'archived', label: 'בארכיון' },
];

export function LeadsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [leads, setLeads] = useState<IntakeSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'new' | 'approved' | 'archived'>('new');
    const [actioning, setActioning] = useState<string | null>(null);

    const fetchLeads = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        let query = supabase
            .from('intake_submissions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200);
        if (filter !== 'all') query = query.eq('status', filter);
        const { data } = await query;
        if (data) setLeads(data as IntakeSubmission[]);
        setLoading(false);
    }, [user, filter]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const updateStatus = async (lead: IntakeSubmission, newStatus: 'new' | 'approved' | 'archived') => {
        setActioning(lead.id);
        const { error } = await supabase
            .from('intake_submissions')
            .update({ status: newStatus })
            .eq('id', lead.id);
        if (!error) {
            showToast('הסטטוס עודכן', 'success');
            await fetchLeads();
        } else {
            showToast('שגיאה בעדכון', 'error');
        }
        setActioning(null);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <PageHeader title="פניות לידים" subtitle="כל הפניות שהתקבלו דרך טופס הפניות" />

            <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`text-xs px-3 py-1.5 rounded-full transition-colors ${filter === f.value ? 'bg-primary text-white' : 'bg-background text-text-secondary hover:bg-surface-warm'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flat-card p-0 overflow-hidden" role="status" aria-label="טוען פניות">
                    {[0, 1, 2, 3].map(i => (
                        <SkeletonRow key={i} />
                    ))}
                </div>
            ) : leads.length === 0 ? (
                <EmptyState
                    icon={Inbox}
                    title="אין פניות"
                    description={filter === 'all' ? 'עדיין לא קיבלת פניות מטופס הפניות.' : `אין פניות בקטגוריה "${STATUS_FILTERS.find(f => f.value === filter)?.label}".`}
                />
            ) : (
                <div className="grid gap-3">
                    {leads.map(lead => {
                        // eslint-disable-next-line react-hooks/purity -- intentional render-time comparison; "stale lead" indicator updates on each render is correct UX
                        const ageMs = Date.now() - new Date(lead.created_at).getTime();
                        const ageHours = ageMs / (1000 * 60 * 60);
                        const isStale = lead.status === 'new' && ageHours > 2;
                        const isVeryStale = lead.status === 'new' && ageHours > 24;
                        return (
                        <div key={lead.id} className={`flat-card p-4 ${isVeryStale ? 'border-error/40 bg-error/5' : isStale ? 'border-warning/40 bg-warning/5' : ''}`}>
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${isVeryStale ? 'bg-error/15 text-error' : isStale ? 'bg-warning/15 text-warning' : 'bg-primary/10 text-primary'}`}>
                                        {lead.full_name.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-text-primary text-sm">{lead.full_name}</h3>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${lead.status === 'new' ? 'bg-primary/10 text-primary' : lead.status === 'approved' ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'}`}>
                                                {lead.status === 'new' ? 'חדש' : lead.status === 'approved' ? 'אושר' : 'בארכיון'}
                                            </span>
                                            {isVeryStale && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-error/15 text-error flex items-center gap-1">
                                                    <AlertCircle size={10} />
                                                    מעל 24 שעות ללא תגובה
                                                </span>
                                            )}
                                            {isStale && !isVeryStale && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-warning/15 text-warning flex items-center gap-1">
                                                    <AlertCircle size={10} />
                                                    דורש תגובה
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-text-muted">
                                            {lead.dog_name && (<span className="flex items-center gap-1"><Dog size={12} />{lead.dog_name}</span>)}
                                            {lead.phone && (<span className="flex items-center gap-1"><Phone size={12} />{lead.phone}</span>)}
                                            <span className="flex items-center gap-1"><Clock size={12} />{timeAgo(lead.created_at)}</span>
                                        </div>
                                        {lead.notes && <p className="text-xs text-text-muted mt-1.5 line-clamp-2">{lead.notes}</p>}
                                        {lead.lead_source && (
                                            <p className="text-[10px] text-text-muted/70 mt-1 ltr-nums" dir="ltr" style={{ direction: 'ltr', textAlign: 'right' }}>{lead.lead_source}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {lead.phone && (
                                        <a
                                            href={(() => {
                                                const phoneDigits = lead.phone.replace(/[^\d]/g, '');
                                                const intl = phoneDigits.startsWith('0') ? '972' + phoneDigits.slice(1) : phoneDigits;
                                                const msg = encodeURIComponent(`שלום ${lead.full_name}! קיבלתי את הפנייה שלך${lead.dog_name ? ` לגבי ${lead.dog_name}` : ''}. 🐾`);
                                                return `https://wa.me/${intl}?text=${msg}`;
                                            })()}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs font-medium text-success bg-success/10 hover:bg-success/15 px-2.5 py-1 rounded-lg flex items-center gap-1"
                                        >
                                            <MessageCircle size={12} />
                                            WhatsApp
                                        </a>
                                    )}
                                    {lead.status !== 'archived' && (
                                        <button
                                            onClick={() => updateStatus(lead, 'archived')}
                                            disabled={actioning === lead.id}
                                            className="text-xs font-medium text-text-muted bg-background hover:bg-surface-warm px-2.5 py-1 rounded-lg"
                                        >
                                            ארכיון
                                        </button>
                                    )}
                                    {lead.status === 'archived' && (
                                        <button
                                            onClick={() => updateStatus(lead, 'new')}
                                            disabled={actioning === lead.id}
                                            className="text-xs font-medium text-primary bg-primary/10 hover:bg-primary/15 px-2.5 py-1 rounded-lg"
                                        >
                                            החזר
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
