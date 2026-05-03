import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Spinner } from '../components/Spinner';

/**
 * ProgramDetailPage — redirect wrapper.
 * Resolves the program's client_id, then redirects to the unified
 * Client Command Center at /clients/:clientId?program=:programId.
 */
export function ProgramDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        (async () => {
            const { data, error } = await supabase
                .from('programs')
                .select('client_id')
                .eq('id', id)
                .single();

            if (data?.client_id) {
                setRedirectUrl(`/clients/${data.client_id}?program=${id}`);
            } else {
                console.error('Could not resolve program client:', error);
                setRedirectUrl('/');
            }
            setLoading(false);
        })();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 gap-2 text-text-muted">
                <Spinner size="sm" />
                <span className="text-sm">מעבר לדף הלקוח...</span>
            </div>
        );
    }
    if (redirectUrl) return <Navigate to={redirectUrl} replace />;
    return null;
}
