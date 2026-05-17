import { useEffect, useState, useCallback } from 'react';
import { Search, Mail, Users, Phone, MessageCircle, ChevronRight, Upload, Zap, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type Client } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { ImportClientsModal } from '../components/ImportClientsModal';
import { QuickAddClientModal } from '../components/QuickAddClientModal';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { SkeletonRow } from '../components/Skeleton';
import { useSettings } from '../hooks/useSettings';
import { applyTemplate } from '../lib/whatsapp-template';
import { useIntro } from '../hooks/useIntro';
import { IntroModal } from '../components/IntroModal';
import { PAGE_INTROS } from '../lib/intro-content';
import { useToast } from '../context/toast-context';

export function ClientsPage() {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const { showToast } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<'name' | 'newest'>('name');
    const [loading, setLoading] = useState(true);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const intro = useIntro('clients');

    const fetchClients = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('full_name');

        if (error) {
            // PP-ERR-01: show friendly Hebrew error toast instead of silent console.error
            console.error('Error fetching clients:', error);
            showToast('שגיאה בטעינת רשימת הלקוחות — אנא רעננו את הדף.', 'error');
        } else {
            setClients(data || []);
        }
        setLoading(false);
    }, [showToast]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch, setState resolves after I/O
        fetchClients();
    }, [fetchClients]);

    const exportToCsv = () => {
        const csvEscape = (v: unknown): string => {
            if (v === null || v === undefined) return '';
            const s = String(v);
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };
        const header = ['שם מלא', 'שם הכלב', 'גזע', 'מייל', 'טלפון', 'מקור הליד', 'הערות', 'סטטוס', 'תאריך הצטרפות'];
        const rows = filteredClients.map(c => [
            csvEscape(c.full_name),
            csvEscape(c.primary_dog_name),
            csvEscape(c.primary_dog_breed),
            csvEscape(c.email),
            csvEscape(c.phone),
            csvEscape(c.lead_source),
            csvEscape(c.notes),
            csvEscape(c.is_active ? 'פעיל' : 'לא פעיל'),
            csvEscape(new Date(c.created_at).toLocaleDateString('he-IL')),
        ].join(','));
        const csv = '﻿' + [header.join(','), ...rows].join('\n'); // BOM for Hebrew/Excel
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `doggo-crm-clients-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const filteredClients = clients.filter((client) => {
        const matchesStatus =
            filter === 'all'
                ? true
                : filter === 'active'
                    ? client.is_active
                    : !client.is_active;

        const searchLower = search.toLowerCase();
        // PP-05: fixed boolean expression — removed erroneous `|| ''` that coerced to falsy string
        // when email is undefined/null. All four conditions are now explicitly boolean.
        const matchesSearch =
            client.full_name.toLowerCase().includes(searchLower) ||
            (client.primary_dog_name?.toLowerCase().includes(searchLower) ?? false) ||
            (client.primary_dog_breed?.toLowerCase().includes(searchLower) ?? false) ||
            (client.email?.toLowerCase().includes(searchLower) ?? false) ||
            (client.phone?.replace(/\D/g, '').includes(searchLower.replace(/\D/g, '')) ?? false);

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
                            {client.primary_dog_breed && <span className="text-text-muted/60">· {client.primary_dog_breed}</span>}
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
                            onClick={exportToCsv}
                            disabled={clients.length === 0}
                            className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            title={clients.length === 0 ? 'אין לקוחות לייצוא' : 'ייצא את הלקוחות הנבחרים ל-CSV'}
                        >
                            <Download size={18} className="ms-2" />
                            ייצא CSV
                        </button>
                        <button
                            onClick={() => setIsImportOpen(true)}
                            className="btn btn-secondary"
                        >
                            <Upload size={18} className="ms-2" />
                            ייבוא CSV
                        </button>
                        <button
                            onClick={() => setIsQuickAddOpen(true)}
                            className="btn btn-primary"
                        >
                            <Zap size={18} className="ms-2" />
                            + לקוח חדש
                        </button>
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

            <QuickAddClientModal
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
            />

            {/* Search & Sort */}
            <div className="flat-card p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="חיפוש לפי שם, כלב, אימייל או טלפון..."
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
                    {(['all', 'active', 'inactive'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
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
                    <div role="status" aria-label="טוען נתונים">
                        {[0, 1, 2, 3, 4].map(i => (
                            <SkeletonRow key={i} />
                        ))}
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
                                <div key={client.id} className="relative">
                                    <Link
                                        to={`/clients/${client.id}`}
                                        className="p-4 flex items-center justify-between active:bg-surface-warm transition-colors pe-20"
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
                                                        {client.primary_dog_breed && <span className="text-text-muted/60"> · {client.primary_dog_breed}</span>}
                                                    </span>
                                                    {client.is_active && (
                                                        <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <ChevronRight size={20} className="opacity-50 absolute end-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                    </Link>
                                    {client.phone && (() => {
                                        const phoneDigits = client.phone.replace(/[^\d]/g, '');
                                        const intl = phoneDigits.startsWith('0') ? '972' + phoneDigits.slice(1) : phoneDigits;
                                        const firstName = client.full_name.split(' ')[0];
                                        const dogName = client.primary_dog_name || '';
                                        // Match ClientHero fallback shape — drop the dog clause when missing.
                                        const greetingFallback = dogName
                                            ? `היי ${firstName} 🐾 מה שלומכם ושלום ${dogName}?`
                                            : `היי ${firstName} 🐾`;
                                        const greetingText = applyTemplate(
                                            settings?.wa_template_greeting ?? null,
                                            { firstName, dogName },
                                            greetingFallback
                                        );
                                        const greeting = encodeURIComponent(greetingText);
                                        return (
                                            <>
                                                <a
                                                    href={`https://wa.me/${intl}?text=${greeting}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    aria-label={`WhatsApp ל${client.full_name}`}
                                                    className="absolute end-20 top-1/2 -translate-y-1/2 p-2 rounded-lg text-text-muted hover:bg-success/10 hover:text-success transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                                                >
                                                    <MessageCircle size={18} />
                                                </a>
                                                <a
                                                    href={`tel:${client.phone}`}
                                                    aria-label={`התקשרות ל${client.full_name}`}
                                                    className="absolute end-12 top-1/2 -translate-y-1/2 p-2 rounded-lg text-text-muted hover:bg-background hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                                                >
                                                    <Phone size={18} />
                                                </a>
                                            </>
                                        );
                                    })()}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <IntroModal
                isOpen={intro.shouldShow}
                pageId="clients"
                intro={PAGE_INTROS.clients}
                onDismiss={intro.dismiss}
                onSkip={intro.dismiss}
                onBackdropClose={intro.closeForSession}
            />
        </div>
    );
}
