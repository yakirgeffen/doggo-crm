import { useEffect, useState } from 'react';
import { Plus, Search, Mail, Users, Phone, ChevronRight, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type Client } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { ImportClientsModal } from '../components/ImportClientsModal';
import { DataTable, type DataTableColumn } from '../components/DataTable';

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

    const clientColumns: DataTableColumn<Client>[] = [
        {
            key: 'client',
            label: 'לקוח וכלב',
            render: (client) => (
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-lg font-bold text-text-primary">
                        {client.full_name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-bold text-text-primary group-hover:text-primary transition-colors">{client.full_name}</div>
                        <div className="text-xs font-medium text-text-muted flex items-center gap-1.5 bg-background w-fit px-2 py-0.5 rounded-md mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            {client.primary_dog_name || 'אין כלב'}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'contact',
            label: 'פרטי קשר',
            render: (client) => (
                <div>
                    <div className="text-sm font-medium text-text-primary">{client.email}</div>
                    <div className="text-xs text-text-muted ltr-nums mt-0.5" dir="ltr">{client.phone}</div>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'סטטוס',
            render: (client) => (
                client.is_active
                    ? <span className="badge badge-active">פעיל</span>
                    : <span className="badge badge-muted">לא פעיל</span>
            ),
        },
        {
            key: 'actions',
            label: 'פעולות',
            cellClassName: 'px-8 py-5 text-left',
            render: (client) => (
                <div className="flex justify-end gap-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <Link
                        to={`/clients/${client.id}?action=email`}
                        className="p-2.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                        aria-label={`שלח אימייל ל${client.full_name}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Mail size={18} />
                    </Link>
                    <Link
                        to={`/clients/${client.id}`}
                        className="btn btn-secondary text-sm py-2 px-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        פרופיל
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <PageHeader
                title="לקוחות"
                subtitle="ניהול קשרי לקוחות ומעקב אחר התקדמות"
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsImportOpen(true)}
                            className="btn btn-secondary"
                        >
                            <Upload size={18} className="ms-2" />
                            ייבוא CSV
                        </button>
                        <Link to="/clients/new" className="btn btn-primary">
                            <Plus size={18} className="ms-2" />
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

            {/* Search & Sort */}
            <div className="flat-card p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="חיפוש לפי שם, כלב או אימייל..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field w-full pe-12 ps-4"
                        aria-label="חיפוש לקוחות"
                    />
                </div>
                <div className="w-48">
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as 'name' | 'newest')}
                        className="input-field w-full"
                        aria-label="מיון לקוחות"
                    >
                        <option value="newest">התווספו לאחרונה</option>
                        <option value="name">מיון לפי שם</option>
                    </select>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 items-center text-sm font-medium text-text-muted">
                <span className="ms-2">הצג:</span>
                <div className="flex bg-background border border-border rounded-lg p-1" role="tablist" aria-label="סינון לפי סטטוס">
                    {['all', 'active', 'inactive'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            role="tab"
                            aria-selected={filter === f}
                            className={`px-4 py-1.5 rounded-md transition-all text-sm ${filter === f ? 'bg-surface text-primary shadow-soft font-medium' : 'hover:bg-surface-warm'}`}
                        >
                            {f === 'all' ? 'הכל' : f === 'active' ? 'פעיל' : 'לא פעיל'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Clients List */}
            <div className="flat-card p-0 overflow-hidden">
                {loading ? (
                    <div className="py-24 text-center" role="status" aria-label="טוען נתונים">
                        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4 opacity-50"></div>
                        <p className="text-text-muted font-medium">טוען נתונים...</p>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="לא נמצאו לקוחות"
                        description={filter === 'all' ? "רשימת הלקוחות ריקה. זה הזמן להוסיף את הלקוח הראשון!" : "לא נמצאו לקוחות התואמים את הסינון הנוכחי."}
                        actionLabel={filter === 'all' ? "הוסף לקוח חדש" : undefined}
                        onAction={filter === 'all' ? () => navigate('/clients/new') : undefined}
                        color="primary"
                    />
                ) : (
                    <>
                        {/* Desktop View - DataTable */}
                        <div className="hidden md:block">
                            <DataTable
                                columns={clientColumns}
                                data={filteredClients}
                                getRowKey={(c) => c.id}
                                onRowClick={(c) => navigate(`/clients/${c.id}`)}
                                caption="רשימת לקוחות"
                            />
                        </div>

                        {/* Mobile View - Cards */}
                        <div className="md:hidden grid gap-0 divide-y divide-border-light">
                            {filteredClients.map((client) => (
                                <Link
                                    key={client.id}
                                    to={`/clients/${client.id}`}
                                    className="p-4 flex items-center justify-between active:bg-surface-warm transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-lg font-bold border border-primary/20">
                                            {client.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-text-primary text-base">{client.full_name}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs bg-background text-text-muted px-2 py-0.5 rounded-md font-medium">
                                                    {client.primary_dog_name || 'אין כלב'}
                                                </span>
                                                {client.is_active && (
                                                    <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 text-text-muted">
                                        <div className="p-2 rounded-lg hover:bg-background" onClick={(e) => {
                                            e.preventDefault();
                                            window.location.href = `tel:${client.phone}`;
                                        }}>
                                            <Phone size={18} />
                                        </div>
                                        <ChevronRight size={20} className="opacity-50" />
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
