import { useEffect, useState, useCallback } from 'react';
import { TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/auth-context';

// G3 reporting layer — closes the second half of Gaya G3 (UTM capture
// shipped earlier; this surfaces the captured lead_source data on the
// dashboard). Aggregates the trainer's intake_submissions over the last
// 30 days by parsed UTM source.

interface SourceRow { label: string; count: number; }

function parseSource(leadSource: string | null): string {
    if (!leadSource) return 'ישיר';
    const utmSource = leadSource.match(/utm_source=([^|]+)/);
    if (utmSource) return utmSource[1];
    if (leadSource.includes('gclid=')) return 'Google Ads';
    if (leadSource.includes('fbclid=')) return 'Facebook / Instagram';
    const ref = leadSource.match(/ref=([^|]+)/);
    if (ref) return `הפניה: ${ref[1]}`;
    return 'אחר';
}

const FRIENDLY_LABELS: Record<string, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    google: 'Google',
    youtube: 'YouTube',
    whatsapp: 'WhatsApp',
    linkedin: 'LinkedIn',
    tiktok: 'TikTok',
    'google ads': 'Google Ads',
};

export function LeadSourceReport() {
    const { user } = useAuth();
    const [rows, setRows] = useState<SourceRow[] | null>(null);
    const [totalLeads, setTotalLeads] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data, error } = await supabase
            .from('intake_submissions')
            .select('lead_source, created_at')
            .eq('trainer_id', user.id)
            .gte('created_at', thirtyDaysAgo.toISOString())
            .limit(500);

        if (error || !data) {
            setRows([]);
            setLoading(false);
            return;
        }

        const counts = new Map<string, number>();
        for (const row of data) {
            const source = parseSource(row.lead_source);
            const label = FRIENDLY_LABELS[source.toLowerCase()] || source;
            counts.set(label, (counts.get(label) || 0) + 1);
        }

        const sorted: SourceRow[] = Array.from(counts.entries())
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        setRows(sorted);
        setTotalLeads(data.length);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch, setState resolves after I/O
        fetchData();
    }, [fetchData]);

    if (loading || !rows) return null;
    if (rows.length === 0) return null;

    const max = rows[0].count;

    return (
        <div className="flat-card p-6 mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-accent/10 rounded-md text-accent border border-accent/20">
                        <TrendingUp size={16} />
                    </div>
                    <h2 className="text-lg font-bold text-text-primary">מקור פניות (30 ימים אחרונים)</h2>
                </div>
                <span className="text-xs text-text-muted">{totalLeads} פניות</span>
            </div>

            <div className="space-y-3">
                {rows.map(row => {
                    const pct = max > 0 ? (row.count / max) * 100 : 0;
                    return (
                        <div key={row.label} className="flex items-center gap-3">
                            <div className="w-32 text-sm text-text-secondary truncate">{row.label}</div>
                            <div className="flex-1 h-6 bg-background rounded-md overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-l from-primary to-accent transition-all"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <div className="w-12 text-sm font-bold text-text-primary text-end ltr-nums">{row.count}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
