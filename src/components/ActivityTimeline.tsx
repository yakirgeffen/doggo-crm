import { useEffect, useState } from 'react';
import { supabase, type ActivityLog } from '../lib/supabase';
import { FileText, CheckCircle, BookOpen } from 'lucide-react';

interface ActivityTimelineProps {
    entityType?: 'client' | 'program';
    entityId?: string;
    limit?: number;
    programIds?: string[];
}

export function ActivityTimeline({ entityType, entityId, limit = 10, programIds }: ActivityTimelineProps) {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, [entityType, entityId]);

    const fetchLogs = async () => {
        setLoading(true);

        let mainQuery = supabase
            .from('activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (entityType && entityId) {
            mainQuery = mainQuery.eq('entity_type', entityType).eq('entity_id', entityId);
        }

        const queries = [mainQuery];

        if (programIds && programIds.length > 0) {
            const programQuery = supabase
                .from('activity_logs')
                .select('*')
                .eq('entity_type', 'program')
                .in('entity_id', programIds)
                .order('created_at', { ascending: false })
                .limit(limit);
            queries.push(programQuery);
        }

        const results = await Promise.all(queries);

        let allLogs: ActivityLog[] = [];
        results.forEach(res => {
            if (res.data) allLogs = [...allLogs, ...res.data as ActivityLog[]];
            if (res.error) console.error('Error fetching logs:', res.error);
        });

        const uniqueLogs = Array.from(new Map(allLogs.map(item => [item.id, item])).values());
        uniqueLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setLogs(uniqueLogs.slice(0, limit));
        setLoading(false);
    };

    if (loading) return <div className="text-sm text-text-muted p-4">טוען פעילות...</div>;
    if (logs.length === 0) return <div className="text-sm text-text-muted italic p-4">אין פעילות מתועדת עדיין.</div>;

    return (
        <div className="space-y-6 p-4">
            {logs.map((log) => (
                <div key={log.id} className="relative flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border z-10">
                            {log.entity_type === 'program' ? <BookOpen size={14} className="text-primary" /> :
                                log.entity_type === 'session' ? <CheckCircle size={14} className="text-primary" /> :
                                    <FileText size={14} className="text-text-muted" />}
                        </div>
                        <div className="w-px h-full bg-border absolute top-8 bottom-[-24px]"></div>
                    </div>
                    <div className="pb-2">
                        <p className="text-sm font-medium text-text-primary">
                            {log.action} <span className="text-text-muted font-normal">{log.entity_type}</span>
                        </p>
                        {log.description && (
                            <p className="text-sm text-text-muted mt-0.5">{log.description}</p>
                        )}
                        <p className="text-xs text-text-muted mt-1">
                            {new Date(log.created_at).toLocaleString()}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
