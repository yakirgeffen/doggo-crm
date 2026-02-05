import { useEffect, useState } from 'react';
import { Plus, Search, Mail, Users, Phone, ChevronLeft, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type Client } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { ImportClientsModal } from '../components/ImportClientsModal';

export function ClientsPage() {
    const navigate = useNavigate();
    const [clients, setClients] = useState<Client[]>([]);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<'name' | 'newest'>('name');
    const [loading, setLoading] = useState(true);
    const [isImportOpen, setIsImportOpen] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        // We fetch all and sort client-side for V1 simplicity
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('full_name');

        if (error) {
            console.error('Error fetching clients:', error);
        } else {
            setClients(data || []);
        }
        setLoading(false);
    };

    const filteredClients = clients.filter((client) => {
        const matchesStatus =
            filter === 'all'
                ? true
                : filter === 'active'
                    ? client.is_active
                    : !client.is_active;

        const searchLower = search.toLowerCase();
        const matchesSearch =
            client.full_name.toLowerCase().includes(searchLower) ||
            client.primary_dog_name?.toLowerCase().includes(searchLower) ||
            client.email?.toLowerCase().includes(searchLower) || '';

        return matchesStatus && matchesSearch;
    }).sort((a, b) => {
        if (sort === 'name') return a.full_name.localeCompare(b.full_name);
        if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return 0;
    });

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12">
            <PageHeader
                title="לקוחות"
                subtitle="ניהול קשרי לקוחות ומעקב אחר התקדמות"
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsImportOpen(true)}
                            className="btn bg-white border border-[var(--color-border)] text-[var(--color-text-main)] hover:bg-gray-50 transition-all"
                        >
                            <Upload size={20} className="ml-2" />
                            ייבוא CSV
                        </button>
                        <Link to="/clients/new" className="btn btn-primary shadow-lg shadow-green-900/10 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                            <Plus size={20} className="ml-2" />
                            לקוח חדש
                        </Link>
                    </div>
                }
            />

            <ImportClientsModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onComplete={() => {
                    fetchClients();
                    setIsImportOpen(false);
                }}
            />

            <div className="flat-card p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
                    <input
                        type="text"
                        placeholder="חיפוש לפי שם, כלב או אימייל..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field w-full pr-12 pl-4 py-3.5 bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] shadow-sm"
                    />
                </div>
                <div className="w-48">
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as 'name' | 'newest')}
                        className="input-field w-full py-3.5 bg-white shadow-sm"
                    >
                        <option value="newest">התווספו לאחרונה</option>
                        <option value="name">מיון לפי שם</option>
                    </select>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-8 items-center text-sm font-bold text-[var(--color-text-muted)]">
                <span className="ml-2">הצג:</span>
                <div className="flex bg-[var(--color-bg-app)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-1">
                    {['all', 'active', 'inactive'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-1.5 rounded-md transition-all ${filter === f ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'hover:bg-black/5'}`}
                        >
                            {f === 'all' ? 'הכל' : f === 'active' ? 'פעיל' : 'לא פעיל'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Clients List */}
            <div className="flat-card p-0 overflow-hidden">
                {loading ? (
                    <div className="py-24 text-center">
                        <div className="animate-spin w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-4 opacity-50"></div>
                        <p className="text-[var(--color-text-muted)] font-medium">טוען נתונים...</p>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="לא נמצאו לקוחות"
                        description={filter === 'all' ? "רשימת הלקוחות ריקה. זה הזמן להוסיף את הלקוח הראשון!" : "לא נמצאו לקוחות התואמים את הסינון הנוכחי."}
                        actionLabel={filter === 'all' ? "הוסף לקוח חדש" : undefined}
                        onAction={filter === 'all' ? () => navigate('/clients/new') : undefined}
                        color="green"
                    />
                ) : (
                    <>
                        {/* Desktop View - Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-[var(--color-bg-app)] border-b border-[var(--color-border)]">
                                    <tr className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                                        <th className="px-6 py-4 font-bold">לקוח וכלב</th>
                                        <th className="px-6 py-4 font-bold">פרטי קשר</th>
                                        <th className="px-6 py-4 font-bold">סטטוס</th>
                                        <th className="px-6 py-4 font-bold">פעולות</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {filteredClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-[var(--color-bg-app)]/50 transition-all duration-200 group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border)] flex items-center justify-center text-lg font-bold text-[var(--color-text-main)]">
                                                        {client.full_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[var(--color-text-main)] group-hover:text-[var(--color-primary)] transition-colors">{client.full_name}</div>
                                                        <div className="text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-1.5 bg-[var(--color-bg-app)] w-fit px-2 py-0.5 rounded-full mt-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"></span>
                                                            {client.primary_dog_name || 'אין כלב'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-[var(--color-text-main)]">{client.email}</div>
                                                <div className="text-xs text-[var(--color-text-muted)] dir-ltr font-mono mt-0.5">{client.phone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {client.is_active ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-green-100 text-green-800">
                                                        פעיל
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-[var(--color-bg-app)] text-[var(--color-text-muted)]">
                                                        לא פעיל
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5 text-left">
                                                <div className="flex justify-end gap-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    <Link
                                                        to={`/clients/${client.id}?action=email`}
                                                        className="p-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-accent)] rounded-lg transition-all"
                                                        title="שלח אימייל"
                                                    >
                                                        <Mail size={18} />
                                                    </Link>
                                                    <Link
                                                        to={`/clients/${client.id}`}
                                                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-bold bg-white border border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:text-white hover:border-transparent transition-all"
                                                    >
                                                        פרופיל
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View - Cards */}
                        <div className="md:hidden grid gap-3">
                            {filteredClients.map((client) => (
                                <Link
                                    key={client.id}
                                    to={`/clients/${client.id}`}
                                    className="flat-card p-4 flex items-center justify-between active:scale-[0.99] transition-transform"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-[var(--color-accent)] text-[var(--color-primary)] flex items-center justify-center text-lg font-bold border border-[var(--color-primary)]/20">
                                            {client.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[var(--color-text-main)] text-base">{client.full_name}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs bg-[var(--color-bg-app)] text-[var(--color-text-muted)] px-2 py-0.5 rounded-md font-bold">
                                                    {client.primary_dog_name || 'אין כלב'}
                                                </span>
                                                {client.is_active && (
                                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 text-[var(--color-text-muted)]">
                                        <div className="p-2 rounded-full hover:bg-[var(--color-bg-app)]" onClick={(e) => {
                                            e.preventDefault();
                                            window.location.href = `tel:${client.phone}`;
                                        }}>
                                            <Phone size={18} />
                                        </div>
                                        <ChevronLeft size={20} className="rtl:rotate-180 opacity-50" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
