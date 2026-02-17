import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { type DashboardStats, type SessionWithProgram, type ActionItem, type ProgramWithClient } from '../types/dashboard';

export function useDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        activeClients: 0,
        activePrograms: 0,
        sessionsThisMonth: 0,
        pendingPayment: 0
    });

    const [actionItems, setActionItems] = useState<ActionItem[]>([]);
    const [todaysSessions, setTodaysSessions] = useState<SessionWithProgram[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const [
                { count: clientCount },
                { count: programCount },
                { count: sessionCount },
                { count: paymentCount },
                { data: todayData }
            ] = await Promise.all([
                supabase.from('clients').select('*', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('sessions').select('*', { count: 'exact', head: true }).gte('session_date', startOfMonth.toISOString()),
                supabase.from('programs').select('*', { count: 'exact', head: true }).eq('payment_status', 'pending'),
                supabase.from('sessions')
                    .select('id, session_date, session_number, programs(id, program_name, sessions_included, clients(id, full_name, primary_dog_name, phone))')
                    .gte('session_date', startOfDay.toISOString())
                    .lt('session_date', endOfDay.toISOString())
                    .order('session_date', { ascending: true })
            ]);

            setStats({
                activeClients: clientCount || 0,
                activePrograms: programCount || 0,
                sessionsThisMonth: sessionCount || 0,
                pendingPayment: paymentCount || 0
            });

            if (todayData) {
                // Supabase returns deeply nested objects that match our interface structure
                // We trust the query matches the SessionWithProgram interface
                setTodaysSessions(todayData as unknown as SessionWithProgram[]);
            }

            // Build unified action feed
            const items: ActionItem[] = [];

            const { data: activeProgs } = await supabase
                .from('programs')
                .select('*, clients(id, full_name, primary_dog_name)')
                .eq('status', 'active')
                .eq('program_type', 'fixed_sessions');

            if (activeProgs) {
                // Strong typing for joined data
                const typedProgs = activeProgs as unknown as ProgramWithClient[];
                typedProgs.forEach(p => {
                    if (p.sessions_included && (p.sessions_completed / p.sessions_included) >= 0.8) {
                        items.push({ type: 'renewal', program: p });
                    }
                });
            }

            const { data: unpaid } = await supabase
                .from('programs')
                .select('*, clients(id, full_name, primary_dog_name)')
                .eq('payment_status', 'pending')
                .limit(10);

            if (unpaid) {
                const typedUnpaid = unpaid as unknown as ProgramWithClient[];
                typedUnpaid.forEach(p => {
                    items.push({ type: 'unpaid', program: p });
                });
            }

            setActionItems(items.slice(0, 6));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    return { stats, actionItems, todaysSessions, loading, refresh: fetchDashboardData };
}
