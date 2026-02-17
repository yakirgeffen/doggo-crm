import { useEffect, useState, useCallback } from 'react';
import { Inbox, UserPlus, Archive, Phone, Dog, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

import type { IntakeSubmission } from '../../types';

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

export function IncomingLeads() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [leads, setLeads] = useState<IntakeSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState<string | null>(null);

    const fetchLeads = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('intake_submissions')
            .select('*')
            .eq('status', 'new')
            .order('created_at', { ascending: false })
            .limit(5);

        if (data) setLeads(data as IntakeSubmission[]);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const handleApprove = async (lead: IntakeSubmission) => {
        setActioning(lead.id);
        try {
            // Create a new client from the lead
            const { error: clientError } = await supabase.from('clients').insert([{
                full_name: lead.full_name,
                phone: lead.phone || '',
                primary_dog_name: lead.dog_name || '',
                primary_dog_breed: lead.dog_breed || '',
                notes: lead.notes || '',
                is_active: true,
                trainer_id: user?.id,
            }]);

            if (clientError) throw clientError;

            // Mark intake as approved
            await supabase
                .from('intake_submissions')
                .update({ status: 'approved' })
                .eq('id', lead.id);

            setLeads(prev => prev.filter(l => l.id !== lead.id));
            showToast(`${lead.full_name} נוסף/ה כלקוח/ה חדש/ה! 🎉`, 'success');
        } catch (err: any) {
            showToast('שגיאה ביצירת לקוח: ' + (err.message || ''), 'error');
        }
        setActioning(null);
    };

    const handleArchive = async (lead: IntakeSubmission) => {
        setActioning(lead.id);
        await supabase
            .from('intake_submissions')
            .update({ status: 'archived' })
            .eq('id', lead.id);

        setLeads(prev => prev.filter(l => l.id !== lead.id));
        showToast('ליד הועבר לארכיון', 'info');
        setActioning(null);
    };

    // Don't render the entire section if no leads and not loading
    if (!loading && leads.length === 0) return null;

    return (
        <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-md text-primary border border-primary/20">
                    <Inbox size={16} />
                </div>
                <h2 className="text-lg font-bold text-text-primary">לידים חדשים</h2>
                {leads.length > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {leads.length}
                    </span>
                )}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[0, 1].map(i => (
                        <div key={i} className="flat-card p-4 space-y-2 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-border/40 skeleton-shimmer shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3.5 w-1/3 bg-border/40 rounded-md skeleton-shimmer" />
                                    <div className="h-3 w-1/2 bg-border/30 rounded-md skeleton-shimmer" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid gap-3">
                    {leads.map((lead, idx) => (
                        <div
                            key={lead.id}
                            className="flat-card p-4 animate-fade-in"
                            style={{ animationDelay: `${idx * 60}ms` }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                {/* Lead Info */}
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm">
                                        {lead.full_name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-text-primary text-sm truncate">
                                            {lead.full_name}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-text-muted">
                                            {lead.dog_name && (
                                                <span className="flex items-center gap-1">
                                                    <Dog size={12} />
                                                    {lead.dog_name}
                                                </span>
                                            )}
                                            {lead.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone size={12} />
                                                    {lead.phone}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {timeAgo(lead.created_at)}
                                            </span>
                                        </div>
                                        {lead.notes && (
                                            <p className="text-xs text-text-muted mt-1.5 line-clamp-2">{lead.notes}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        onClick={() => handleApprove(lead)}
                                        disabled={actioning === lead.id}
                                        className="btn bg-success/10 text-success border border-success/20 hover:bg-success/15 px-3 py-1.5 text-xs font-medium flex items-center gap-1"
                                        title="אשר והוסף כלקוח"
                                    >
                                        {actioning === lead.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <UserPlus size={14} />
                                        )}
                                        <span className="hidden sm:inline">אשר</span>
                                    </button>
                                    <button
                                        onClick={() => handleArchive(lead)}
                                        disabled={actioning === lead.id}
                                        className="btn bg-border/20 text-text-muted border border-border hover:bg-border/30 px-3 py-1.5 text-xs font-medium flex items-center gap-1"
                                        title="העבר לארכיון"
                                    >
                                        <Archive size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
