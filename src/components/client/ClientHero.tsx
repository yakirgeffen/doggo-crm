import { Dog, Mail, Phone, MessageCircle } from 'lucide-react';
import type { Client } from '../../types';

interface ClientHeroProps {
    client: Client;
}

export function ClientHero({ client }: ClientHeroProps) {
    return (
        <div className="flat-card p-0 overflow-hidden mb-6">
            {/* Hero banner */}
            <div className="bg-gradient-to-bl from-primary/10 via-accent/5 to-transparent px-6 pt-6 pb-4">
                <div className="flex items-start gap-5">
                    {/* Dog avatar */}
                    <div className="w-20 h-20 bg-surface rounded-xl flex items-center justify-center shadow-soft border border-border shrink-0">
                        <Dog size={32} className="text-primary opacity-90" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-text-primary leading-tight">
                            {client.primary_dog_name || 'ללא שם כלב'}
                        </h1>
                        <p className="text-sm text-text-secondary mt-0.5 font-medium">
                            {client.full_name}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                            הצטרף ב- {new Date(client.created_at).toLocaleDateString('he-IL')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Contact bar + tags */}
            <div className="px-6 py-4 border-t border-border-light space-y-3">
                {/* Contact actions */}
                <div className="flex items-center gap-3 flex-wrap">
                    {client.phone && (
                        <>
                            <a
                                href={`tel:${client.phone}`}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-text-primary hover:text-primary transition-colors bg-surface-warm px-3 py-1.5 rounded-lg"
                            >
                                <Phone size={14} className="text-text-muted" />
                                <span className="ltr-nums" dir="ltr">{client.phone}</span>
                            </a>
                            <a
                                href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-success bg-success/10 px-3 py-1.5 rounded-lg hover:bg-success/15 transition-colors"
                            >
                                <MessageCircle size={14} />
                                WhatsApp
                            </a>
                        </>
                    )}
                    {client.email && (
                        <a
                            href={`mailto:${client.email}`}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-primary hover:text-primary transition-colors bg-surface-warm px-3 py-1.5 rounded-lg"
                        >
                            <Mail size={14} className="text-text-muted" />
                            {client.email}
                        </a>
                    )}
                </div>

                {/* Behavioral tags */}
                {client.behavioral_tags && client.behavioral_tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {client.behavioral_tags.map((tag) => (
                            <span
                                key={tag}
                                className="text-xs font-medium bg-warning/10 text-warning px-2.5 py-1 rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
